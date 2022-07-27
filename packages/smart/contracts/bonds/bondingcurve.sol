pragma solidity ^0.8.4; 

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Ibondingcurve.sol";
import "../turbo/AbstractMarketFactoryV3.sol";
import "../utils/AnalyticMath.sol";
import "hardhat/console.sol";

contract BondingCurve is IBondingCurve{

    AnalyticMath mathlib; 

    address collateral_address; 
    uint256 totalPurchased;

    mapping(uint256=>uint256) fundPerBonds; 


    constructor(
    	address _ds_address, 
    	address _mathlib_address
    	) {

    	collateral_address = _ds_address; 

    	mathlib = AnalyticMath(_mathlib_address); 
    	mathlib.init(); 

    }


	function getCurrentPrice() public view  returns(uint256){
		return 1;
	}

	function getBondFunds(uint256 marketId) public view returns(uint256){
		return fundPerBonds[marketId]; 
	}

	// Returns amount of bond out after a bonding curve purchase
	// @params amountIn the amount of DS used to purchase bonds
	// @returns amountOut the amount of bonds received 
	function getAmountOut(uint256 amountIn) internal view returns(uint256){
		uint256 curve_idx; //TODO get from market

		uint256 amountOut = calcAmountOutConstant(totalPurchased, amountIn); 
		return amountOut; 

	}

	function before_buy(uint256 amountIn, uint256 marketId) internal {
		fundPerBonds[marketId] = fundPerBonds[marketId] + amountIn; 
	}


	// Called by ammFactory 
    // @param amountIn amount of  used to buy bonds
	function buy(
		address marketFactoryAddress, 
		address to,
		uint256 amountIn, 
		uint256 marketId) external override returns(uint256){

		SafeERC20.safeTransferFrom(IERC20(collateral_address), msg.sender, address(this), amountIn); 
		before_buy(amountIn, marketId); 

		//Compute amountOut given totalPurchased and amountIn
		uint256 amountOut = getAmountOut(amountIn); 
		_incrementTotalPurchased(amountOut);

		AbstractMarketFactoryV3.Market memory _market = AbstractMarketFactoryV3(marketFactoryAddress).getZCBMarket(marketId);
		_market.shareTokens[0].trustedMint(to, amountOut); 

		return amountOut; 
	}


    function _incrementTotalPurchased(uint256 amount) internal {
        totalPurchased = totalPurchased + amount;
    }











    //constant, p(x) = C
 	//@param c: new 
    function calcAmountOutConstant(uint256 c, uint256 T) internal view returns(uint256){
    	return T; 
    }

    //linear, p(x) = ax + b 
    // function calcAmountOutLinear(uint256 c, uint256 T) external view returns(uint256){


    // }

    //sigmoid curve
    function calcAmountOut_(uint256 c, uint256 T) external view override returns(uint256){
    	uint256 a = 50; 
    	uint256 b = 5e5; //0.5
    	uint256 nu = c + T;

    	(uint256 exp1, uint256 exp1_) = mathlib.exp(nu, a); 
    	(uint256 exp2, uint256 exp2_) = mathlib.exp(T, a); 
    	console.log('exp1', exp1, exp1_);
    	console.log('exp2', exp2, exp2_);

    	uint256 num = (exp1/exp1_) + (b * ((exp2/exp2_) - 1))/1e6; 
    	console.log('num', num);

    	(uint256 log1, uint256 log1_) = mathlib.log(num, 1); 
    	console.log('logs', log1, log1_); 

    	uint256 here = a * (log1/log1_) - c; 
    	console.log('final', here); 

    	return 1; 

    }


    function _calcAmountOut(uint256 a) external view override returns(uint256){
    	uint256 c = 0;
    	(uint256 d, uint256 e) = mathlib.log(a,1); 
    	(uint256 f, uint256 g) = mathlib.exp(a,1);
    	console.log('numms', d,e);
    	console.log('numms', f,g); 
    	return d; 

    }


}