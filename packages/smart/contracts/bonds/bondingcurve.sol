pragma solidity ^0.8.4; 

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Ibondingcurve.sol";
import "../turbo/AbstractMarketFactoryV3.sol";
import "../utils/AnalyticMath.sol";
import "hardhat/console.sol";

//TEST: buys, market creation, fetching
contract BondingCurve is IBondingCurve{

    AnalyticMath mathlib; 

    address collateral_address; 

    OwnedERC20 testZCB; 

    mapping(uint256=>uint256) totalPurchased; 
    mapping(uint256=>uint256) fundPerBonds; 

    event Bought(
    	address buyer,
    	uint256 amountOut 
    	);

    event Sold(
    	address seller, 
    	uint256 amountIn
    	); 

    constructor(
    	address _collateral_address, 
    	address _mathlib_address
    	) {

    	collateral_address = _collateral_address; 

    	mathlib = AnalyticMath(_mathlib_address); 
    	mathlib.init(); 

    	//FOR TESTING 
    	testZCB = new OwnedERC20("test", "test", address(this));

    }

    function getCollateral() public view returns(address){
    	return collateral_address; 
    }

	function getCurrentPrice() public view  returns(uint256){
		return 1;
	}

	function getBondFunds(uint256 marketId) public view returns(uint256){
		return fundPerBonds[marketId]; 
	}
	function getTotalPurchased(uint256 marketId) public view returns(uint256){
		return totalPurchased[marketId];
	}

	// Returns ZCB Token for the specific market 
	function getZCB(uint256 marketId) internal view returns(OwnedERC20){

		// AbstractMarketFactoryV3.Market memory _market = AbstractMarketFactoryV3(marketFactoryAddress).getZCBMarket(marketId);
		//return _market.shareTokens[0]; 
		return testZCB;
	}

	function getZCB_balance(uint256 marketId, address from) external view returns(uint256){
		OwnedERC20 zcb = getZCB(marketId);
		return zcb.balanceOf(from); 
	}
	// Returns amount of bond out after a bonding curve purchase
	// @params amountIn the amount of DS used to purchase bonds
	// @returns amountOut the amount of bonds received 
	function getAmountOut(uint256 marketId, uint256 amountIn, bool buy) internal view returns(uint256){
		uint256 curve_idx; //TODO get from market

		uint256 amountOut = buy ? calcBuyAmountOutConstant(totalPurchased[marketId], amountIn)
							:calcSellAmountOutConstant(totalPurchased[marketId], amountIn); 

		return amountOut; 

	}

	function before_trade(uint256 amountIn, uint256 marketId, bool buy) internal {
		uint256 cur_funds = fundPerBonds[marketId];
		fundPerBonds[marketId] = buy ? cur_funds + amountIn : cur_funds - amountIn; 

	}

	function get_fee(uint256 amount) internal view returns(uint256){
		return 0; 
	}

	// Called by ammFactory 
    // @param amountIn amount of  used to buy bonds
	function buy(
		address marketFactoryAddress, 
		address to,
		uint256 amountIn, 
		uint256 marketId) external override returns(uint256){

		SafeERC20.safeTransferFrom(IERC20(collateral_address), msg.sender, address(this), amountIn); 
		before_trade(amountIn, marketId, true); 

		//Compute amountOut given totalPurchased and amountIn
		uint256 amountOut = getAmountOut(marketId, amountIn, true); 
		incrementTotalPurchased(marketId, amountOut);

		OwnedERC20 zcb_token = getZCB(marketId); 
		zcb_token.trustedMint(to, amountOut);

		emit Bought(to, amountOut);
		return amountOut; 
	}

	// Called by ammfactory, needs to deduct fees in that contract(after this function) 
	// so only should be called from there
	// ammfactory should give back the user shortZCB tokens, and keep the collateral 
	function sell(
		address marketFactoryAddress,
		address from,  
		uint256 zcb_amountIn, 
		uint256 marketId) external override returns(uint256){

		OwnedERC20 zcb = getZCB(marketId); 
		zcb.trustedBurn(from, zcb_amountIn); 
		before_trade(zcb_amountIn, marketId, false); 

		uint256 collateral_amountOut = getAmountOut(marketId, zcb_amountIn, false);
		decrementTotalPurchased(marketId, collateral_amountOut); 
		uint256 fee_deducted_collateral_amountOut = collateral_amountOut - get_fee(collateral_amountOut); 

		SafeERC20.safeTransfer(IERC20(collateral_address), msg.sender, fee_deducted_collateral_amountOut); 

		emit Sold(msg.sender, zcb_amountIn); 
		return fee_deducted_collateral_amountOut; 
	}

    function incrementTotalPurchased(uint256 marketId, uint256 amount) internal {
        totalPurchased[marketId] = totalPurchased[marketId] + amount;
    }

    function decrementTotalPurchased(uint256 marketId, uint256 amount) internal {
        totalPurchased[marketId] = totalPurchased[marketId] - amount;
    }

    // function redeem(

    // 	)













    //constant, p(x) = C
    function calcBuyAmountOutConstant(uint256 c, uint256 T) internal view returns(uint256){
    	uint256 price = 1; 
    	return T/price; 
    }
    function calcSellAmountOutConstant(uint256 c, uint256 T) internal view returns(uint256){
    	uint256 price = 1; 
    	return T/price; 
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