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
    function _calculatePurchaseReturn(uint256 amount) view internal override virtual returns(uint256 result) {
        uint256 _amount = amount * 10 ** (18 - collateral_dec);
        uint256 s = totalSupply();
        // uint256 two = uint256(2).fromUint();
        // result = (((a.mul(s) + b).pow(two) + two.mul(a).mul(amount)).sqrt() - (a.mul(s) + b)).div(a);
        result = ( ( ( ((a.mulWadDown(s) + b) ** 2)/math_precision + 2 * a.mulWadDown(_amount) ) * math_precision ).sqrt() - (a.mulWadDown(s) + b) ).divWadDown(a);
    }

    /// @notice calculates area under the curve from current supply to s+amount
    /// result = a * amount / 2  * (2* supply + amount) + b * amount
    /// @dev amount is in 60.18.
    /// returned in collateral decimals
    function _calcAreaUnderCurve(uint256 amount) internal view override virtual returns(uint256 result){
        uint256 s = totalSupply(); 
        // uint256 s_prime = s+amount;
        // uint256 two = uint256(2).fromUint();
        // result = a.mul(s_prime.pow(two) - s.pow(two)).div(2) + b.mul(s_prime-s); 
        result = ( a.mulWadDown(amount) / 2 ).mulWadDown(2 * s + amount) + b.mulWadDown(amount); 
        result /= (10 ** (18 - collateral_dec));
    }

    /**
     @dev collateral tokens returned
     @param amount: tokens burning => 60.18
     @dev returns amount of collateral tokens with collateral decimals
     */
    function _calculateSaleReturn(uint256 amount) view internal override virtual returns (uint256 result) {
        uint256 s = totalSupply();
        // uint256 two = uint256(2).fromUint();
        // result = reserves - ((a.div(two)).mul((s - amount).pow(two)) + b.mul(s - amount));
        //uint256 reserves = collateral.balanceOf(address(this)) * 10 ** (math_precision - collateral_dec);
        uint256 _reserves = reserves * 10 ** (18 - collateral_dec);
        console.log("_reserves", _reserves);
        result = _reserves - ( (a / 2).mulWadDown((((s - amount)**2) / math_precision)) + b.mulWadDown(s - amount) );
        console.log("s - amount", s - amount);
        result /= (10 ** (18 - collateral_dec));
    }

    /**
     @param amount: amount added in 60.18
     @dev returns price in 60.18
     */
    function _calculateExpectedPrice(uint256 amount) view internal override virtual returns (uint256 result) {
        uint256 s = totalSupply();
        //result = (s + amount).mul(a) + b;
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
 }