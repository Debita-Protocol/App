pragma solidity ^0.8.4;

import {BondingCurve} from "./bondingcurve.sol";
import "../prb/PRBMathUD60x18.sol";

/// @notice y = a * x^n => formulas from Bancor 
/// https://drive.google.com/file/d/0B3HPNP-GDn7aRkVaV3dkVl9NS2M/view?resourcekey=0-mbIgrdd0B9H8dPNRaeB_TA
/// @dev NEED TO REDO FOR GAS EFFICIENT
abstract contract PolynomialBonding is BondingCurve {

    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;
    uint256 a;
    uint256 n;
    uint256 F; // reserve ratio

    constructor (
        string memory name,
        string memory symbol,
        address owner,
        address collateral,
        uint256 _a,
        uint256 _n
    ) BondingCurve(name, symbol, owner, collateral) {
        a = _a;
        n = _n;
        uint256 one = uint256(1).fromUint();
        F = one.div(_n + one); // 1 / (_n + 1)
    }

    /**
     @dev tokens returned
     @param amount: amount collateral in => 60.18
     */
    function _calculatePurchaseReturn(uint256 amount) view internal override virtual returns(uint256 result) {
        uint256 s = totalSupply();
        uint256 one = uint256(1).fromUint();
        result = s.mul((one + amount.div(reserves)).pow(F) - one);
    }

    /**
     @dev collateral tokens returned
     @param amount: tokens burning => 60.18
     */
    function _calculateSaleReturn(uint256 amount) view internal override virtual returns (uint256 result) {
        uint256 s = totalSupply();
        uint256 one = uint256(1).fromUint();
        result = reserves - ((s - amount).pow(n + one).div(n + one)).mul(a);
    }

    /**
     @param amount: amount added in 60.18
     */
    function _calculateExpectedPrice(uint256 amount) view internal override virtual returns (uint256 result) {
        uint256 s = totalSupply();
        result = ((s + amount).pow(n)).mul(a);
    }
}