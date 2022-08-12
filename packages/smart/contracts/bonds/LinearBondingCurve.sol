pragma solidity ^0.8.4;

import {BondingCurve} from "./bondingcurve.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";

/// @notice y = a * x + b
/// @dev NEED TO REDO FOR GAS EFFICIENT
contract LinearBondingCurve is BondingCurve {
    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;
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
     @param amount: amount collateral in => 60.18
     */
    function _calculatePurchaseReturn(uint256 amount) view internal override virtual returns(uint256 result) {
        uint256 s = totalSupply();
        uint256 two = uint256(2).fromUint();
        result = (((a.mul(s) + b).pow(two) + two.mul(a).mul(amount)).sqrt() - (a.mul(s) + b)).div(a);
    }

    /**
     @dev collateral tokens returned
     @param amount: tokens burning => 60.18
     */
    function _calculateSaleReturn(uint256 amount) view internal override virtual returns (uint256 result) {
        uint256 s = totalSupply();
        uint256 two = uint256(2).fromUint();
        result = reserves - ((a.div(two)).mul((s - amount).pow(two)) + b.mul(s - amount));
    }

    /**
     @param amount: amount added in 60.18
     */
    function _calculateExpectedPrice(uint256 amount) view internal override virtual returns (uint256 result) {
        uint256 s = totalSupply();
        result = (s + amount).mul(a) + b;
    }

    /**
     @notice probability = a * x + b, 60.18
     */
    function _calculateProbability(uint256 amount) view internal override virtual returns (uint256 score) {
        score = amount.mul(a) + b;
    }

    /// @notice calculates prob score (prob- 1)**2
    /// @param priceOut is in decimal 18
    /// score = (priceOut - a)**2 where a = 1 if no default, 
    function _calculateScore(uint256 priceOut, bool atLoss)view internal override virtual returns (uint256 score) {
        uint256 two = uint256(2).fromUint();
        if (atLoss) {score =  ((priceOut-math_precision).div(math_precision)).pow(two);}
        else {score = ((priceOut).div(math_precision)).pow(two);}


    }
}