pragma solidity ^0.8.4;

import "./owned.sol";
import "../turbo/AMMFactory.sol"; 
import "./reputationtoken.sol"; 
import "../bonds/Ibondingcurve.sol"; 
import "./IMarketManager.sol";
import "hardhat/console.sol";


contract MarketManager is IMarketManager, Owned {
	/*Wrapper contract for bondingcurve markets, trades are restricted/funneled through here
		Types of restrictions are 
		1) Being verified 
		2) reputation to buy early 

		4) Restriction to quantity 

	Misc. 
		a) To avoid securitization, enforce selling Fee  
	*/

    modifier onlyController(){
        require(controller_address == msg.sender || msg.sender == owner, "is not controller"); 
        _;
    }

	
	ReputationNFT rep;

    uint256 private constant MAX_UINT = 2**256 - 1;
    uint256 private constant PRICE_PRECISION = 1e6; 

    address bondingCurveAddress; 
    address controller_address; 


    mapping(uint256=>uint256) private redemption_prices; //redemption price for each market, set when market resolves 
    mapping(uint256=>mapping(address=>uint256)) private assessment_collaterals;  //marketId-> trader->collateralIn
	mapping(uint256=> MarketRestrictionData) restriction_data; 

	struct MarketRestrictionData{
		bool duringMarketAssessment;
		bool onlyReputable; 
		bool marketDenied; 

		uint256 min_rep_score; 
		uint256 buy_threshold; //buy threshold is determined after the risk assessment phase when validator approves
	}



	constructor(address _creator_address,
				address reputationNFTaddress, 
				address _bondingCurveAddress, 
				address _controllerAddress) Owned(_creator_address){
		rep = ReputationNFT(reputationNFTaddress);
		bondingCurveAddress = _bondingCurveAddress; 
		controller_address = _controllerAddress;

	}

	/*
	Sets reputation score requirements and for the market, called by the controller when
	market is initiated. Buy threshold is set after the assessment is completed 
	*/
	function setMarketRestrictionData(
		bool _duringMarketAssessment,
		bool _onlyReputable, 
		uint256 marketId, 
		uint256 min_rep_score)
		external
		override
		onlyController
	{	

		min_rep_score = get_min_rep_score(marketId);
		restriction_data[marketId] = MarketRestrictionData(
			_duringMarketAssessment, 
			_onlyReputable,
			false,
			min_rep_score, 
			0
			); 
	}

	function get_min_rep_score(uint256 marketId) internal view returns(uint256){
		return 0;
	}

	/* Conditions */
 	
	function isVerified(address trader) internal view returns(bool){
		return (rep.balanceOf(trader) >= 1 || trader == owner); 
	}


	function isReputable(address trader, uint256 marketId) internal view returns(bool){
		return (restriction_data[marketId].min_rep_score<=rep.get_reputation(trader) || trader == owner); 
	}

	/*
	Returns true if during risk assessment phase
	*/
	function duringMarketAssessment(
		uint256 marketId) internal view returns(bool){
		return restriction_data[marketId].duringMarketAssessment; 
	}

	/*
	Returns true when market only allows reputable traders
	*/
	function onlyReputable(
		uint256 marketId
		) internal view returns(bool){
		return restriction_data[marketId].onlyReputable; 

	}

	//Need to find ot if the given market has enough (liquidity-required liq)
	function exposureSet(address trader, address ammFactoryAddress, address marketId) internal view returns(bool){
		return true; 
	}
       

	/*
	1.When Market is intialized, set both params as true
	2.When a certain time pass after initilization, change _onlyReputable to false 
	3.When validator approves, set _duringMarketAssessment to false  
	*/
	function setAssessmentPhase(
		uint256 marketId, 
		bool _duringMarketAssessment,
		bool _onlyReputable) 
		external
		override 
		onlyController 
	{
		MarketRestrictionData storage data = restriction_data[marketId]; 
		data.onlyReputable = _onlyReputable; 
		data.duringMarketAssessment = _duringMarketAssessment; 

	}

	/* 
	called by controller when market starts
	*/
	function initiate_bonding_curve(uint256 marketId) 
	external 
	override 
	onlyController
	{
		IBondingCurve(bondingCurveAddress).curve_init(marketId);
	}

	//Called offchain before doTrade contract calls 
	function canBuy(
		address trader,
		address ammFactoryAddress, 
		address marketFactoryAddress, 
		uint256 amount,//this is in DS with decimals 
		uint256 marketId) public view override returns(bool) {

		bool _duringMarketAssessment = duringMarketAssessment( marketId);
		bool _onlyReputable =  onlyReputable(marketId);

		if (_duringMarketAssessment){
			require(isVerified(trader), "User Not Verified");
		}

  		//During the early risk assessment phase only reputable can buy 
		if (_onlyReputable){
			require(_duringMarketAssessment, "Market needs to be in assessment phase"); 
			require(isReputable(trader, marketId));
		}

		//If after assessment there is a set buy threshold, people can't buy above this threshold
		if (!_duringMarketAssessment){
			//Buy threshold price needs to be set after assessment phase
			uint256 _buy_threshold = AbstractMarketFactoryV3(marketFactoryAddress).get_buy_threshold(marketId);
			uint256 price_after_trade = IBondingCurve(bondingCurveAddress).getExpectedPriceAfterTrade(
				marketId, 
				amount); 

			require(_buy_threshold > 0, "Restrictions need to be set"); 
			require(_buy_threshold > price_after_trade, "Quantity exceeds buy threshold"); 
		}

		return true; 
		// require(_duringMarketAssessment, "Sells not allowed during assessments");
		// require(exposureset(trader, ammFactoryAddress, marketId), "Not enough liquidity");

	}

	function canSell(
		address trader, 
		address ammFactoryAddress, 
		address marketFactoryAddress, 
		uint256 amount, 
		uint256 marketId
		) internal view returns(bool){
		bool _duringMarketAssessment = duringMarketAssessment( marketId);
		if (_duringMarketAssessment){
			require(isVerified(trader), "User Not Verified");
		}
		return true; 
	}

	/*
	During assessment phase, need to log the trader's 
	total collateral when he bought zcb. Trader can only redeem collateral in 
	when market is not approved 
	 */
	function log_assessment_trade(
		uint256 marketId, 
		address trader, 
		uint256 amountOut, 
		uint256 collateralIn)
		internal 
	{
		assessment_collaterals[marketId][trader] = collateralIn;

	}

	/* 
	After market is denied, redeem every zcb trader has for his collateral 
	*/
	function redeem_post_assessment(
		uint256 marketId, 
		address trader 
		) public
	{
		require(restriction_data[marketId].marketDenied, "Market Still During Assessment");
		uint256 collateral_amount = assessment_collaterals[marketId][trader]; 
		IBondingCurve(bondingCurveAddress).redeem_post_assessment(marketId, trader,collateral_amount);

	}


	function denyMarket(
		uint256 marketId)
		external 
		override 
		onlyController
	{
		MarketRestrictionData storage data = restriction_data[marketId]; 
		data.marketDenied = true; 
		data.duringMarketAssessment = false; 

	}




	function buy(
		AMMFactory ammFactory, 
		AbstractMarketFactoryV3 marketFactory, 
        uint256 _marketId,
        uint256 _collateralIn
        ) external override returns (uint256){
		require(canBuy(msg.sender,
			address(ammFactory),
		 	address(marketFactory), 
		 	_collateralIn, 
		 	_marketId),"Trade Restricted");


		uint256 amountOut = ammFactory.buyZCB(marketFactory,
			msg.sender,  
			bondingCurveAddress, 
			_marketId, 
			_collateralIn);

		if (duringMarketAssessment(_marketId)){
			log_assessment_trade(_marketId, msg.sender, amountOut, _collateralIn );
		}
		
		return amountOut; 
	}


	function sell(
		AMMFactory ammFactory, 
		AbstractMarketFactoryV3 marketFactory, 
        uint256 _marketId,
        uint256 _zcb_amount_in
        ) external override returns (uint256){

		require(canSell(msg.sender,
			address(ammFactory),
		 	address(marketFactory), 
		 	_zcb_amount_in, 
		 	_marketId),"Trade Restricted");

		uint256 amountOut = ammFactory.sellZCB(
			marketFactory, 
			msg.sender, 
			bondingCurveAddress, 
			_marketId, 
			_zcb_amount_in
			);

	}


	/*Maturity Functions */


	function get_redemption_price(uint256 marketId) public view returns(uint256){
		return redemption_prices[marketId]; 
	}

	/* 
	Redemption price, as calculated at maturity,
	depends on total_repayed/(principal + predetermined yield)
	If total_repayed = 0, redemption price is 0
	Param atLoss: defines circumstances where expected returns are higher than actual 
	Param Principal_loss : principal - returned amount 
	Param extra_gain: any extra yield not factored during assessment. Is 0 yield is as expected
	*/
	function update_redemption_price(
		uint256 marketId,
		bool atLoss, 
		uint256 extra_gain, 
		uint256 principal_loss) 
		external 
		override 
		onlyController
		{	

		IBondingCurve bondingcuve = IBondingCurve(bondingCurveAddress); 

		if (atLoss){
			require(principal_loss >0 && extra_gain==0, "loss err");
			uint256 total_bought_collateral = bondingcuve.getBondFunds(marketId);
			uint256 total_bought_bonds = bondingcuve.getTotalPurchased(marketId);
			console.log('totals', total_bought_collateral,total_bought_bonds ); 
			if (total_bought_collateral - principal_loss > 0){
				redemption_prices[marketId] = (total_bought_collateral-principal_loss)*PRICE_PRECISION/total_bought_bonds; 
			}
			else{
				redemption_prices[marketId] = 0; 
			}
		}
		else{
			require(extra_gain >= 0 && principal_loss ==0,  "loss err"); 
			uint256 max_quantity = bondingcuve.getMaxQuantity(marketId); 
			redemption_prices[marketId] = (extra_gain + max_quantity)*PRICE_PRECISION/max_quantity;
			console.log('Max quantity', max_quantity); 
		}	

			console.log('redemption_price', redemption_prices[marketId]); 
		}


	/* 
	Handles maturity. Includes default/no defaults
	Called by controller after redemption price has been set 
	
	if default: need to burn the underlying tokens used as collateral to buy the zcb as first loss
	*/
	function handle_maturity(
		uint256 marketId, 
		bool atLoss, 
		uint256 principal_loss) 
		external
		override 
		onlyController
	{
		IBondingCurve bondingcurve = IBondingCurve(bondingCurveAddress); 
		uint256 redemption_price = get_redemption_price(marketId); 
		require(redemption_price > 0, "Need to set redemption price"); 
		uint256 total_bought_bonds = bondingcurve.getTotalPurchased(marketId);
		uint256 total_bought_collateral = bondingcurve.getBondFunds(marketId);

	if (atLoss){

		uint256 burnamount = total_bought_collateral - ((redemption_price * total_bought_bonds)/PRICE_PRECISION);
		console.log('burnamounts', burnamount);

		if(principal_loss >0){
			require(burnamount>0,"burn amount err"); 
			bondingcurve.burn_first_loss( marketId, burnamount); 
		}
	
	}

	}

	/* 
	Needs to be called at maturity, market needs to be resolved first(from controller)
	*/
	function redeem(
		uint256 marketId,
	 	address marketFactory,
	 	address receiver, 
	 	uint256 zcb_redeem_amount) public returns(uint256){
		//require(AbstractMarketFactoryV3(marketFactory).isMarketResolved(marketId), "Market not resolved"); 

		uint256 redemption_price = get_redemption_price(marketId); 
		require(redemption_price > 0, "Redeem price is 0");

		uint256 collateral_redeem_amount = (redemption_price * zcb_redeem_amount)/PRICE_PRECISION; 

		IBondingCurve(bondingCurveAddress).redeem(marketId,
		 receiver,
		 zcb_redeem_amount,
		 collateral_redeem_amount);

		return collateral_redeem_amount; 

	}




	function max(uint256 a, uint256 b) internal pure returns (uint256) {
	    return a >= b ? a : b;
	}


}

