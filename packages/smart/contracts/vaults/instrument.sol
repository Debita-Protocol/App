
// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.4;

import "./vault.sol";
import {ERC20} from "./tokens/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {FixedPointMathLib} from "./utils/FixedPointMathLib.sol";
import "hardhat/console.sol";


/// @notice Minimal interface for Vault compatible strategies.
abstract contract Instrument {

    modifier onlyUtilizer() {
        require(msg.sender == Utilizer, "!Utilizer");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == vault.owner() || isValidator[msg.sender], "!authorized");
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
    address public Utilizer; 
    address[] public validators; //set when deployed, but can't be ch
    mapping(address=>bool) isValidator; 

    /**
     @notice hooks for approval logic that are specific to each instrument type, called by controller for approval/default logic
     */
    function onMarketApproval(uint256 principal, uint256 yield) virtual external {}

    function setUtilizer(address _Utilizer) external onlyAuthorized {
        require(_Utilizer != address(0));
        Utilizer = _Utilizer;
    }

    // function setValidator(address _validator) external {
    //     require(msg.sender == vault.owner(), "Not owner"); 
    //     validators.push(_validator); 
    //     isValidator[_validator] = true;     
    // }


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


    /// @notice Free up returns for vault to pull,  checks if the instrument is ready to be withdrawed, i.e all 
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
            require(readyForWithdrawal(), "not ready to withdraw"); 

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
        if (vault.decimal_mismatch()) amount = vault.decSharesToAssets(amount); 
        underlying.transfer(to, amount);
    }

    function transfer_liq_from(address from, address to, uint256 amount) internal notLocked {
        if (vault.decimal_mismatch()) amount = vault.decSharesToAssets(amount); 
        underlying.transferFrom(from, to, amount);
    }

    /// @notice called before resolve, to avoid calculating redemption price based on manipulations 
    function store_internal_balance() external onlyVault{

        maturity_balance = balanceOfUnderlying(address(this)); 
        if (vault.decimal_mismatch()) maturity_balance = vault.decAssetsToShares(maturity_balance); 

    }

    function getMaturityBalance() public view returns(uint256){
        return maturity_balance; 
    }

    function isLiquid(uint256 amount) public virtual view returns(bool){}


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
    using FixedPointMathLib for uint256;
    address public immutable borrower; 

    //  variables initiated at creation
    uint256 principal;
    uint256 notionalInterest; 
    uint256 faceValue; //total amount due, i.e principal+interest
    uint256 duration; // normalized to a year 1 means 1 year, 0.5 means 6 month 
    uint256 interestAPR; 

    // Modify-able Global Variables during repayments, borrow
    uint256 totalOwed; 
    uint256 principalOwed; 
    uint256 interestOwed;
    uint256 accumulated_interest; 
    uint256 principalRepayed;
    uint256 interestRepayed; 

    // Collateral Info 
    enum CollateralType{
        liquidateAble, 
        nonLiquid, 
        ownership 
    }
    address public collateral; 
    address public oracle; 
    uint256 public collateral_balance; 
    CollateralType public collateral_type; 

    uint256 drawdown_block; 
    bool didDrawdown; 

    uint256 gracePeriod; 
    uint256 resolveBlock; 
    uint256 constant DUST = 1e18; //1usd

    enum LoanStatus{
        notApproved,
        approvedNotDrawdowned,
        drawdowned, 
        partially_repayed,

        prepayment_fulfilled, 
        matured, 
        grace_period, 
        isDefault
    }

    LoanStatus public loanStatus; 

    uint256 lastRepaymentTime; 
    uint256 gracePeriodStart; 
    Proxy proxy; 

    /// @notice both _collateral and _oracle could be 0
    /// address if fully uncollateralized or does not have a price oracle 
    /// param _notionalInterest and _principal is initialized as desired variables
    constructor(
        address vault,
        address _borrower, 
        uint256 _principal,
        uint256 _notionalInterest, 
        uint256 _duration,
        uint256 _faceValue,
        address _collateral, //collateral for the dao, could be their own native token or some tokenized revenue 
        address _oracle, // oracle for price of collateral 
        uint256 _collateral_balance, //promised collateral balance
        uint256 _collateral_type
    )  Instrument(vault, _borrower) {
        borrower = _borrower; 
        principal = _principal; 
        notionalInterest = _notionalInterest; 
        duration = _duration;   
        faceValue = _faceValue;

        collateral = _collateral; 
        oracle = _oracle; 
        collateral_balance = _collateral_balance; 
        collateral_type = CollateralType(_collateral_type); 

        loanStatus = LoanStatus.notApproved; 

        proxy = new Proxy(address(this), _borrower); 
    }

    function getCurrentTime() internal view returns(uint256){
        return block.timestamp + 31536000/2; 
    }
    function getProxy() public view returns(address){
        return address(proxy); 
    }

    /// @notice checks if the creditline is ready to be withdrawed, i.e all 
    /// loans have been paid, all non-underlying have been liquidated, etc
    function readyForWithdrawal() public view override returns(bool){
        if (loanStatus == LoanStatus.matured || loanStatus == LoanStatus.isDefault
            || loanStatus == LoanStatus.prepayment_fulfilled) return true; 
        return true; 
        //return false  
    }

    function getApprovedBorrowConditions() public view returns(uint256, uint256){
        if (vault.isTrusted(this)) return(principal, notionalInterest) ;

        return (0,0); 
    }

    /// @notice if possible, and borrower defaults, liquidates given collateral to underlying
    /// and push back to vault. If not possible, push the collateral back to
    function liquidateAndPushToVault() internal  {}
    function auctionAndPushToVault() internal {} 
    function isLiquidatable(address collateral) public view returns(bool){}

    /// @notice if collateral is liquidateable and has oracle, fetch value of collateral 
    /// and return ratio to principal 
    function getCollateralRatio() public view returns(uint256){

    }
    /// @notice After grace period auction off ownership to some other party and transfer the funds back to vault 
    /// @dev assumes collateral has already been transferred to vault, needs to be checked by the caller 
    function liquidateOwnership(address buyer) public virtual onlyAuthorized{
        // TODO implement auction 
        proxy.changeOwnership(buyer);
    }

    /// @notice transfers collateral back to vault when default 
    function pushCollateralToVault(uint256 amount, address to) public virtual onlyAuthorized{
        require(loanStatus == LoanStatus.isDefault); 
        ERC20(collateral).transfer(to, amount); 
    }



    /// @notice validators have to check these conditions at a human level too before approving 
    function instrumentApprovalCondition() public override view returns(bool){
        // check if borrower has correct identity 

        // check if enough collateral has been added as agreed   
        if (collateral_type == CollateralType.liquidateAble || collateral_type == CollateralType.nonLiquid){
            require(ERC20(collateral).balanceOf(address(this)) >= collateral_balance, "Insufficient collateral"); 
        }

        // // check if validator(s) are set 
        // if (validators.length == 0) {revert("No validators"); }

        // Check if proxy has been given ownership
        if (collateral_type == CollateralType.ownership && proxy.numContracts() == 0) revert("Ownership "); 

        return true; 
    } 

    /// @notice borrower deposit promised collateral  
    function depositCollateral(uint256 amount) external onlyUtilizer {
        require(collateral!= address(0)); 
        ERC20(collateral).transferFrom(msg.sender, address(this), amount); 
    }

    /// @notice can only redeem collateral when debt is fully paid 
    function releaseAllCollateral() internal {
        require(loanStatus == LoanStatus.matured || loanStatus == LoanStatus.prepayment_fulfilled, "Loan status err"); 

        ERC20(collateral).transfer(msg.sender,collateral_balance); 
    }



    /// @notice should only be called when (portion of) principal is repayed
    function adjustInterestOwed() internal {

        uint256 remainingDuration = (drawdown_block + toSeconds(duration)) - getCurrentTime();

        interestOwed = interestAPR.mulWadDown(toYear(remainingDuration).mulWadDown(principalOwed)); 
    }

    /// @param quoted_yield is in notional amount denominated in underlying, which is the area between curve and 1 at the x-axis point 
    /// where area under curve is max_principal 
    function onMarketApproval(uint256 max_principal, uint256 quoted_yield)  external override onlyVault {
        principal = max_principal; 
        notionalInterest = quoted_yield; //this accounts for duration as well
        interestAPR = quoted_yield.divWadDown(duration.mulWadDown(principal)); 

        loanStatus = LoanStatus.approvedNotDrawdowned;
    }

    function onMaturity() external onlyUtilizer {
        require(loanStatus == LoanStatus.prepayment_fulfilled || loanStatus == LoanStatus.matured,"Not matured"); 
        require(block.number > resolveBlock, "Block equal"); 

        if (collateral_type == CollateralType.liquidateAble || collateral_type == CollateralType.nonLiquid ){
            releaseAllCollateral(); 
        }

        else proxy.changeOwnership(borrower);
        
        bool isPrepaid = loanStatus == LoanStatus.prepayment_fulfilled? true:false;
        // Write to storage resolve details (principal+interest repaid, is prepaid, etc) 
        vault.pingMaturity(address(this), isPrepaid); 

    }

    /// @notice borrower can see how much to repay now starting from last repayment time, also used to calculated
    /// how much interest to repay for the current principalOwed, which can be changed 
    function interestToRepay() public view returns(uint256){

        // Normalized to year
        uint256 elapsedTime = toYear(getCurrentTime() - lastRepaymentTime);
        // Owed interest from last timestamp till now  + any unpaid interest that has accumulated
        return elapsedTime.mulWadDown(interestAPR.mulWadDown(principalOwed)) + accumulated_interest ; 
    }
     
    /// @notice Allows a borrower to borrow on their creditline.
    /// This creditline allows only lump sum drawdowns, all approved principal needs to be borrowed
    /// which would start the interest timer 
    function drawdown() external onlyUtilizer{
        require(vault.isTrusted(this), "Not approved");
        require(loanStatus == LoanStatus.approvedNotDrawdowned, "Already borrowed"); 
        loanStatus = LoanStatus.drawdowned; 

        drawdown_block = block.timestamp; 
        lastRepaymentTime = block.timestamp;//-31536000/2; 

        totalOwed = principal + notionalInterest; 
        principalOwed = principal; 
        interestOwed = notionalInterest;

        transfer_liq(msg.sender, principal); 
    }

    /// @notice allows a borrower to repay their loan
    /// Standard repayment structure is repaying interest for the owed principal periodically and
    /// whenever principal is repayed interest owed is decreased proportionally 
    function repay( uint256 _repay_amount) external onlyUtilizer{
        require(vault.isTrusted(this), "Not approved");

        uint256 owedInterest = interestToRepay(); 
        uint256 repay_principal; 
        uint256 repay_interest = _repay_amount; 

        // Push remaineder to repaying principal 
        if (_repay_amount >= owedInterest){
            repay_principal += (_repay_amount - owedInterest);  
            repay_interest = owedInterest; 
            accumulated_interest = 0; 
        }

        //else repay_amount is less than owed interest, accumulate the debt 
        else accumulated_interest = owedInterest - repay_interest;

        if(handleRepay(repay_principal, repay_interest)){

            // Save resolve block, so that onMaturity can be called later
            resolveBlock = block.number; 

            // Prepayment //TODO cases where repayed a significant portion at the start but paid rest at maturity date
            if (isPaymentPremature()) loanStatus = LoanStatus.prepayment_fulfilled; 

            // Repayed at full maturity 
            else loanStatus = LoanStatus.matured; 

        }

        lastRepaymentTime = getCurrentTime();  

        transfer_liq_from(msg.sender, address(this), _repay_amount);

    }   

    /// @notice updates balances after repayment
    /// need to remove min.
    function handleRepay(uint256 repay_principal, uint256 repay_interest) internal returns(bool){
        totalOwed -= Math.min((repay_principal + repay_interest), totalOwed); 
        principalOwed -= Math.min(repay_principal, principalOwed);
        interestOwed -= Math.min(repay_interest, interestOwed);

        principalRepayed += repay_principal;
        interestRepayed += repay_interest; 
        if (repay_principal > 0) adjustInterestOwed(); 

        bool fullyRepayed = (principalOwed == 0 && interestOwed == 0)? true : false; 
        return fullyRepayed; 
    }

    function setGracePeriod() external {}

    /// @notice callable by anyone 
    function beginGracePeriod() external {
       // require(block.timestamp >= drawdown_block + toSeconds(duration), "time err"); 
        require(principalOwed > 0 && interestOwed > 0, "repaid"); 
        gracePeriodStart = block.timestamp; 
        loanStatus = LoanStatus.grace_period; 
    }

    function declareDefault() external onlyAuthorized {
       // require(gracePeriodStart + gracePeriod >= block.timestamp);
        require(loanStatus == LoanStatus.grace_period); 

        loanStatus = LoanStatus.isDefault; 
    }

    /// @notice should be called  at default by validators
    /// calling this function will go thorugh the necessary process
    /// to recoup bad debt, and will push the remaining funds to vault
    function onDefault() external onlyAuthorized{
        require(loanStatus == LoanStatus.isDefault); 

        // If collateral is liquidateable, liquidate at dex and push to vault
        if (isLiquidatable(collateral)) {
            liquidateAndPushToVault(); //TODO get pool 
        }

        // Else for non liquid governance tokens or ownership, should auction off 
        else {
            auctionAndPushToVault(); 
        }

        //Testing purposes only 
        underlying.transferFrom(msg.sender, address(this), principal/2); 

    }

    /// @notice when principal/interest owed becomes 0, need to find out if this is prepaid
    function isPaymentPremature() internal returns(bool){
        // bool timeCondition = getCurrentTime() <= drawdown_block + toSeconds(duration); 
        bool amountCondition = (principal+notionalInterest) > (principalRepayed + interestRepayed) + DUST; 

        // timeCondition implies amountCondition, but not the other way around 
        return amountCondition; 
    }


    function toYear(uint256 sec) internal pure returns(uint256){
        return (sec*1e18)/uint256(31536000); 
    }

    function toSeconds(uint256 y) internal pure returns(uint256){
        return uint256(31536000).mulWadDown(y); 
    }

    function getRemainingOwed() public view returns(uint256, uint256){
        return(principalOwed, interestOwed); 
    }

    function getCurrentLoanStatus() public view returns(uint256){}





}


contract Proxy{
    address owner; 
    address delegator; 

    address[] public ownedContracts;
    mapping(address=>bytes4) public ownerTransferFunctions; 
    mapping(address=>bool) public isValidContract; 

    /// @notice owner is first set to be the instrument contract
    /// and is meant to be changed back to the borrower or whoever is
    /// buying the ownership 
    constructor(address _owner, address _delegator){
        owner = _owner; 
        delegator = _delegator; 

    }

    function changeOwnership(address newOwner) external {
        require(msg.sender == owner, "Not owner"); 
        owner = newOwner; 
    }

    function numContracts() public view returns(uint256){
        return ownedContracts.length; 
    }

    /// @notice temporarily delegate ownership of relevant contract 
    /// to this address, and stores the ownership transfering function
    /// called when initialized
    /// @param ownershipFunction is selector of the functions that transfers
    /// ownership 
    /// @dev called by the borrower during assessment, after they had given ownership 
    /// of the contract to this address first, 
    /// but ownerTransferfunction/contract needs to be checked before approval by the validators
    /// Validators are responsible for checking if there isn't any other ownership transferring functions 
    /// and check that the contract is legit, and think ways that the borrower can game the system. 
    function delegateOwnership(
        address _contract, 
        bytes4 ownershipFunction) external 
    {
        ownedContracts.push(_contract); 
        isValidContract[_contract] = true; 
        ownerTransferFunctions[_contract] = ownershipFunction; 

    }

    /// @notice transfers ownership to borrower or any other party if necessary
    function grantOwnership(
        address _contract, 
        address newOwner,
        bytes calldata data, 
        bool isSingleArgument) external{   
        require(msg.sender == owner);
        require(isValidContract[_contract]);
        if(newOwner != address(this)) isValidContract[_contract] = false; 

        if(isSingleArgument){
            (bool success, ) = _contract.call(
                abi.encodeWithSelector(
                    ownerTransferFunctions[_contract], 
                    newOwner
                )
            );  
            require(success, "!success"); 
        }

        else{
            require(convertBytesToBytes4(data) != ownerTransferFunctions[_contract], "func not allowed"); 
            (bool success, ) = _contract.call(data);
            require(success, "!success"); 

        }
    }

    /// @notice function that ownership delegators use to call functions 
    /// in their contract other than the transferFunction contract 
    function proxyFunc(address _contract, bytes calldata data) external{
        require(msg.sender == delegator); 
        require(convertBytesToBytes4(data) != ownerTransferFunctions[_contract], "func not allowed"); 

        (bool success, ) = _contract.call(data); 
        require(success, "!success"); 

    }

    function convertBytesToBytes4(bytes memory inBytes) internal pure returns (bytes4 outBytes4) {
        if (inBytes.length == 0) {
            return 0x0;
        }

        assembly {
            outBytes4 := mload(add(inBytes, 4))
        }
    }

    function getOwner() public view returns(address){
        return owner; 
    }
}


contract MockBorrowerContract{

    address public owner; 
    constructor(){
        owner = msg.sender;  
    }

    function changeOwner(address newOwner) public {
        require(msg.sender == owner, "notowner"); 
        owner = newOwner; 
    } 

    function onlyOwnerFunction(uint256 a) public {
        console.log('msgsender', msg.sender, owner); 
        require(msg.sender == owner, "notowner"); 
        console.log('hello', a); 
    }

    function autoDelegate(address proxyad) public {
        Proxy(proxyad).delegateOwnership(address(this), this.changeOwner.selector); 
    }
    fallback () external {
        console.log('hi?'); 
    }
}
