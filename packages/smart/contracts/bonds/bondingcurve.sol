pragma solidity ^0.8.4; 

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Ibondingcurve.sol";
import "../turbo/AbstractMarketFactoryV3.sol";
import "../utils/AnalyticMath.sol";
import "../stablecoin/owned.sol";
import "hardhat/console.sol";

//TEST: buys, market creation, fetching
contract BondingCurve is Owned, IBondingCurve{
    /* ========== MODIFIERS ========== */
    modifier onlyManager() {
        require(msg.sender == manager_address || msg.sender == owner,
        		 "Only Manager can call this function");
        _;
    }


    AnalyticMath mathlib; 

    address public collateral_address; 
    address manager_address; 

    OwnedERC20 testZCB; 

    mapping(uint256=>uint256) totalPurchased; // marketID => total number of bond tokens purchased 
    mapping(uint256=>uint256) fundPerBonds; // marketID => total amount of collateral recieved per bond curve.
    mapping(uint256=>uint256) maxQuantity; //x where p(x) = 1 

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
    	address _mathlib_address, 
    	address _creator_address
    	) Owned(_creator_address){

    	collateral_address = _collateral_address; 
    	mathlib = AnalyticMath(_mathlib_address); 
    	mathlib.init(); 

    	//FOR TESTING 
    	testZCB = new OwnedERC20("test", "test", address(this));

    }

    function curve_init(uint256 marketId) external override onlyManager{
    	maxQuantity[marketId] = calcMaxQuantityConstant();

    }

    function addManager(address _manager_address) external override onlyOwner{
    	manager_address = _manager_address; 
    }


    function getCollateral() public view override returns(address){
    	return collateral_address; 
    }

	function getCurrentPrice() public view  returns(uint256){
		return 1;
	}

	/// @dev returns expected price of bond token after buying bond tokens
	/// @param amountIn amount of ds
	function getExpectedPriceAfterTrade(
		uint256 marketId, 
		uint256 amountIn) public view override returns(uint256){
		uint256 amountOut = getAmountOut(marketId, amountIn, true); 
		//TODO curve needs to be different for each market 
		return calcPriceForAmountConstant(totalPurchased[marketId] + amountOut); 
	}

	function getBondFunds(uint256 marketId) public view override returns(uint256){
		return fundPerBonds[marketId]; 
	}
	function getTotalPurchased(uint256 marketId) public view override returns(uint256){
		return totalPurchased[marketId];
	}

	function getMaxQuantity(uint256 marketId) public view override returns(uint256){
		return maxQuantity[marketId];
	}

	/// @dev Returns ZCB Token for the specific market 
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
	/// @param amountIn the amount of DS used to purchase bonds
	/// @return amountOut the amount of bonds received 
	function getAmountOut(uint256 marketId, uint256 amountIn, bool buy) internal view returns(uint256){
		uint256 curve_idx; //TODO get from market

		uint256 amountOut = buy ? calcBuyAmountOutConstant(totalPurchased[marketId], amountIn)
							:calcSellAmountOutConstant(totalPurchased[marketId], amountIn); 
		return amountOut; 

	}
	/// @dev before trade hook
	/// @param buy indicates whether trade is buy or sell.
	/// @param amountIn is amount is or out depending on "buy"
	function before_trade(uint256 amountIn, uint256 marketId, bool buy) internal {
		uint256 cur_funds = fundPerBonds[marketId];
		fundPerBonds[marketId] = buy ? cur_funds + amountIn : cur_funds - amountIn; 
	}

	/// @dev Get fees for the market for the given time interval
	function get_fee(uint256 marketId, uint256 amount) internal view returns(uint256){
		return 0; 
	}

	/// @dev Called by ammFactory 
    /// @param amountIn amount of collateral used to buy bonds
	//TODO CHECKS, EFFECTS, INTERACTIONS => calculate expected values first then transfer funds. can do unchecked arithmetic after checks.
	function buy(
		address marketFactoryAddress, 
		address to,
		uint256 amountIn, 
		uint256 marketId) external override returns(uint256) {
		before_trade(amountIn, marketId, true); 

		//Compute amountOut given totalPurchased and amountIn
		uint256 amountOut = getAmountOut(marketId, amountIn, true); 
		incrementTotalPurchased(marketId, amountOut);

		OwnedERC20 zcb_token = getZCB(marketId);
		zcb_token.trustedMint(to, amountOut);
		SafeERC20.safeTransferFrom(IERC20(collateral_address), msg.sender, address(this), amountIn);

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

		uint256 collateral_amountOut = getAmountOut(marketId, zcb_amountIn, false);
		before_trade(collateral_amountOut, marketId, false); 

		decrementTotalPurchased(marketId, zcb_amountIn); 
		uint256 fee_deducted_collateral_amountOut = collateral_amountOut - get_fee(marketId, collateral_amountOut); 

		SafeERC20.safeTransfer(IERC20(collateral_address), msg.sender, fee_deducted_collateral_amountOut); 

		emit Sold(msg.sender, zcb_amountIn); 
		return fee_deducted_collateral_amountOut; 
	}



	function redeem(uint256 marketId, 
		address receiver, 
		uint256 zcb_redeem_amount, 
		uint256 collateral_redeem_amount) external override onlyManager{
		OwnedERC20 zcb = getZCB(marketId); 
		zcb.trustedBurn(receiver, zcb_redeem_amount); 
		SafeERC20.safeTransfer(IERC20(collateral_address), receiver, collateral_redeem_amount); 
	}

	function redeem_post_assessment(
		uint256 marketId, 
		address redeemer,
		uint256 collateral_amount) external override onlyManager{

		OwnedERC20 zcb = getZCB(marketId); 
		uint256 redeem_amount = zcb.balanceOf(redeemer); 
		zcb.trustedBurn(redeemer, redeem_amount); 
		SafeERC20.safeTransfer(IERC20(collateral_address), redeemer, collateral_amount); 

	}

	/*
	Burn the collateral used to buy ZCB when there is a default 
	TODO include burning function from DS
	*/
	function burn_first_loss(
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
		address to) external override onlyManager{
		getZCB(marketId).trustedBurn(to, burnAmount); 
	}


    function incrementTotalPurchased(uint256 marketId, uint256 amount) internal {
        totalPurchased[marketId] = totalPurchased[marketId] + amount;
    }

    function decrementTotalPurchased(uint256 marketId, uint256 amount) internal {
        totalPurchased[marketId] = totalPurchased[marketId] - amount;
    }


    //constant, p(x) = C
    function calcBuyAmountOutConstant(uint256 c, uint256 T) internal pure returns(uint256){
    	uint256 price = 1; 
    	return T/price; 
    }
    function calcSellAmountOutConstant(uint256 c, uint256 T) internal pure returns(uint256){
    	uint256 price = 1; 
    	return T/price; 
    }
    //get y = p(x)
    function calcPriceForAmountConstant(uint256 c) internal pure returns(uint256){
    	return 1; //price is constant 
    }
    function calcMaxQuantityConstant() internal pure returns (uint256){
    	return 1e6 * 100; 
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