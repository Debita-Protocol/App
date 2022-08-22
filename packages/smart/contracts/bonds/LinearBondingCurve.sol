pragma solidity ^0.8.4;

import {BondingCurve} from "./bondingcurve.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import "hardhat/console.sol";

/// @notice y = a * x + b
/// @dev NEED TO REDO FOR GAS EFFICIENT
contract LinearBondingCurve is BondingCurve {
  // ASSUMES 18 TRAILING DECIMALS IN UINT256
  using FixedPointMathLib for uint256;
  uint256 a;
  uint256 b;

  constructor (
      string memory name,
      string memory symbol,
      address owner,
      address collateral,
      uint256 _a,
      uint256 _b
  ) BondingCurve(name, symbol, owner, collateral) {
      a = _a;
      b = _b;
  }
  /**
   @dev tokens returned = [((a*s + b)^2 + 2*a*p)^(1/2) - (a*s + b)] / a
   @param amount: amount collateral in => has collateral decimal number.
   tokens returned in 60.18
   */
  function _calculatePurchaseReturn(uint256 amount) view internal override virtual returns(uint256) {
    uint256 s = totalSupply() ;
    uint256 _amount = amount * 10 ** (18 - collateral_dec);
    console.log('s', s, a); 
    console.log('b', b); 

    uint256 x = ((a.mulWadDown(s) + b) ** 2)/math_precision; 
    console.log('x', x); 

    uint256 y = 2*( a.mulWadDown(_amount)); 
    console.log('y', y); 

    uint256 x_y_sqrt = ((x+y)*math_precision).sqrt();
    console.log('x_y_sqrt', x_y_sqrt); 

    uint256 z = (a.mulWadDown(s) + b); 
    console.log('z', z); 

    uint256 result = (x_y_sqrt-z).divWadDown(a);
    console.log('result', result); 

    return result; 


      // uint256 two = uint256(2).fromUint();
      // result = (((a.mul(s) + b).pow(two) + two.mul(a).mul(amount)).sqrt() - (a.mul(s) + b)).div(a);
      //result = ( ( ( ((a.mulWadDown(s) + b) ** 2)/math_precision + 2 * a.mulWadDown(_amount) ) * math_precision ).sqrt() - (a.mulWadDown(s) + b) ).divWadDown(a);
  }

  /// @notice calculates area under the curve from current supply to s+amount
  /// result = a * amount / 2  * (2* supply + amount) + b * amount
  /// @dev amount is in 60.18.
  /// returned in collateral decimals
  function _calcAreaUnderCurve(uint256 amount) internal view override virtual returns(uint256){
    uint256 s = totalSupply(); 

    uint256 result = ( a.mulWadDown(amount) / 2 ).mulWadDown(2 * s + amount) + b.mulWadDown(amount); 
    console.log('result', result); 
    result /= (10 ** (18 - collateral_dec));

    return result; 
  }

  /**
   @notice calculates area under curve from s-amount to s, is c(as-ac/2+b) where c is amount 
   @dev collateral tokens returned
   @param amount: tokens burning => 60.18 amount needs to be in 18 decimal 
   @dev returns amount of collateral tokens with collateral decimals
   */
  function _calculateSaleReturn(uint256 amount) view internal override virtual returns (uint256) {
    uint s = totalSupply();

    console.log('amount', amount, s); 

    uint256 x = a.mulWadDown(s); 
    console.log('x', x); 
    uint256 y = a.mulWadDown(amount)/2; 
    console.log('y', y); 
    uint256 z = b + x - y; 
    console.log('z', z); 
    uint256 result = amount.mulWadDown(z); 
    console.log('result', result); 

    result = result / (10 ** (18 - collateral_dec));

    return result; 
    
    // uint256 _reserves = reserves * 10 ** (18 - collateral_dec);

    // console.log("_reserves", _reserves);
    // result = _reserves - ( (a / 2).mulWadDown((((s - amount)**2) / math_precision)) + b.mulWadDown(s - amount) );
    // console.log("s - amount", s - amount);
    // result /= (10 ** (18 - collateral_dec));
  }

  /**
   @param amount: amount added in 60.18
   @dev returns price in 60.18
   */
  function _calculateExpectedPrice(uint256 amount) view internal override virtual returns (uint256 result) {
    uint256 s = totalSupply();

    result = (s + amount).mulWadDown(a) + b;
  }

  function _calculateDecreasedPrice(uint256 amount) view internal override virtual returns (uint256 result) {
    result = (totalSupply() - amount).mulWadDown(a) + b;
  }

  /**
   @notice probability = a * x + b, 60.18
   returns probability in 60.18
   */
  function _calculateProbability(uint256 amount) view internal override virtual returns (uint256 score) {
      //score = amount.mul(a) + b;
    score = amount.mulWadDown(a) + b;
  }



 function _calculateScore(uint256 priceOut, bool atLoss)view internal override virtual returns (uint256 score) {
      // uint256 two = uint256(2).fromUint();
      // if (atLoss) {score =  ((priceOut-math_precision).div(math_precision)).pow(two);}
      // else {score = ((priceOut).div(math_precision)).pow(two);}
    if (atLoss) {
        score = ((priceOut - math_precision) ** 2) / math_precision;
    } else {
        score = (priceOut ** 2) / math_precision;
    }

  }

  function getParams() public view returns(uint,uint){
    return (a,b); 
  }
}