
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
    function onMarketApproval() virtual external {}

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
    function estimatedTotalAssets() public view virtual returns (uint256);

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
    function prepareWithdraw()
        internal
        virtual
        returns (
            uint256 _profit,
            uint256 _loss,
            uint256 _debtPayment
        );

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
    function liquidatePosition(uint256 _amountNeeded) public  virtual returns (uint256 _liquidatedAmount, uint256 _loss);

    /**
     * Liquidate everything and returns the amount that got freed.
     * This function is used during emergency exit instead of `prepareReturn()` to
     * liquidate all of the instrument's positions back to the Vault.
     */
    function liquidateAllPositions() public  virtual returns (uint256 _amountFreed);

    function lockLiquidityFlow() external onlyVault{
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



}



/// @notice Simple Instrument that provides USDC on stableswap 3pool 
// contract Curve3pool_Instrument is Instrument{

//     /// @notice invests amount into Instrument 
//     function invest(uint256 amount ) external 
//     //onlyGuardian 
//     {   
//         require(this.balanceOfUnderlying(address(this)) >= amount);
//         _invest(amount);  

//     }

//     function _invest(uint256 _amount) internal {

//     }



// }


/// @notice Instrument that a) lends usdc fix rate at notional.finance and get zcb
/// b) use that zcb as collateral to borrow fiat from fiatdao, c) swap fiat dao to usdc
/// d) repeat
// contract LeveragedFixedRate_Instrument is Instrument{

// }

// /// @notice Instrument that lends to risky collateral in fuse pools
// contract RariLend_Instrument is Instrument{

// }



 
/// @notice Contract for unsecured loans, each instance will be associated to a borrower+marketId
/// approved borrowers will interact with this contract to borrow, repay. 
/// and vault will supply principal and harvest principal/interest 
abstract contract CreditLine is Instrument {
    using PRBMathUD60x18 for uint256;

    //  variables initiated at creation
    uint256  principal;
    uint256  interestAPR; 
    uint256  faceValue; //total amount due, i.e principal+interest
    uint256  duration; 

    // Modify-able Variables during repayments, borrow
    uint256 totalOwed; 
    uint256 principalOwed; 
    uint256 interestOwed;

    constructor(
        address vault,
        address borrower, 
        uint256 _principal,
        uint256 _interestAPR, 
        uint256 _duration,
        uint256 _faceValue
    )  Instrument(vault, borrower){
        principal = _principal; 
        interestAPR = _interestAPR; 
        duration = _duration;   
        faceValue = _faceValue;
        interestOwed = faceValue - principal;
    }

    /// @notice use APR and duration to get total owed interest 
    function getOwedInterest(uint256 APR, uint256 duration) internal pure returns(uint256 owed){
        return APR; 
    }

    /// @notice Allows a borrower to borrow on their creditline.
    function drawdown(uint256 amount) external onlyUtilizer{
        require(vault.isTrusted(this), "Not approved");
        require(underlying.balanceOf(address(this)) > amount, "Exceeds Credit");
        totalOwed += amount; 
        principalOwed += amount; 
        transfer_liq(msg.sender, amount); 
    }

    /// @notice allows a borrower to repay their loan
    function repay(uint256 repay_principal, uint256 repay_interest) external onlyUtilizer{
        require(vault.isTrusted(this), "Not approved");
        // require(repay_principal <= principalOwed, "overpaid principal");
        // require(repay_interest <= interestOwed, "overpaid interest");
        transfer_liq_from(msg.sender, address(this), repay_principal + repay_interest);
        // underlying.transferFrom(msg.sender, address(this), repay_principal + repay_interest);
        handleRepay(repay_principal, repay_interest); 
    }   

    /// @notice updates balances after repayment
    /// need to remove min.
    function handleRepay(uint256 repay_principal, uint256 repay_interest) internal {
        totalOwed -= Math.min((repay_principal + repay_interest), totalOwed); 
        principalOwed -= Math.min(repay_principal, principalOwed);
        interestOwed -= Math.min(repay_interest, interestOwed);
    }
}