pragma solidity ^0.8.4;

import "./owned.sol";
import "../turbo/AMMFactory.sol"; 
import "./reputationtoken.sol"; 
import {BondingCurve} from "../bonds/bondingcurve.sol";
import {Controller} from "./controller.sol";
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import "./IMarketManager.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../prb/PRBMathUD60x18.sol";
import {LinearShortZCB} from "../bonds/LinearShortZCB.sol"; 


contract MarketManager is Owned {
	/*Wrapper contract for bondingcurve markets, trades are restricted/funneled through here
		Types of restrictions are 
		1) Being verified 
		2) reputation to buy early 

		4) Restriction to quantity 

	Misc. 
		a) To avoid securitization, enforce selling Fee  
	*/
	using PRBMathUD60x18 for uint256;

    uint256 private constant PRICE_PRECISION = 1e6; 

	ReputationNFT rep;
  Controller controller;

  	mapping(uint256=>uint256) private redemption_prices; //redemption price for each market, set when market resolves 
  	mapping(uint256=>mapping(address=>uint256)) private assessment_collaterals;  //marketId-> trader->collateralIn
  	mapping(uint256=>mapping(address=>uint256)) private assessment_prices; 
  	mapping(uint256=>mapping(address=>bool)) private assessment_trader; 
	mapping(uint256=> MarketPhaseData) public restriction_data; // market ID => restriction data
	mapping(uint256=> uint256) collateral_pot; // marketID => total collateral recieved (? isn't this redundant bc bonding curves fundsperBonds)
	mapping(uint256=> CDP) private debt_pools; // marketID => debt info

	struct CDP{
		mapping(address=>address) collateral_address; 
		mapping(address=>uint256) collateral_amount;
		mapping(address=>uint256) borrowed_amount; 
		uint256 total_debt; 
		uint256 total_collateral; //only usdc 
	}

	struct MarketPhaseData {
		bool duringAssessment;
		bool onlyReputable;
		bool resolved;
		uint256 min_rep_score;
		bool alive;
		bool atLoss;
		uint256 base_budget;
	}

	uint256 private INSURANCE_CONSTANT = 5 * 10**5; // 0.5 for DS decimal format.
	uint256 private REPUTATION_CONSTANT = 3 * 10**5;
	
    modifier onlyController(){
        require(address(controller) == msg.sender || msg.sender == owner || msg.sender == address(this), "is not controller"); 
        _;
    }

	constructor(
		address _creator_address,
		address reputationNFTaddress,  
		address _controllerAddress
	) Owned(_creator_address){
		rep = ReputationNFT(reputationNFTaddress);
		controller = Controller(_controllerAddress); 
	}

	/*----Phase Functions----*/

	/*
	called on market initialization by controller
	*/
	function setMarketPhase(
		uint256 marketId, 
		bool duringAssessment,
		bool _onlyReputable,
		uint256 min_rep_score,
		uint256 base_budget
	) external  onlyController {
		MarketPhaseData storage data = restriction_data[marketId]; 
		data.onlyReputable = _onlyReputable; 
		data.duringAssessment = duringAssessment;
		data.min_rep_score = min_rep_score;
		data.base_budget = base_budget;
		data.alive = true;
	}

	/**
	 called by this when onlyRep => false.
	 */
	function setReputationPhase(
		uint256 marketId,
		bool _onlyReputable
	) internal {
		require(restriction_data[marketId].alive, "market must be alive");
		restriction_data[marketId].onlyReputable = _onlyReputable;
	}

	/**
	 called by controller
	 */
	function approveMarket(uint256 marketId) external onlyController {
		require(restriction_data[marketId].alive);
		require(restriction_data[marketId].duringAssessment);

		restriction_data[marketId].duringAssessment = false;		
	}

	/* 
	Called when market should end, a) when denied b) when maturity 
	*/
	function deactivateMarket(uint256 marketId, bool atLoss) external  onlyController{
		restriction_data[marketId].resolved = true; 
		restriction_data[marketId].atLoss = atLoss; 
		restriction_data[marketId].alive = false; 

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
	function isVerified(address trader) public view returns(bool){
		return (controller.isVerified(trader) || trader == owner);
		//return (rep.balanceOf(trader) >= 1 || trader == owner); 
	}


	function isReputable(address trader, uint256 marketId) public view returns(bool){
		return (restriction_data[marketId].min_rep_score <= rep.getReputationScore(trader) || trader == owner); 
	}

	/*
	Returns true if during risk assessment phase
	*/
	function duringMarketAssessment(
		uint256 marketId) public view returns(bool){
		return restriction_data[marketId].duringAssessment; 
	}

	/*
	Returns true when market only allows reputable traders
	*/
	function onlyReputable(
		uint256 marketId
		) public view returns(bool){
		return restriction_data[marketId].onlyReputable; 

	}

	function isMarketApproved(uint256 marketId) public view returns(bool){
		return(!restriction_data[marketId].duringAssessment && restriction_data[marketId].alive); 
		
	}

	//TODO Need to find out if the given market has enough (liquidity-required liq)
	function exposureSet(address trader, address ammFactoryAddress, address marketId) internal view returns(bool){
		return true; 
	}

	function marketActive(uint256 marketId) public view returns(bool){
		return restriction_data[marketId].alive; 
	}

	/// @notice returns true if amount bought is greater than the insurance threshold
	function marketCondition(uint256 marketId) public view returns(bool){
		uint256 principal = controller.vault().fetchInstrumentData(marketId).principal;
		uint256 total_bought = BondingCurve(address(controller.getZCB(marketId))).getTotalCollateral();
		return (total_bought >= (principal * INSURANCE_CONSTANT)/PRICE_PRECISION); 
	}


	function getDebtPosition(address trader, uint256 marketId) public view returns(uint256, uint256){
		CDP storage cdp = debt_pools[marketId];
		return (cdp.collateral_amount[trader], cdp.borrowed_amount[trader]);
	}

	/// @notice get trade budget = f(reputation)
	/// sqrt for now 
	function getTraderBudget(uint256 marketId, address trader) public view returns(uint256){
		uint256 repscore = rep.getReputationScore(trader);	
		return restriction_data[marketId].base_budget; // sqrt(repscore * 10**6), since w/ decimals.
	}
 	
 	/// @notice computes the price for ZCB one needs to short at to completely
 	/// hedge for the case of maximal loss, function of principal and interest
	function getHedgePrice(uint256 marketId) public view returns(uint256){
		uint256 principal = controller.vault().fetchInstrumentData(marketId).principal; 
		uint256 yield = controller.vault().fetchInstrumentData(marketId).expectedYield; 

		uint256 den = (principal * (PRICE_PRECISION - INSURANCE_CONSTANT))/PRICE_PRECISION; 
		return PRICE_PRECISION -  (yield*PRICE_PRECISION)/den;

	}

	/// @notice computes maximum amount of quantity that trader can short while being hedged
	/// such that when he loses his loss will be offset by his gains  
	function getHedgeQuantity(address trader, uint256 marketId) public view returns(uint256){
		uint256 principal = controller.vault().fetchInstrumentData(marketId).principal; 
		uint256 holdings =  controller.vault().balanceOf(trader);
		uint256 marketCap = controller.vault().totalSupply(); 
		uint num = (principal * (PRICE_PRECISION - INSURANCE_CONSTANT)/PRICE_PRECISION) * holdings; 
		return num/marketCap; 
	}	

	
	function canBuy(
		address trader,
		uint256 amount, //this is in DS with decimals.
		uint256 marketId
	) public returns(bool, uint) {
		require(marketActive(marketId), "Market Not Active"); // this is not correct since marketDenied set to false by default.
		bool _duringMarketAssessment = duringMarketAssessment(marketId);
		bool _onlyReputable =  onlyReputable(marketId);

		if (_duringMarketAssessment){
			if (!isVerified(trader) || !(getTraderBudget(marketId, trader)>= amount)) return (false, 0); 
	
		}

  		//During the early risk assessment phase only reputable can buy 
		if (_onlyReputable){
			require(_duringMarketAssessment, "Market needs to be in assessment phase"); 
			if (!isReputable(trader, marketId)){ 
				console.log('notreputable'); 
				return (false, 1); 
			}
		}

		//If after assessment there is a set buy threshold, people can't buy above this threshold
		if (!_duringMarketAssessment){
		
			BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
			uint256 tokens_bought = zcb.calculatePurchaseReturn(amount);
			uint256 price_after_trade = zcb.calculateExpectedPrice(tokens_bought);
			uint256 price_upper_bound = zcb.getUpperBound();
			require(price_upper_bound > 0, "Restrictions need to be set"); 
			if (price_upper_bound > price_after_trade) return (false, 2); 
		}

		return (true, 0); 
		// require(_duringMarketAssessment, "Sells not allowed during assessments");
		// require(exposureset(trader, ammFactoryAddress, marketId), "Not enough liquidity");

	}


	/// @notice amount is greater than 
	function canSell(
		address trader,
		uint256 amount, 
		uint256 marketId
	) internal view returns(bool) {
		require(marketActive(marketId), "Market Not Active"); 

		// bool _duringMarketAssessment = duringMarketAssessment( marketId);
		// if (_duringMarketAssessment){
		// 	require(isVerified(trader), "User Not Verified");
		// }
		return true; 
	}

	/**
	 called by controller on approveMarket, preset upper bound for assessment phase is 1.
	 */
	function setUpperBound(uint256 marketId, uint256 upper_bound) external onlyController {
		BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
		zcb.setUpperBound(upper_bound);
	}
	

	/// @notice During assessment phase, need to log the trader's 
	/// total collateral when he bought zcb. Trader can only redeem collateral in 
	/// when market is not approved 
	/// @param priceOut is the price of the zcb after the trader made his trade
	function log_assessment_trade(
		uint256 marketId, 
		address trader, 
		uint256 amountOut, 
		uint256 collateralIn,
		uint256 priceOut)
		internal 
	{	
		assessment_trader[marketId][trader] = true; 
		assessment_collaterals[marketId][trader] = collateralIn;
		assessment_prices[marketId][trader] = priceOut; 

	}

	/* 
	After market is denied, redeem every zcb trader has for his collateral 
	*/
	function redeemPostAssessment(
		uint256 marketId, 
		address trader 
	) public {
		require(restriction_data[marketId].resolved, "Market Still During Assessment");
		uint256 collateral_amount = assessment_collaterals[marketId][trader]; 
		BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
		zcb.redeemPostAssessment(trader, collateral_amount); 
	}

	/// @notice denies market from validator 
	function denyMarket(
		uint256 marketId
	) external  onlyController {
		require(marketActive(marketId), "Market Not Active"); 
		require(restriction_data[marketId].duringAssessment, "Not in assessment"); 
		MarketPhaseData storage data = restriction_data[marketId]; 
		data.resolved = true; 
		data.duringAssessment = false;
	}



	function buy(
        uint256 _marketId,
        uint256 _collateralIn
    ) external  returns (uint256){
		require(!restriction_data[_marketId].resolved, "must not be resolved");
		(bool canbuy, uint256 error) = canBuy(msg.sender, _collateralIn, _marketId); 
		require(canbuy,"Trade Restricted");


		BondingCurve zcb = BondingCurve(address(controller.getZCB(_marketId))); // SOMEHOW GET ZCB
		uint256 amountOut = zcb.trustedBuy(msg.sender, _collateralIn);
 
 		//Need to log assessment trades for updating reputation scores or returning collateral
 		//when market denied 
		if (duringMarketAssessment(_marketId)){
			uint256 priceOut = zcb.calculateExpectedPrice(0); // 60.18 for some reason
			log_assessment_trade(_marketId, msg.sender, amountOut, _collateralIn, priceOut);

			//  keeps track of amount bought during reputation phase
			// and make transitions from onlyReputation true->false
			uint256 principal = controller.vault().fetchInstrumentData(_marketId).principal;
			uint256 total_bought = zcb.getTotalCollateral();
			console.log("total_bought", total_bought);

			if (onlyReputable(_marketId)){

				if (total_bought > (REPUTATION_CONSTANT * principal)/PRICE_PRECISION){
					setReputationPhase(_marketId, false); 
				}

			}

		}

		return amountOut; 
	}


	function sell(
        uint256 _marketId,
        uint256 _zcb_amount_in
    ) external  returns (uint256){
		require(!restriction_data[_marketId].resolved, "must not be resolved");
		require(canSell(msg.sender, 
		 	_zcb_amount_in, 
		 	_marketId),"Trade Restricted");

		BondingCurve zcb = BondingCurve(address(controller.getZCB(_marketId))); // SOMEHOW GET ZCB
		uint256 amountOut = zcb.trustedSell(msg.sender, _zcb_amount_in);

		return amountOut;
	}





	///// Shorting logic  /////
	mapping(uint256=>mapping(address=>bool)) isShortZCB; //marketId-> address-> isshortZCB
	mapping(uint256=>address) shortZCBs; 
	mapping(uint256=>mapping(address=>uint256) )assessment_shorts; 
	function add_short_zcb(
		uint256 marketId,
		address shortZCB_address
		) external onlyController{
		isShortZCB[marketId][shortZCB_address] = true;
		shortZCBs[marketId] = shortZCB_address;


	}

	/// @notice borrow for shorting from shortZCB, no collateral is posted here 
	/// instead the collateral is stored in the shortZCB contract 
	function borrow_for_shortZCB(
		uint256 marketId, 
		uint256 requested_zcb 
		) external {
		require(isShortZCB[marketId][msg.sender], "No");
		BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId))); // SOMEHOW GET ZCB

		CDP storage cdp = debt_pools[marketId];
		cdp.collateral_amount[msg.sender] += requested_zcb; //the collateral should be stored in the shortZCB
		cdp.borrowed_amount[msg.sender] += requested_zcb;  
		cdp.total_debt += requested_zcb; 
		cdp.total_collateral += requested_zcb; //only ds 
		collateral_pot[marketId] += requested_zcb; //Total ds collateral 

		zcb.trustedMint(msg.sender, requested_zcb); 

	}

	function sellShort(
		uint256 marketId, 
		uint256 collateralIn

		) external {
		//TODO do can sell 
		LinearShortZCB(shortZCBs[marketId]).trustedShort(msg.sender, collateralIn); 
		if (duringMarketAssessment(marketId)){
			log_assessment_shorts(marketId, msg.sender, collateralIn); 
		}
	}

	function log_assessment_shorts(uint256 marketId, address trader, uint256 collateralIn) internal {
		assessment_shorts[marketId][trader] += collateralIn; 
	}

	/// @notice called when market is denied 
	function shortRedeemDeniedMarket(uint256 marketId, address trader) public {
		// require(restriction_data[marketId].marketDenied, "Market Still During Assessment");
		LinearShortZCB shortZCB = LinearShortZCB(shortZCBs[marketId]);

		uint256 trader_shorts_balance = shortZCB.balanceOf(trader); 
		shortZCB.trustedBurn( trader,  trader_shorts_balance);
		 
		uint256 collateral_amount = assessment_shorts[marketId][trader]; 
		ERC20 collateral = ERC20(shortZCB.getCollateral()); 
		collateral.transferFrom(shortZCBs[marketId], trader,collateral_amount ); 

	}

	// function redeemShort() external{

	// }





	/* 
	For now only allow collateral to be ds
	*/
	function borrow_with_collateral(
		uint256 _marketId, 
		uint256 requested_zcb, 
		address trader
		) external {
		//1.Use 100 ds as collateral to borrow 100zcb 1:1, only this for now 
		//2.use 0.1eth(170) as collateral to borrow 100zcb =>100/170 collateral ratio
		BondingCurve zcb = BondingCurve(address(controller.getZCB(_marketId))); // SOMEHOW GET ZCB
		address collateral_address = zcb.getCollateral();
		SafeERC20.safeTransferFrom(IERC20(collateral_address), trader, address(zcb), requested_zcb);

		// SafeERC20.safeTransferFrom(IERC20(collateral_address), trader, address(this), requested_zcb); 
		uint256 _collateralIn = requested_zcb; 

		CDP storage cdp = debt_pools[_marketId];
		cdp.collateral_amount[trader] += _collateralIn; 
		cdp.borrowed_amount[trader] += requested_zcb;  
		cdp.total_debt += requested_zcb; 
		cdp.total_collateral += _collateralIn; //only ds 
		collateral_pot[_marketId] += _collateralIn; //Total ds collateral 

		zcb.trustedMint(trader, requested_zcb);
	}

	/*
	Trader provides zcb and receives back collateral 
	 */
	function repay_for_collateral(
		uint256 _marketId, 
		uint256 repaying_zcb, 
		address trader
	) external {
		BondingCurve zcb = BondingCurve(address(controller.getZCB(_marketId)));
		address collateral_address = zcb.getCollateral();
		zcb.trustedBurn(trader, repaying_zcb);


		uint256 _collateralOut = repaying_zcb; 

		CDP storage cdp = debt_pools[_marketId];
		cdp.collateral_amount[trader] -= _collateralOut;
		cdp.borrowed_amount[trader] -= repaying_zcb;
		cdp.total_debt -= repaying_zcb;
		cdp.total_collateral -= _collateralOut;
		collateral_pot[_marketId] -= _collateralOut;

		// SafeERC20.safeTransfer(IERC20(collateral_address), trader, _collateralOut);
		// zcb needs to approve transfer from itself to trader.
		zcb.trustedApproveCollateralTransfer(trader, _collateralOut);
		SafeERC20.safeTransferFrom(IERC20(collateral_address), address(zcb), trader, _collateralOut);
	}



	/*Maturity Functions */


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
	) external  onlyController {	

		BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId))); // SOMEHOW GET ZCB
		uint256 total_bought_collateral = zcb.getTotalCollateral();
		uint256 total_bought_bonds = zcb.getTotalZCB();
		console.log("total_bought_bonds", total_bought_bonds);
		console.log("principal_loss", principal_loss);

		if (atLoss){
			if (total_bought_collateral - principal_loss > 0){
				redemption_prices[marketId] = PRICE_PRECISION - (principal_loss*PRICE_PRECISION/total_bought_bonds);
			}
			else{
				redemption_prices[marketId] = 0; 
			}
		}
		else{
			require(extra_gain >= 0 && principal_loss ==0,  "loss err"); 
			uint256 num_shorts = debt_pools[marketId].total_debt; //For now assume that every zcb borrowed is used to short
			redemption_prices[marketId] = PRICE_PRECISION + (extra_gain*PRICE_PRECISION/(total_bought_bonds+num_shorts)); 
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
		uint256 principal_loss
	) external  onlyController {

		BondingCurve zcb =  BondingCurve(address(controller.getZCB(marketId)));

		uint256 redemption_price = get_redemption_price(marketId); 
		require(redemption_price > 0, "Need to set redemption price"); // what if redemption price is set to zero?
		uint256 total_bought_bonds = zcb.getTotalZCB();
		uint256 total_bought_collateral = zcb.getTotalCollateral();

		if (atLoss){

			uint256 burnamount = total_bought_collateral - ((redemption_price * total_bought_bonds)/PRICE_PRECISION);
			console.log('burnamounts', burnamount);

			if(principal_loss >0){
				require(burnamount>0,"burn amount err"); 
				zcb.burnFirstLoss(burnamount);

			}
		
		}

	}

	/* 
	@notice trader will redeem entire balance of ZCB
	Needs to be called at maturity, market needs to be resolved first(from controller)
	*/
	function redeem(
		uint256 marketId,
	 	address receiver 
	) public returns(uint256){
		require(!marketActive(marketId), "Market Active"); 
		BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
		uint256 zcb_redeem_amount = zcb.balanceOf(msg.sender); 
		zcb.trustedBurn(msg.sender, zcb_redeem_amount); 

		uint256 redemption_price = get_redemption_price(marketId); 
		require(redemption_price > 0, "Redeem price is 0");
		uint256 zcb_redeem_amount_prec = zcb_redeem_amount/(10**12); 
		uint256 collateral_redeem_amount = (redemption_price * zcb_redeem_amount_prec)/PRICE_PRECISION; 

		controller.redeem_mint(collateral_redeem_amount, msg.sender); 

		return collateral_redeem_amount; 

	}


	/// @notice when market is resolved(maturity/early default), calculates score
	/// and update each assessment phase trader's reputation, called by individual traders
	function updateReputation(uint256 marketId) external  {
		require(restriction_data[marketId].resolved, "Market not resolved"); 	
		require(assessment_trader[marketId][msg.sender], "Not manager"); 

		bool atLoss = restriction_data[marketId].atLoss; 
		uint256 priceOut = assessment_prices[marketId][msg.sender]/(10**12); 
		uint256 collateralIn = assessment_collaterals[marketId][msg.sender]; 
		uint256 traderBudget = getTraderBudget(marketId, msg.sender);
		uint256 num_bonds_bought = (collateralIn * priceOut)/PRICE_PRECISION;
		console.log("collateralIn: ", collateralIn);
		console.log("traderBudget: ", traderBudget);
		console.log("num_bonds bought: ", num_bonds_bought); 
		console.log("Price Out: ", priceOut);

		uint256 scoreToAdd; 
		// if (!atLoss) scoreToAdd = (((num_bonds_bought*PRICE_PRECISION/traderBudget) * (PRICE_PRECISION - priceOut))/PRICE_PRECISION)*(num_bonds_bought)/PRICE_PRECISION;
		// console.log('num_bonds_bought'); 
		if(!atLoss) scoreToAdd = num_bonds_bought; 
		else scoreToAdd = (num_bonds_bought/traderBudget) * priceOut * num_bonds_bought; 

		rep.addScore(msg.sender, scoreToAdd, !atLoss); 
	}


	function max(uint256 a, uint256 b) internal pure returns (uint256) {
	    return a >= b ? a : b;
	}

	function sqrt(uint y) internal pure returns (uint z) {
	    if (y > 3) {
	        z = y;
	        uint x = y / 2 + 1;
	        while (x < z) {
	            z = x;
	            x = (y / x + x) / 2;
	        }
	    } else if (y != 0) {
	        z = 1;
	    }
	}





}

