// pragma solidity ^0.8.4;

// /*----Bonding Curve Types----*/
// library CurveTypes {
    
//     // ALL NUMBERS IN 60.18-decimal fixed-point numbers

//     /**
//      @notice y = a
//      */
//     struct Constant  {
//         uint256 a;
//         uint256 supply;
//         uint256 reserve;
//         uint256 price;
//     }

//     /**
//      @notice y = a * x + b
//      */
//     struct Linear {
//         uint256 a;
//         uint256 b;
//         uint256 supply;
//         uint256 reserve;
//         uint256 price;
//     }

//     /**
//      @notice y = a * x^2 + b
//      */
//     struct Quadratic {
//         uint256 a;
//         uint256 b;
//         uint256 supply;
//         uint256 reserve;
//         uint256 price;
//     }

//     /**
//      @notice y = exp(x/a) / (b + exp(x/a))
//      */
//     struct Sigmoid {
//         uint256 a;
//         uint256 b;
//         uint256 ds;
//         uint256 zcb;
//     }

// }