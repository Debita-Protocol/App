
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
    uint256 private constant MAX_UINT = 2**256 - 1;

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
    function balanceOfUnderlying(address user) external view returns (uint256){
        return underlying.balanceOf(user); 
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
contract CreditLine is Instrument {
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
    ) public Instrument(vault, borrower){
        principal = _principal; 
        interestAPR = _interestAPR; 
        duration = _duration;   
        faceValue = _faceValue;
        interestOwed = faceValue - principal;
    }

    /// @notice CreditLine contract is initiated at proposal 
    /// @dev include any Instrument specific initialization logic  
    /// @param _borrower stored as Utilizer
    /// DEPRECATED
    function initialize(
        address _vault,
        address _borrower,         
        uint256 _principal,
        uint256 _interestAPR, 
        uint256 _duration, 
        uint256 _faceValue
    ) internal {
        _initialize(_vault, _borrower); 

        principal = _principal; 
        interestAPR = _interestAPR; 
        duration = _duration;   
        faceValue = _faceValue; 

        interestOwed = faceValue - principal; // getOwedInterest(_interestAPR, _duration); 
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
        underlying.transfer(msg.sender, amount);
    }

    /// @notice allows a borrower to repay their loan
    function repay(uint256 repay_principal, uint256 repay_interest) external onlyUtilizer{
        require(vault.isTrusted(this), "Not approved");
        require(repay_principal <= principalOwed, "overpaid principal");
        require(repay_interest <= interestOwed, "overpaid interest");
        underlying.transferFrom(msg.sender, address(this), repay_principal + repay_interest);
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