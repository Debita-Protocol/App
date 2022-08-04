pragma solidity ^0.8.4; 
import "./curvetypes.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";

library LinearCurve {
    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;

    uint256 constant MAX_QUANTITY =  uint256(100)*(10**18);

    /**
     @notice returns amount ZCB out.
     @param ds: amount DS in => 60.18-decimal.
     @dev doesn't check whether self.a is 0.
     */
    function calculateZCBOut(CurveTypes.Linear storage self, uint256 ds) public returns (uint256 result) {
        result = ds.div(self.a);
        self.x_i += result;
        self.y_i += ds;
    }

    /**
     @notice returns amount DS out.
     @param zcb: amount ZCB selling => 60.18-decimal.
     */
    function calculateDSOut(CurveTypes.Linear storage self, uint256 zcb) public returns (uint256 result) {
        result = uint256(self.a).mul(zcb);
        self.x_i -= zcb;
        self.y_i -= result; 
    }

    /**
     @notice calculates price with zcb bond tokens bought.
     */
    function calcPrice(CurveTypes.Linear storage self) view public returns (uint256 result) {
        result = self.a;
    }

    function calcProjectedPrice(CurveTypes.Linear storage self) view public returns (uint256 result) {
        result = self.a;
    }

    /**
     @notice returns max quantity
     */
    function calculateMaxQuantity(CurveTypes.Linear storage self) pure public returns (uint256) {
        return MAX_QUANTITY;
    }

    //TODO need to implement
    function sellingFee(CurveTypes.Linear storage self) pure public returns (uint256) {
        return 0;
    }

    function getZCB(CurveTypes.Linear storage self) view public returns (uint256) {
        return self.x_i;
    }

    function getDS(CurveTypes.Linear storage self) view public returns (uint256) {
        return self.y_i;
    }
}

library QuadraticCurve {

    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;

    /**
     @notice returns amount ZCB out.
     @param ds: amount DS in
     */
    function calculateZCBOut(CurveTypes.Quadratic storage self, uint256 ds) public returns (uint256 result) {
        result = (( self.y_i + ds - self.b ).div(self.a)).sqrt() - self.x_i;
        self.y_i += ds;
        self.x_i += result;
    }

    /**
     @notice returns amount DS out.
     @param zcb: amount ZCB selling
     */
    function calculateDSOut(CurveTypes.Quadratic storage self, uint256 zcb) public returns (uint256 result) {
        result = self.y_i - ( uint256(self.x_i - zcb).sqrt().mul(self.a) + self.b );
        self.y_i -= result;
        self.x_i -= zcb;
    }
}

library SigmoidCurve {
    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;

    /**
     @notice returns amount ZCB out
     @param ds: amount DS in => 60.18-decimal.
     @dev zcb out = a * ln(((yi + ds) * b)/(1-(yi + ds))) - xi
     */
    function calculateZCBOut(CurveTypes.Sigmoid storage self, uint256 ds) public returns (uint256 result) {
        result = ((self.y_i + ds).mul(self.b).div(1 - (self.y_i + ds))).ln().mul(self.a) - self.x_i;
        self.y_i += ds;
        self.x_i += result;
    }

    /**
     @notice returns amount DS out.
     @param zcb: amount ZCB selling
     @dev ds out = yi - exp((xi - zcb)/a)/(b+exp((xi - zcb)/a))
     */
    function calculateDSOut(CurveTypes.Sigmoid storage self, uint256 zcb) public returns (uint256 result) {
        result = self.y_i - (self.x_i - zcb).div(self.a).exp().div(self.b + (self.x_i - zcb).div(self.a).exp());
        self.y_i -= result;
        self.x_i -= zcb;
    }
}