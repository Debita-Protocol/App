pragma solidity ^0.8.4;

import "./owned.sol";
import "../turbo/AMMFactory.sol"; 
import "./reputationtoken.sol"; 
import {BondingCurve} from "../bonds/bondingcurve.sol";
import {Controller} from "./controller.sol";
import "./IMarketManager.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";



contract MarketManager is IMarketManager, Owned {
	/*Wrapper contract for bondingcurve markets, trades are restricted/funneled through here
		Types of restrictions are 
		1) Being verified 
		2) reputation to buy early 

		4) Restriction to quantity 

	Misc. 
		a) To avoid securitization, enforce selling Fee  
	*/

    uint256 private constant PRICE_PRECISION = 1e6; 

	ReputationNFT rep;
    BondingCurve bondingCurve; 
    Controller controller;

    mapping(uint256=>uint256) private redemption_prices; //redemption price for each market, set when market resolves 
    mapping(uint256=>mapping(address=>uint256)) private assessment_collaterals;  //marketId-> trader->collateralIn
	mapping(uint256=> MarketPhaseData) restriction_data; // market ID => restriction data
	mapping(uint256=> uint256) collateral_pot; // marketID => total collateral recieved (? isn't this redundant bc bonding curves fundsperBonds)
	mapping(uint256=> CDP) private debt_pools; // marketID => debt info
	mapping(uint256 => address[]) private marketTraders; // marketId => ppl who currently are holding ZCB
	mapping(uint256 => mapping(address => uint256)) private bondsPerTrader; // marketId => trader => total bonds bought.

	struct CDP{
		mapping(address=>address) collateral_address; 
		mapping(address=>uint256) collateral_amount;
		mapping(address=>uint256) borrowed_amount; 
		uint256 total_debt; 
		uint256 total_collateral; //only usdc 
	}

	struct MarketPhaseData {
		bool duringMarketAssessment;
		bool onlyReputable;
		bool marketDenied;
		uint256 min_rep_score; 
		uint256 buy_threshold; //buy threshold is determined after the risk assessment phase when validator approves
		// buy threshold should be the max quantity of bond tokesn bought
	}

	uint256 private INSURANCE_CONSTANT = 5 * 10**5; // 0.5 for DS decimal format.

	
    modifier onlyController(){
        require(address(controller) == msg.sender || msg.sender == owner, "is not controller"); 
        _;
    }

	constructor(
		address _creator_address,
		address reputationNFTaddress, 
		address _bondingCurveAddress, 
		address _controllerAddress
	) Owned(_creator_address){
		rep = ReputationNFT(reputationNFTaddress);
		bondingCurve = BondingCurve(_bondingCurveAddress); 
		controller = Controller(_controllerAddress);
	}


	/*----Phase Functions----*/

	/* 
	called by controller when market starts
	*/
	function initiate_bonding_curve(uint256 marketId) external override onlyController{
		bondingCurve.curveInit(marketId);
		// CDP storage cdp = debt_pools[marketId];  => is pointless bc initialized to 0 anyway.
		// cdp.total_debt = 0;
		// cdp.total_collateral = 0;
	}

	/*
	1.When Market is intialized, set both params as true
	2.When a certain time pass after initilization, change _onlyReputable to false 
	3.When validator approves, set _duringMarketAssessment to false
	*/
	function setAssessmentPhase(
		uint256 marketId, 
		bool _duringMarketAssessment,
		bool _onlyReputable
	) external override onlyController {
		MarketRestrictionData storage data = restriction_data[marketId]; 
		data.onlyReputable = _onlyReputable; 
		data.duringMarketAssessment = _duringMarketAssessment; 
	}

	/* 
	Called when market should end, a) when denied b) when maturity 
	*/
	function deactivateMarket(uint256 marketId) external override onlyController{
		restriction_data[marketId].marketDenied = true; 
	}


	/**
	@dev Sets reputation score requirements and for the market, called by the controller when
	market is initiated. Buy threshold is set after the assessment is completed 
	 */
	function setMarketRestrictionData(
		bool _duringMarketAssessment,
		bool _onlyReputable, 
		uint256 marketId, 
		uint256 min_rep_score
	) external override onlyController {
		min_rep_score = getMinRepScore(marketId);
		restriction_data[marketId] = MarketRestrictionData(
			_duringMarketAssessment, 
			_onlyReputable,
			false,
			min_rep_score, 
			0
		);
	}

	/*---View Functions---*/

	/* 
	Returns Minimal reputation score to participate in the onlyReputation phase
	TODO
	*/
	function getMinRepScore(uint256 marketId) internal view returns(uint256){
		return restriction_data[marketId].min_rep_score;
	}

	/* Conditions */
 	
	/**
	 @dev verification of trader initializes reputation score at 0, to gain reputation need to participate in markets.
	 */
	function isVerified(address trader) internal view returns(bool){
		return controller.isVerified(trader);
		//return (rep.balanceOf(trader) >= 1 || trader == owner); 
	}


	function isReputable(address trader, uint256 marketId) internal view returns(bool){
		return (restriction_data[marketId].min_rep_score<=rep.getReputationScore(trader).score || trader == owner); 
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

	//TODO Need to find out if the given market has enough (liquidity-required liq)
	function exposureSet(address trader, address ammFactoryAddress, address marketId) internal view returns(bool){
		return true; 
	}

	function marketActive(uint256 marketId) public view returns(bool){
		return !restriction_data[marketId].marketDenied; 
	}

	/// @dev Called offchain before doTrade contract calls 
	function canBuy(
		address trader,
		address ammFactoryAddress, 
		address marketFactoryAddress, 
		uint256 amount, //this is in DS with decimals.
		uint256 marketId
	) public view override returns(bool) {
		require(marketActive(marketId), "Market Not Active"); 
		bool _duringMarketAssessment = duringMarketAssessment(marketId);
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
			uint256 buy_threshold = restriction_data[marketId].buy_threshold;
			uint256 price_after_trade = bondingCurve.getExpectedPrice(
				marketId,
				amount
			);

			require(buy_threshold > 0, "Restrictions need to be set"); 
			require(buy_threshold > price_after_trade, "Quantity exceeds buy threshold"); 
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
		require(marketActive(marketId), "Market Not Active"); 
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
	function redeemPostAssessment(
		uint256 marketId, 
		address trader 
		) public
	{
		require(restriction_data[marketId].marketDenied, "Market Still During Assessment");
		uint256 collateral_amount = assessment_collaterals[marketId][trader]; 
		BondingCurve(bondingCurveAddress).redeemPostAssessment(marketId, trader, collateral_amount);
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
			log_assessment_trade(_marketId, msg.sender, amountOut, _collateralIn);
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

	/* 
	For now only allow collateral to be ds
	*/
	function borrow_with_collateral(
		uint256 _marketId, 
		uint256 requested_zcb, 
		address trader
		) external override{
		//1.Use 100 ds as collateral to borrow 100zcb 1:1, only this for now 
		//2.use 0.1eth(170) as collateral to borrow 100zcb =>100/170 collateral ratio
		address collateral_address = BondingCurve(bondingCurveAddress).getCollateral();  
		SafeERC20.safeTransferFrom(IERC20(collateral_address), trader, address(this), requested_zcb); 
		uint256 _collateralIn = requested_zcb; 

		CDP storage cdp = debt_pools[_marketId];
		cdp.collateral_amount[trader] += _collateralIn; 
		cdp.borrowed_amount[trader] += requested_zcb;  
		cdp.total_debt += requested_zcb; 
		cdp.total_collateral += _collateralIn; //only ds 
		collateral_pot[_marketId] += _collateralIn; //Total ds collateral 

		BondingCurve(bondingCurveAddress).mint(_marketId, requested_zcb, trader); 
	}

	/*
	Trader provides zcb and receives back collateral 
	 */
	function repay_for_collateral(
		uint256 _marketId, 
		uint256 repaying_zcb, 
		address trader
		) external override{
		
		address collateral_address = BondingCurve(bondingCurveAddress).getCollateral(); 
		BondingCurve(bondingCurveAddress).burn(_marketId, repaying_zcb, trader); 
		uint256 _collateralOut = repaying_zcb; 

		CDP storage cdp = debt_pools[_marketId];
		cdp.collateral_amount[trader] -= _collateralOut;
		cdp.borrowed_amount[trader] -= repaying_zcb;
		cdp.total_debt -= repaying_zcb;
		cdp.total_collateral -= _collateralOut;
		collateral_pot[_marketId] -= _collateralOut;

		SafeERC20.safeTransfer(IERC20(collateral_address), trader, _collateralOut);
	}



	/*Maturity Functions */

	function update_reputation_scores() external onlyController {
		
	}

	function get_redemption_price(uint256 marketId) public view returns(uint256){
		return redemption_prices[marketId]; 
	}

	/**
	@dev Redemption price, as calculated at maturity,
	depends on total_repayed/(principal + predetermined yield)
	If total_repayed = 0, redemption price is 0
	@param atLoss: defines circumstances where expected returns are higher than actual
	@param principal_loss: principal - returned amount => non-negative always?
	@param extra_gain: any extra yield not factored during assessment. Is 0 yield is as expected
	 */
	function update_redemption_price(
		uint256 marketId,
		bool atLoss, 
		uint256 extra_gain, 
		uint256 principal_loss
	) 
		external 
		override 
		onlyController
		{	

		BondingCurve bondingcuve = BondingCurve(bondingCurveAddress); 

		if (atLoss){
			//require(principal_loss >0 && extra_gain==0, "loss err");
			uint256 total_bought_collateral = bondingcuve.getTotalDS(marketId);
			uint256 total_bought_bonds = bondingcuve.getTotalZCB(marketId);
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
		BondingCurve bondingcurve = BondingCurve(bondingCurveAddress); 
		uint256 redemption_price = get_redemption_price(marketId); 
		require(redemption_price > 0, "Need to set redemption price"); // what if redemption price is set to zero?
		uint256 total_bought_bonds = bondingcurve.getTotalZCB(marketId);
		uint256 total_bought_collateral = bondingcurve.getTotalDS(marketId);

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
	 	uint256 zcb_redeem_amount
	) public returns(uint256){
		//require(AbstractMarketFactoryV3(marketFactory).isMarketResolved(marketId), "Market not resolved"); 

		uint256 redemption_price = get_redemption_price(marketId); 
		require(redemption_price > 0, "Redeem price is 0");

		uint256 collateral_redeem_amount = (redemption_price * zcb_redeem_amount)/PRICE_PRECISION; 

		BondingCurve(bondingCurveAddress).redeem(marketId,
		 receiver,
		 zcb_redeem_amount,
		 collateral_redeem_amount);

		return collateral_redeem_amount; 

	}




	function max(uint256 a, uint256 b) internal pure returns (uint256) {
	    return a >= b ? a : b;
	}


}

