pragma solidity ^0.8.4;

library CurveTypes {
    
    // ALL NUMBERS IN 60.18-decimal fixed-point numbers

    /**
     @notice y = exp(x/a) / (b + exp(x/a))
     */
    struct Sigmoid {
        uint256 a;
        uint256 b;
        uint256 x_i; // current number of ZCB bought
        uint256 y_i; // current number of DS recieved
    }

    /**
     @notice y = ax + b
     */
    struct Linear {
        uint256 a;
        uint256 b;
        uint256 x_i; // current number of ZCB bought
        uint256 y_i; // current number of DS recieved
    }

    /**
     @notice y = ax^2 + b
     */
    struct Quadratic {
        uint256 a;
        uint256 b;
        uint256 x_i; // current number of ZCB bought
        uint256 y_i; // current number of DS recieved
    }

    /**
     @notice y = 
     */
}