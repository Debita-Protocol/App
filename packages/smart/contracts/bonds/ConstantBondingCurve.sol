pragma solidity ^0.8.4;

import { BondingCurve } from "./bondingcurve.sol";
import "../prb/PRBMathUD60x18.sol";

/// @notice implements y = a. basic bonding curve 
// EVERYTHING IS ASSUMED TO BE IN 60.18 FORMAT
abstract contract ConstantBondingCurve is BondingCurve {
    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;


    uint256 private a;

    constructor(
        string memory name,
        string memory symbol,
        address owner,
        address collateral,
        uint256 _a
    ) BondingCurve(name, symbol, owner, collateral) {
        a = _a;
    }

    function _calculatePurchaseReturn(uint256 amount) view internal override virtual returns(uint256 result) {
        result = amount.div(a);
    }

    function _calculateSaleReturn(uint256 amount) view internal override virtual returns (uint256 result) {
        result = amount.mul(a);
    }

    /**
     @dev for constant need a max quantity.
     */
    function _calculateExpectedPrice(uint256 amount) view internal override virtual returns (uint256 result) {
        return a;
    }

    function trustedMint(address _target, uint256 _amount) external override virtual onlyOwner {
        if (max_quantity > 0) {
            require(_amount + totalSupply() < max_quantity, "must be less than max quantity");
        }
        _mint(_target, _amount);
    }
}