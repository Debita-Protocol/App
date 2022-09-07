pragma solidity ^0.8.4;

import {BondingCurve} from "./bondingcurve.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import "hardhat/console.sol";
import {config} from "../protocol/helpers.sol"; 

/// @notice y = a * x + b
/// @dev all computations are done in WAD space, any conversion if needed should be made in the parent contract  

contract LinearBondingCurve is BondingCurve {
  // ASSUMES 18 TRAILING DECIMALS IN UINT256
  using FixedPointMathLib for uint256;
  uint256  a;
  uint256  b;
  uint256  discount_cap; 


  modifier _WAD_(uint256 amount) {
      require(config.isInWad(amount), "Not in wad or below minimum amount"); 
      _;
  }

  /// @param sigma is the proportion of P that is going to be bought at a discount
  /// param p,i,sigma all should be in WAD   
  constructor (
      string memory name,
      string memory symbol,
      address owner,
      address collateral, 
      uint256 P, 
      uint256 I,
      uint256 sigma
  ) BondingCurve(name, symbol, owner, collateral)_WAD_(P)  {
    _calculateInitCurveParams(P, I, sigma); 
  }

  /// @notice need to calculate initial curve params that takes into account
  /// validator rewards(from discounted zcb). Just skew up the initial price. 
  /// @param sigma is the proportion of P that is going to be bought at a discount  
  function _calculateInitCurveParams(uint256 P, uint256 I, uint256 sigma) internal virtual _WAD_(P) returns(uint256) {

    b = (2*P).divWadDown(P+I) - math_precision; 
    a = (math_precision-b).divWadDown(P+I); 

    // Calculate and store maximum tokens for discounts, 
    discount_cap = _calculatePurchaseReturn(P.mulWadDown(sigma)); 
    console.log('discount cap', discount_cap); 

    //get new initial price after saving for discounts 
    b = a.mulWadDown(discount_cap) + b; 

  }
  /**
   @dev tokens returned = [((a*s + b)^2 + 2*a*p)^(1/2) - (a*s + b)] / a
   @param amount: amount collateral in => needs to be converted to WAD before 
   tokens returned in WAD
   */
  function _calculatePurchaseReturn(uint256 amount)  internal view override virtual _WAD_(amount) returns(uint256) {
    uint256 s = totalSupplyAdjusted() ;

    uint256 x = ((a.mulWadDown(s) + b) ** 2)/math_precision; 
    uint256 y = 2*( a.mulWadDown(amount)); 
    uint256 x_y_sqrt = ((x+y)*math_precision).sqrt();
    uint256 z = (a.mulWadDown(s) + b); 
    uint256 result = (x_y_sqrt-z).divWadDown(a);

    return result;
  }


  /**
   @notice calculates area under curve from s-amount to s, is c(as-ac/2+b) where c is amount 
   @dev collateral tokens returned
   @param amount: amount of tokens burnt => WAD amount needs to be in 18 decimal 
   @dev returns amount of collateral tokens in WAD
   */
  function _calculateSaleReturn(uint256 amount) internal view override virtual _WAD_(amount) returns (uint256) {

    uint s = totalSupplyAdjusted();
    uint256 x = a.mulWadDown(s); 
    uint256 y = a.mulWadDown(amount)/2; 
    uint256 z = b + x - y; 
    uint256 result = amount.mulWadDown(z); 

    return result;
  }



  /// @notice calculates area under the curve from current supply to s+amount
  /// result = a * amount / 2  * (2* supply + amount) + b * amount
  /// @dev amount is in 60.18.
  /// returned in collateral decimals
  function _calcAreaUnderCurve(uint256 amount) internal view override virtual _WAD_(amount) returns(uint256){

    uint256 s = totalSupplyAdjusted(); 
    uint256 result = ( a.mulWadDown(amount) / 2 ).mulWadDown(2 * s + amount) + b.mulWadDown(amount); 
    
    return result; 
  }


  /**
   @param amount: amount added in 60.18
   @dev returns price in 60.18
   */
  function _calculateExpectedPrice(uint256 amount) internal view  override virtual _WAD_(amount) returns (uint256 result) {

    uint256 s = totalSupplyAdjusted();

    result = (s + amount).mulWadDown(a) + b;
  }

  function _calculateDecreasedPrice(uint256 amount) view internal override virtual _WAD_(amount) returns (uint256 result) {
    result = (totalSupplyAdjusted() - amount).mulWadDown(a) + b;
  }


  function _calculateScore(uint256 priceOut, bool atLoss)view internal override virtual returns (uint256 score) {
    if (atLoss) {
      score = ((priceOut - math_precision) ** 2) / math_precision;
    } else {
      score = (priceOut ** 2) / math_precision;
    }
  }

  function _get_discount_cap() internal view virtual override returns(uint){
    return discount_cap; 
  }

  function _getParams() public view override returns(uint,uint){
    return (a,b); 
  }




}