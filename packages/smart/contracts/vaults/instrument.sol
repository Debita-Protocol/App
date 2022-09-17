
// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.4;

import "./vault.sol";
import {ERC20} from "./tokens/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../prb/PRBMathUD60x18.sol";


/// @notice Minimal interface for Vault compatible strategies.
abstract contract Instrument {

    modifier onlyUtilizer() {
        require(msg.sender == Utilizer, "!Utilizer");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == Utilizer || msg.sender == vault.owner(), "!authorized");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == address(vault), "caller must be vault");
        _;
    }

    modifier notLocked() {
        require(!locked); 
        _; 
    }

    constructor (
        address _vault,
        address _Utilizer
    ) {
        vault = Vault(_vault);
        underlying = ERC20(vault.UNDERLYING());
        underlying.approve(_vault, MAX_UINT); // Give Vault unlimited access 
        Utilizer = _Utilizer;
    }


    ERC20 public underlying;
    Vault public vault; 
    bool locked; 
    uint256 private constant MAX_UINT = 2**256 - 1;
    uint256 private maturity_balance; 
    /// @notice address of user who submits the liquidity proposal 
    address Utilizer; 

    /// @notice initializes a new Instrument
    /// DEPRECATED
    function _initialize(
        address _vault,
        address _Utilizer
    ) internal {
        vault = Vault(_vault);
        underlying = ERC20(vault.UNDERLYING());
        underlying.approve(_vault, MAX_UINT); // Give Vault unlimited access 
        Utilizer = _Utilizer;

    }

    /**
     @notice hooks for approval logic that are specific to each instrument type, called by controller for approval/default logic
     */
    function onMarketApproval(uint256 principal, uint256 yield) virtual external {}

    function setUtilizer(address _Utilizer) external onlyAuthorized {
        require(_Utilizer != address(0));
        Utilizer = _Utilizer;
    }




    /// @notice Withdraws a specific amount of underlying tokens from the Instrument.
    /// @param amount The amount of underlying tokens to withdraw.
    /// @return An error code, or 0 if the withdrawal was successful.
    function redeemUnderlying(uint256 amount) external onlyVault returns (bool){
        return underlying.transfer(address(vault), amount); 
    }

    /// @notice Returns a user's Instrument balance in underlying tokens.
    /// @param user The user to get the underlying balance of.
    /// @return The user's Instrument balance in underlying tokens.
    /// @dev May mutate the state of the Instrument by accruing interest.
    function balanceOfUnderlying(address user) public view returns (uint256){
        return underlying.balanceOf(user); 
        }


    /**
     * @notice
     *  Provide an accurate estimate for the total amount of assets
     *  (principle + return) that this Instrument is currently managing,
     *  denominated in terms of Underlying tokens.
     *
     *  This total should be "realizable" e.g. the total value that could
     *  *actually* be obtained from this Instrument if it were to divest its
     *  entire position based on current on-chain conditions.
     * @dev
     *  Care must be taken in using this function, since it relies on external
     *  systems, which could be manipulated by the attacker to give an inflated
     *  (or reduced) value produced by this function, based on current on-chain
     *  conditions (e.g. this function is possible to influence through
     *  flashloan attacks, oracle manipulations, or other DeFi attack
     *  mechanisms).
     *
     *  It is up to governance to use this function to correctly order this
     *  Instrument relative to its peers in the withdrawal queue to minimize
     *  losses for the Vault based on sudden withdrawals. This value should be
     *  higher than the total debt of the Instrument and higher than its expected
     *  value to be "safe".
     *  Estimated Total assets should be 

     * @return The estimated total assets in this Strategy.
     */
    function estimatedTotalAssets() public view virtual returns (uint256){}

    /**
     * Free up returns for vault to pull
     * Perform any Instrument divesting + unwinding or other calls necessary to capture the
     * "free return" this Instrument has generated since the last time its core
     * position(s) were adjusted. Examples include unwrapping extra rewards.
     * This call is only used during "normal operation" of a Instrument, and
     * should be optimized to minimize losses as much as possible.
     *
     * This method returns any realized profits and/or realized losses
     * incurred, and should return the total amounts of profits/losses/debt
     * payments (in `underlying` tokens) for the Vault's accounting (e.g.
     * `underlying.balanceOf(this) >= principal + profit`).
     *
     * param _debtPayment is the total amount expected to be returned to the vault
     */

    /// @notice checks if the instrument is ready to be withdrawed, i.e all 
    /// loans have been paid, all non-underlying have been liquidated, etc
    function readyForWithdrawal() public view virtual returns(bool){
        return true; 
    }

    /// @notice checks whether the vault can withdraw and record profit from this instrument 
    /// for this instrument to resolve 
    /// For creditlines, all debts should be repaid
    /// for strategies, all assets should be divested + converted to Underlying
    /// this function is important in preventing manipulations, 
    /// @dev prepareWithdraw->vault.beforeResolve->vault.resolveInstrument in separate txs
    function prepareWithdraw()
        external 
        onlyVault 
        virtual
        returns (
            uint256 _profit,
            uint256 _loss,
            uint256 _debtPayment
        ){
            require(readyForWithdrawal()); 

            // Lock additional drawdowns or usage of instrument balance 
            lockLiquidityFlow();    

        }

    /**
     * Liquidate up to `_amountNeeded` of `underlying` of this strategy's positions,
     * irregardless of slippage. Any excess will be re-invested with `adjustPosition()`.
     * This function should return the amount of `underlying` tokens made available by the
     * liquidation. If there is a difference between them, `_loss` indicates whether the
     * difference is due to a realized loss, or if there is some other sitution at play
     * (e.g. locked funds) where the amount made available is less than what is needed.
     *
     * NOTE: The invariant `_liquidatedAmount + _loss <= _amountNeeded` should always be maintained
     */
    function liquidatePosition(uint256 _amountNeeded) public  virtual returns (uint256 _liquidatedAmount, uint256 _loss){}

    /**
     * Liquidate everything and returns the amount that got freed.
     * This function is used during emergency exit instead of `prepareReturn()` to
     * liquidate all of the instrument's positions back to the Vault.
     */
    function liquidateAllPositions() public  virtual returns (uint256 _amountFreed){}

    function lockLiquidityFlow() internal{
        locked = true; 
    }

    function isLocked() public view returns(bool){
        return locked; 
    }


    function transfer_liq(address to, uint256 amount) internal notLocked {
        underlying.transfer(to, amount);
    }

    function transfer_liq_from(address from, address to, uint256 amount) internal notLocked {
        underlying.transferFrom(from, to, amount);

    }

    /// @notice called before resolve, to avoid calculating redemption price based on manipulations 
    function store_internal_balance() external onlyVault{
        maturity_balance = balanceOfUnderlying(address(this)); 
    }

    function getMaturityBalance() public view returns(uint256){
        return maturity_balance; 
    }


    /// @notice Before supplying liquidity from the vault to this instrument,
    /// which is done automatically when instrument is trusted, 
    /// need to check if certain conditions that are required to this specific 
    /// instrument is met. For example, for a creditline with a collateral 
    /// requirement need to check if this address has the specific amount of collateral
    /// @dev called to be checked at the approve phase from controller  
    function instrumentApprovalCondition() public virtual view returns(bool); 



}


// contract RevenueToken is ERC20{

// }

 
/// @notice Contract for unsecured loans, each instance will be associated to a borrower+marketId
/// approved borrowers will interact with this contract to borrow, repay. 
/// and vault will supply principal and harvest principal/interest 
contract CreditLine is Instrument {

    //  variables initiated at creation
    uint256  principal;
    uint256  notionalInterest; 
    uint256  faceValue; //total amount due, i.e principal+interest
    uint256  duration; 

    // Modify-able Variables during repayments, borrow
    uint256 totalOwed; 
    uint256 principalOwed; 
    uint256 interestOwed;

    // Collateral Info 
    enum CollateralType{
        liquidateAble, 
        nonLiquid, 
        tokenizedRevenue 
    }
    address public collateral; 
    address public oracle; 
    uint256 public collateral_balance; 
    CollateralType public collateral_type; 

    uint256 drawdown_block; 
    bool didDrawdown; 

    enum LoanStatus{
        notDrawdowned,
        drawdowned, 
        partially_repayed,
        prepayment_fulfilled, 
        matured, 
        grace_period, 
        isDefault
    }
    LoanStatus public loanStatus; 

    /// @notice both _collateral and _oracle could be 0
    /// address if fully uncollateralized or does not have a price oracle 
    /// param _notionalInterest and _principal is initialized as desired variables
    constructor(
        address vault,
        address borrower, 
        uint256 _principal,
        uint256 _notionalInterest, 
        uint256 _duration,
        uint256 _faceValue,

        address _collateral, //collateral for the dao, could be their own native token or some tokenized revenue 
        address _oracle, // oracle for price of collateral 
        uint256 _collateral_balance, //promised collateral balance
        uint256 _collateral_type 
    )  Instrument(vault, borrower){
        principal = _principal; 
        notionalInterest = _notionalInterest; 
        duration = _duration;   
        faceValue = _faceValue;
        interestOwed = _notionalInterest;

        collateral = _collateral; 
        oracle = _oracle; 
        collateral_balance = _collateral_balance; 
        collateral_type = CollateralType(_collateral_type); 
    }

    function setValidator(address _validator) external onlyVault{

    }

    function getApprovedBorrowConditions() public view returns(uint256, uint256){
        if (vault.isTrusted(this)) return(principal, notionalInterest) ;

        return (0,0); 
    }

    /// @notice if possible, and borrower defaults, liquidates given collateral to underlying
    /// and push back to vault. If not possible, push the collateral back to
    function liquidateAndPushToVault() public virtual onlyVault{}

    function escrowCollateral(uint256 amount, address to) public virtual onlyVault{
        ERC20(collateral).transfer(to, amount); 
    }

    function isLiquidatable(address collateral) public view returns(bool){}

    /// @notice if collateral is liquidateable and has oracle, fetch value of collateral 
    /// and return ratio to principal 
    function getCollateralRatio() public view returns(uint256){

    }

    function instrumentApprovalCondition() public override view returns(bool){
        // check if borrower has correct identity 

        // check if enough collateral has been added as agreed   
        if (collateral != address(0)) require(ERC20(collateral).balanceOf(address(this)) >= collateral_balance, 
                "Insufficient collateral"); 

        return true; 
    } 

    /// @notice borrower deposit promised collateral  
    function depositCollateral(uint256 amount) external onlyUtilizer {
        require(collateral!= address(0)); 
        ERC20(collateral).transferFrom(msg.sender, address(this), amount); 
    }

    /// @notice can only redeem collateral when debt is fully paid 
    function releaseAllCollateral() external onlyUtilizer{
        require(loanStatus == LoanStatus.matured); 
        ERC20(collateral).transfer(msg.sender,collateral_balance); 
    }

    function onDefault() external onlyVault{
        // If collateral is liquidateable, liquidate and push to vault
        if (isLiquidatable(collateral)) {
        liquidateAndPushToVault(); 
        }
        // If collateral is not, just escrow it to vault?

        // If tokenizedRevenue, calculate revenue to be escrowed and transfer it to vault 
    }

    /// @notice starting from the moment the borrower drawdowns, compute
    /// the interest for the returned principal 
    function getAccruedInterest(uint256 repay_principal) public view returns(uint256){
    }

    function handle_prepayment() internal {}

    function declareDefault() external {}
    /// @param quoted_yield is in notional amount denominated in underlying, which is the area between curve and 1 at the x-axis point 
    /// where area under curve is max_principal 
    function onMarketApproval(uint256 max_principal, uint256 quoted_yield)  external override onlyVault {
        principal = max_principal; 
        notionalInterest = quoted_yield; 
    }


    /// @notice Allows a borrower to borrow on their creditline.
    /// This creditline allows only lump sum drawdowns, all approved principal needs to be borrowed
    /// which would start the interest timer 
    function drawdown() external onlyUtilizer{
        require(vault.isTrusted(this), "Not approved");
        // require(underlying.balanceOf(address(this)) > amount, "Exceeds Credit");
        require(!didDrawdown, "Already borrowed"); 
        didDrawdown = true; 

        drawdown_block = block.timestamp; 
        totalOwed = principal + notionalInterest; 
        principalOwed = principal; 
        transfer_liq(msg.sender, principal); 
    }

    /// @notice allows a borrower to repay their loan
    function repay(uint256 repay_principal, uint256 repay_interest) external onlyUtilizer{
        require(vault.isTrusted(this), "Not approved");

        if (block.timestamp <= drawdown_block + duration) handle_prepayment(); 

        transfer_liq_from(msg.sender, address(this), repay_principal + repay_interest);

        if(handleRepay(repay_principal, repay_interest)) vault.pingMaturity(address(this)); 
    }   

    /// @notice updates balances after repayment
    /// need to remove min.
    function handleRepay(uint256 repay_principal, uint256 repay_interest) internal returns(bool){
        totalOwed -= Math.min((repay_principal + repay_interest), totalOwed); 
        principalOwed -= Math.min(repay_principal, principalOwed);
        interestOwed -= Math.min(repay_interest, interestOwed);

        bool isMatured = totalOwed == 0 ? true : false; 
        return isMatured; 
         
    }





}

