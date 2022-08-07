pragma solidity ^0.8.4; 

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Ibondingcurve.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../turbo/AbstractMarketFactoryV3.sol";
import "./curves.sol";
import "./curvetypes.sol";
import "../stablecoin/owned.sol";
import "hardhat/console.sol";

//TEST: buys, market creation, fetching
contract BondingCurveOriginal is Owned, IBondingCurve{

	using LinearCurve for CurveTypes.Linear;

    /* ========== MODIFIERS ========== */
    modifier onlyManager() {
        require(msg.sender == market_manager || msg.sender == owner, "Only Market Manager can call this function");
        _;
    }

    address public collateral_address;
    address market_manager;

    OwnedERC20 testZCB;

	struct CurveData {
		uint256 maxQuantity;
		CurveTypes.Linear curve;
	}
	
	mapping(uint256 => CurveData) bondCurveData;

    event Bought(
    	address buyer,
    	uint256 amountOut 
    	);

    event Sold(
    	address seller, 
    	uint256 amountIn
    	); 

	/*----Constructor + Setup Functions----*/
    constructor(
    	address _collateral_address, 
    	address _mathlib_address, 
    	address _creator_address
    	) Owned(_creator_address){

    	collateral_address = _collateral_address; 
    	//FOR TESTING 
    	testZCB = new OwnedERC20("test", "test", address(this));

    }

	/**
	 @notice sets market manager address
	 */
	function setMarketManager(address _market_manager) external override onlyOwner{
    	market_manager = _market_manager; 
    }

	/*----Getters----*/

	/// @dev Returns ZCB Token for the specific market 
	function getZCB(uint256 marketId) internal view returns(OwnedERC20){
		// AbstractMarketFactoryV3.Market memory _market = AbstractMarketFactoryV3(marketFactoryAddress).getZCBMarket(marketId);
		//return _market.shareTokens[0]; 
		return testZCB;
	}

	function getFee(uint256 marketId) internal view returns (uint256 fee) {
		return 0;
	}

	function getTotalZCB(uint256 marketId) public override view returns (uint256 result) {
		result = bondCurveData[marketId].curve.getZCB();
	}

	function getTotalDS(uint256 marketId) public override view returns (uint256 result) {
		result = bondCurveData[marketId].curve.getDS();
	}

	function getMaxQuantity(uint256 marketId) public override view returns (uint256 result) {
		result = bondCurveData[marketId].curve.calculateMaxQuantity();
	}

	function getExpectedPrice(uint256 marketId, uint256 amountIn) public override view returns (uint256 result) {
		result = bondCurveData[marketId].curve.calcProjectedPrice();
	}

	function getCollateral() public override view returns (address)  {
		return collateral_address;
	}


	/*----Curve Logic----*/

	/**
	 @notice initializes curve data
	 */
    function curveInit(uint256 marketId) external override onlyManager{
		CurveData storage data = bondCurveData[marketId];
		data.curve = computeCurveParams(marketId);
		data.maxQuantity = data.curve.calculateMaxQuantity(); //? 
    }

	/**
	 @notice returns curve type params
	 */
	function computeCurveParams(uint256 marketId) internal returns (CurveTypes.Linear memory) {
		return CurveTypes.Linear({
			a: 1,
			b: 0,
			x_i:0,
			y_i:0
		});
	}

	/**
	 @dev doesn't perform any checks??
	 @notice is called by AMM Factory.
	 @param amountIn: amount of collateral (ds) inputted
	 */
	function buy(
		address marketFactoryAddress, 
		address trader,
		uint256 amountIn, 
		uint256 marketId
	) external override returns(uint256) {
		CurveData storage curve_data = bondCurveData[marketId];
		uint256 amountOut = curve_data.curve.calculateZCBOut(amountIn); // ? no checks here?

		OwnedERC20 zcb_token = getZCB(marketId);
		zcb_token.trustedMint(trader, amountOut);
		SafeERC20.safeTransferFrom(IERC20(collateral_address), msg.sender, address(this), amountIn);
		
		emit Bought(trader, amountOut);
		return amountOut; 
	}

	/**
	 @notice Called by ammfactory, needs to deduct fees in that contract(after this function)
	 so only should be called from there ammfactory should give back the user shortZCB tokens, and keep the collateral 
	 @param amountIn: amount of ZCB inputted
	 TODO checks first
	 
	 */
	function sell(
		address marketFactoryAddress, 
		address trader,
		uint256 amountIn, 
		uint256 marketId
	) external override returns (uint256) {
		CurveData storage curve_data = bondCurveData[marketId];
	
		uint256 amountOut = curve_data.curve.calculateDSOut(amountIn);

		OwnedERC20 zcb = getZCB(marketId); 

		zcb.trustedBurn(trader, amountIn); 

		uint256 feeDeductedAmount = amountOut - curve_data.curve.sellingFee();

		SafeERC20.safeTransfer(IERC20(collateral_address), msg.sender, feeDeductedAmount);

		emit Sold(msg.sender, amountIn);

		return feeDeductedAmount;
	}

	function redeem(
		uint256 marketId, 
		address receiver, 
		uint256 zcb_redeem_amount, 
		uint256 collateral_redeem_amount
	) external override onlyManager{
		OwnedERC20 zcb = getZCB(marketId); 
		zcb.trustedBurn(receiver, zcb_redeem_amount); 
		SafeERC20.safeTransfer(IERC20(collateral_address), receiver, collateral_redeem_amount); 
	}

	function redeemPostAssessment(
		uint256 marketId, 
		address redeemer,
		uint256 collateral_amount
	) external override onlyManager{
		OwnedERC20 zcb = getZCB(marketId); 
		uint256 redeem_amount = zcb.balanceOf(redeemer); 
		zcb.trustedBurn(redeemer, redeem_amount); 
		SafeERC20.safeTransfer(IERC20(collateral_address), redeemer, collateral_amount); 
	}

	/*
	Burn the collateral used to buy ZCB when there is a default 
	TODO include burning function from DS
	*/
	function burnFirstLoss(
		uint256 marketId, 
		uint256 burn_collateral_amount
		) external override onlyManager{

		SafeERC20.safeTransfer(IERC20(collateral_address), owner, burn_collateral_amount); 
	}

	function mint(
		uint256 marketId, 
		uint256 mintAmount,
		address to
	) external override onlyManager{ 	
		getZCB(marketId).trustedMint(to,mintAmount); 
	}


	function burn(
		uint256 marketId, 
		uint256 burnAmount, 
		address to
	) external override onlyManager{
		getZCB(marketId).trustedBurn(to, burnAmount); 
	}

	// DEPRECATED

	// 	function getCurrentPrice(uint256 marketId) public view  returns(uint256){
	// 	return 1;
	// }

	// /// @dev returns expected price of bond token after buying bond tokens
	// /// @param amountIn amount of ds
	// function getExpectedPriceAfterTrade(
	// 	uint256 marketId, 
	// 	uint256 amountIn
	// ) public view override returns(uint256){
	// 	uint256 amountOut = getAmountOut(marketId, amountIn, true); 
	// 	//TODO curve needs to be different for each market 
	// 	return calcPriceForAmountConstant(totalPurchased[marketId] + amountOut); 
	// }

	// function getBondFunds(uint256 marketId) public view override returns(uint256){
	// 	return fundPerBonds[marketId]; 
	// }
	// function getTotalPurchased(uint256 marketId) public view override returns(uint256){
	// 	return totalPurchased[marketId];
	// }

	// function getMaxQuantity(uint256 marketId) public view override returns(uint256){
	// 	return maxQuantity[marketId];
	// }

	// /// @dev Returns ZCB Token for the specific market 
	// function getZCB(uint256 marketId) internal view returns(OwnedERC20){
	// 	// AbstractMarketFactoryV3.Market memory _market = AbstractMarketFactoryV3(marketFactoryAddress).getZCBMarket(marketId);
	// 	//return _market.shareTokens[0]; 
	// 	return testZCB;
	// }

	// function getZCB_balance(uint256 marketId, address from) external view returns(uint256){
	// 	OwnedERC20 zcb = getZCB(marketId);
	// 	return zcb.balanceOf(from); 
	// }
	// // Returns amount of bond out after a bonding curve purchase
	// /// @param amountIn the amount of DS used to purchase bonds
	// /// @return amountOut the amount of bonds received 
	// function getAmountOut(uint256 marketId, uint256 amountIn, bool buy) internal view returns(uint256){

	// 	uint256 amountOut = buy ? lines[marketId].calculateZCBOut(amountIn)
	// 						:lines[marketId].calculateDSOut(amountIn); 
	// 	return amountOut; 

	// }
	// /// @dev before trade hook
	// /// @param buy indicates whether trade is buy or sell.
	// /// @param amountIn is amount is or out depending on "buy"
	// function before_trade(uint256 amountIn, uint256 marketId, bool buy) internal {
	// 	uint256 cur_funds = fundPerBonds[marketId];
	// 	fundPerBonds[marketId] = buy ? cur_funds + amountIn : cur_funds - amountIn; 
	// }

	// /// @dev Get fees for the market for the given time interval
	// function get_fee(uint256 marketId, uint256 amount) internal view returns(uint256){
	// 	return 0; 
	// }

	// /// @dev Called by ammFactory 
    // /// @param amountIn amount of collateral used to buy bonds
	// function buy(
	// 	address marketFactoryAddress, 
	// 	address to,
	// 	uint256 amountIn, 
	// 	uint256 marketId) external override returns(uint256) {
	// 	before_trade(amountIn, marketId, true); 

	// 	//Compute amountOut given totalPurchased and amountIn
	// 	uint256 amountOut = getAmountOut(marketId, amountIn, true); 
	// 	incrementTotalPurchased(marketId, amountOut);

	// 	OwnedERC20 zcb_token = getZCB(marketId);
	// 	zcb_token.trustedMint(to, amountOut);
	// 	SafeERC20.safeTransferFrom(IERC20(collateral_address), msg.sender, address(this), amountIn);
		

	// 	emit Bought(to, amountOut);
	// 	return amountOut; 
	// }

	// // Called by ammfactory, needs to deduct fees in that contract(after this function) 
	// // so only should be called from there
	// // ammfactory should give back the user shortZCB tokens, and keep the collateral 
	// function sell(
	// 	address marketFactoryAddress,
	// 	address from,  
	// 	uint256 zcb_amountIn, 
	// 	uint256 marketId) external override returns(uint256){

	// 	OwnedERC20 zcb = getZCB(marketId); 
	// 	zcb.trustedBurn(from, zcb_amountIn); 

	// 	uint256 collateral_amountOut = getAmountOut(marketId, zcb_amountIn, false);
	// 	before_trade(collateral_amountOut, marketId, false); 

	// 	decrementTotalPurchased(marketId, zcb_amountIn); 
	// 	uint256 fee_deducted_collateral_amountOut = collateral_amountOut - get_fee(marketId, collateral_amountOut); 

	// 	SafeERC20.safeTransfer(IERC20(collateral_address), msg.sender, fee_deducted_collateral_amountOut);

	// 	emit Sold(msg.sender, zcb_amountIn); 
	// 	return fee_deducted_collateral_amountOut; 
	// }



	// function redeem(uint256 marketId, 
	// 	address receiver, 
	// 	uint256 zcb_redeem_amount, 
	// 	uint256 collateral_redeem_amount) external override onlyManager{
	// 	OwnedERC20 zcb = getZCB(marketId); 
	// 	zcb.trustedBurn(receiver, zcb_redeem_amount); 
	// 	SafeERC20.safeTransfer(IERC20(collateral_address), receiver, collateral_redeem_amount); 
	// }

	// function redeem_post_assessment(
	// 	uint256 marketId, 
	// 	address redeemer,
	// 	uint256 collateral_amount) external override onlyManager{

	// 	OwnedERC20 zcb = getZCB(marketId); 
	// 	uint256 redeem_amount = zcb.balanceOf(redeemer); 
	// 	zcb.trustedBurn(redeemer, redeem_amount); 
	// 	SafeERC20.safeTransfer(IERC20(collateral_address), redeemer, collateral_amount); 
	// }

	// /*
	// Burn the collateral used to buy ZCB when there is a default 
	// TODO include burning function from DS
	// */
	// function burn_first_loss(
	// 	uint256 marketId, 
	// 	uint256 burn_collateral_amount
	// 	) external override onlyManager{

	// 	SafeERC20.safeTransfer(IERC20(collateral_address), owner, burn_collateral_amount); 
	// }


	// function mint(
	// 	uint256 marketId, 
	// 	uint256 mintAmount,
	// 	address to
	// 	) external override onlyManager{ 	
	// 	getZCB(marketId).trustedMint(to,mintAmount); 
	// }


	// function burn(
	// 	uint256 marketId, 
	// 	uint256 burnAmount, 
	// 	address to) external override onlyManager{
	// 	getZCB(marketId).trustedBurn(to, burnAmount); 
	// }


    // function incrementTotalPurchased(uint256 marketId, uint256 amount) internal {
    //     totalPurchased[marketId] = totalPurchased[marketId] + amount;
    // }

    // function decrementTotalPurchased(uint256 marketId, uint256 amount) internal {
    //     totalPurchased[marketId] = totalPurchased[marketId] - amount;
    // }

    // function calcMaxQuantityConstant() internal pure returns (uint256){
    // 	return 1e6 * 100; 
    // }



    // //linear, p(x) = ax + b 
    // // function calcAmountOutLinear(uint256 c, uint256 T) external view returns(uint256){


    // // }

    // // SIGMOID CURVE STUFF

	// /**
	//  @notice returns sigmoid parameters
	//  @dev C must be set to 0
	//  */
	// function get_sigmoid_parameters(uint256 marketId) internal pure returns (Sigmoid memory) {
	// 	return Sigmoid({
	// 		a: 1,
	// 		b: 1,
	// 		C: 0
	// 	});
	// }

	// /**
	//  @notice calculates ZCB tokens given DS
	//  @param marketId: market ID
	//  @param amountIn: input DS
	//  @dev ZCB(x) = a*ln(exp(x/a) + b)
	//  */
	// function sigmoidOut(uint256 marketId, uint256 amountIn) external view returns (uint256) {
	// 	Sigmoid storage sigmoid = sigmoids[marketId];

	// }

    // function calcAmountOut_(uint256 c, uint256 T) external view override returns(uint256){
    // 	uint256 a = 50; 
    // 	uint256 b = 5e5; //0.5
    // 	uint256 nu = c + T;

    // 	(uint256 exp1, uint256 exp1_) = mathlib.exp(nu, a); 
    // 	(uint256 exp2, uint256 exp2_) = mathlib.exp(T, a); 
    // 	console.log('exp1', exp1, exp1_);
    // 	console.log('exp2', exp2, exp2_);

    // 	uint256 num = (exp1/exp1_) + (b * ((exp2/exp2_) - 1))/1e6; 
    // 	console.log('num', num);

    // 	(uint256 log1, uint256 log1_) = mathlib.log(num, 1); 
    // 	console.log('logs', log1, log1_); 

    // 	uint256 here = a * (log1/log1_) - c; 
    // 	console.log('final', here); 

    // 	return 1; 

    // }


    // function _calcAmountOut(uint256 a) external view override returns(uint256){
    // 	uint256 c = 0;
    // 	(uint256 d, uint256 e) = mathlib.log(a,1); 
    // 	(uint256 f, uint256 g) = mathlib.exp(a,1);
    // 	console.log('numms', d,e);
    // 	console.log('numms', f,g); 
    // 	return d;
    // }

}