pragma solidity ^0.8.4;

import "./vault.sol";
import {ERC20} from "./tokens/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {FixedPointMathLib} from "./utils/FixedPointMathLib.sol";
import "hardhat/console.sol";
import {Instrument} from "./instrument.sol";

/// @notice This contract acts as an OTC option platform
/// Utilizer will "propose" a strike price to buy
/// At maturity, premiums from utilizer will be collected by the vault when expires
/// below strike price 
contract CoveredCallOTC is Instrument{
    using FixedPointMathLib for uint256; 

    address public immutable utilizer; 
    address public immutable underlyingAsset; 
    uint256 public immutable strikePrice;
    uint256 public immutable pricePerContract; 
    uint256 public immutable shortCollateral; 
    uint256 public immutable longCollateral;
    address public immutable cash; 
    uint256 public immutable maturityTime; 

    address public oracle ;
    uint256 public profit; 
    uint256 public constant timeThreshold = 10; 
    bool utilizerClaimed; 

    /// @param _shortCollateral depends on how much underlyingAsset is in the vault. 
    /// @param _pricePerContract is the price that the utilizer is willing to buy 
    /// the call option. Usually implied vol here is lower than external implied vol values 
    constructor(address _vault,
        address _utilizer, 
        address _underlyingAsset, 
        uint256 _strikePrice, 
        uint256 _pricePerContract, // depends on IV, price per contract denominated in underlying  
        uint256 _shortCollateral, // collateral for the sold options-> this is in underlyingAsset i.e weth 
        uint256 _longCollateral, // collateral amount in underlying for long to pay. (price*quantity)
        address _cash,  
        address _oracle,  // oracle for price of collateral 
        uint256 duration
        ) Instrument(_vault, _utilizer){
        require(_longCollateral == _shortCollateral.mulWadDown(_pricePerContract), "incorrect setting"); 
        utilizer = _utilizer; 
        underlyingAsset = address(underlying); // already specified 
        strikePrice = _strikePrice; 
        pricePerContract = _pricePerContract; 
        shortCollateral = _shortCollateral; 
        longCollateral = _longCollateral; 
        cash = _cash;
        oracle = _oracle; 
        maturityTime = block.timestamp + duration;
    }

    function setOracle() public {}

    /// @notice returns true if the instrument can be approved
    /// and funds can be directed from vault. Utilizer must have escrowed
    /// to this contract before  
    function instrumentApprovalCondition() public override view returns(bool){
        return underlying.balanceOf(address(this)) >= longCollateral;
    }
    uint256 public testqueriedPrice=1e18; 
    /// @notice queries oracle for the latest price of the underlying 
    function queryPrice() public view returns(uint256 price){
        return testqueriedPrice; 
    }

    /// @notice for a given queriedPrice(usually the spot chainlink price at maturity)
    /// what is the profit returned to the utilizer 
    /// @dev utillizers can call this function at maturity so they can realize profit it is positive 
    /// if they miss the window(timethreshold), they can't realize profit. 
    /// param queriedPrice must be the exact price at which option is exercised, at maturity
    function profitForUtilizer() public onlyUtilizer{
        require(block.timestamp <= maturityTime + timeThreshold  && 
            block.timestamp >= maturityTime- timeThreshold , "Time window err"); 
        require(profit == 0, "profit already set"); 
        uint256 queriedPrice = queryPrice(); 

        // Under strike price 
        if (queriedPrice <= strikePrice) profit = 0; 

        // Profit denominated in the base asset for the underlyingAsset, normally a stablecoin 
        else {
            uint256 profitInCash = (queriedPrice - strikePrice).mulWadDown(shortCollateral); 

            // profit in underlying should be divided by the price 
            profit = profitInCash.divWadDown(queriedPrice); 
        }
    }

    /// @notice either option buyers(utilizers) or sellers(protocol)
    /// can claim their proportion of the winnings 
    function claim() external onlyUtilizer{
        require(maturityTime < block.timestamp, "not matured"); 
        require(profit> 0, "0profit"); 

        underlying.transfer(msg.sender, profit); 

        profit = 0; 

        utilizerClaimed = true; 

        vault.pingMaturity(address(this), false); 
    }

    /// @notice called at maturity
    function readyForWithdrawal() public view override returns(bool){
        return ( (block.timestamp <= maturityTime + timeThreshold && profit == 0)
                || utilizerClaimed); 
    }

 



}
