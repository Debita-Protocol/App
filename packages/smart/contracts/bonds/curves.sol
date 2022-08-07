pragma solidity ^0.8.4; 
import "./curvetypes.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";

library ConstantCurve {
    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;

    /**
     @notice returns amount ZCB out.
     @param ds: amount DS in => 60.18-decimal.
     @dev doesn't check whether self.a is 0.
     */
    function caluclatePurchaseReturn(CurveTypes.Constant storage self, uint256 ds) public returns (uint256 result) {
        result = ds.div(self.a);
        self.reserve += ds;
        self.supply += result;
    }

    /**
     @notice returns amount DS out.
     @param zcb: amount ZCB selling => 60.18-decimal.
     */
    function calculateSaleReturn(CurveTypes.Constant storage self, uint256 zcb) public returns (uint256 result) {
        result = zcb.mul(self.a);
        self.reserve -= result;
        self.supply -= zcb;
    }

    function priceToMint(CurveTypes.Constant storage self, uint256 zcb) view public returns (uint256 result) {
        result = zcb.mul(self.a);
    }

    /**
     @notice gets current price in DS
     */
    function getPrice(CurveTypes.Constant storage self) view public returns (uint256 result) {
        result = self.a;
    }


    function getProjectedPrice(CurveTypes.Constant storage self, uint256 ds) view public returns (uint256 result) {
        result = self.a;
    }

    /**
     @notice returns max quantity
     */
    function calculateMaxQuantity(CurveTypes.Constant storage self) pure public returns (uint256) {
        return 0;
    }

    //TODO need to implement
    function sellingFee(CurveTypes.Constant storage self) pure public returns (uint256) {
        return 0;
    }

    function getSupply(CurveTypes.Constant storage self) view public returns (uint256) {
        return self.supply;
    }

    function getReserves(CurveTypes.Constant storage self) view public returns (uint256) {
        return self.reserve;
    }
}

library LinearCurve {
     /**
     @notice returns amount ZCB out.
     @param ds: amount DS in => 60.18-decimal.
     @dev doesn't check whether self.a is 0.
     */
    function caluclatePurchaseReturn(CurveTypes.Constant storage self, uint256 ds) public returns (uint256 result) {
        result = 
        self.reserve += ds;
        self.supply += result;
    }

    /**
     @notice returns amount DS out.
     @param zcb: amount ZCB selling => 60.18-decimal.
     */
    function calculateSaleReturn(CurveTypes.Constant storage self, uint256 zcb) public returns (uint256 result) {
        result = zcb.mul(self.a);
        self.reserve -= result;
        self.supply -= zcb;
    }

    function priceToMint(CurveTypes.Constant storage self, uint256 zcb) view public returns (uint256 result) {
        result = zcb.mul(self.a);
    }

    /**
     @notice gets current price in DS
     */
    function getPrice(CurveTypes.Constant storage self) view public returns (uint256 result) {
        result = self.a;
    }


    function getProjectedPrice(CurveTypes.Constant storage self, uint256 ds) view public returns (uint256 result) {
        result = self.a;
    }

    /**
     @notice returns max quantity
     */
    function calculateMaxQuantity(CurveTypes.Constant storage self) pure public returns (uint256) {
        return 0;
    }

    //TODO need to implement
    function sellingFee(CurveTypes.Constant storage self) pure public returns (uint256) {
        return 0;
    }

    function getSupply(CurveTypes.Constant storage self) view public returns (uint256) {
        return self.supply;
    }

    function getReserves(CurveTypes.Constant storage self) view public returns (uint256) {
        return self.reserve;
    }

}