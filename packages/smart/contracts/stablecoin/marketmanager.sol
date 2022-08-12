pragma solidity ^0.8.4;

import "./owned.sol";
import "../turbo/AMMFactory.sol"; 
import "./reputationtoken.sol"; 
import {BondingCurve} from "../bonds/bondingcurve.sol";
import {Controller} from "./controller.sol";
import "./IMarketManager.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";



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
	mapping(uint256=> MarketPhaseData) restriction_data; // market ID => restriction data
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
		bool duringMarketAssessment;
		bool onlyReputable;
		bool marketDenied;
		uint256 min_rep_score;
		bool atLoss; 
		// buy threshold should be the max quantity of bond tokesn bought
	}

	uint256 private INSURANCE_CONSTANT = 5 * 10**5; // 0.5 for DS decimal format.
	uint256 private REPUTATION_CONSTANT = 3 * 10**5; 

	
    modifier onlyController(){
        require(address(controller) == msg.sender || msg.sender == owner, "is not controller"); 
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
	1.When Market is intialized, set both params as true
	2.When a certain time pass after initilization, change _onlyReputable to false 
	3.When validator approves, set _duringMarketAssessment to false
	*/
	function setAssessmentPhase(
		uint256 marketId, 
		bool _duringMarketAssessment,
		bool _onlyReputable
	) external  onlyController {
		MarketPhaseData storage data = restriction_data[marketId]; 
		data.onlyReputable = _onlyReputable; 
		data.duringMarketAssessment = _duringMarketAssessment; 
	}

	/* 
	Called when market should end, a) when denied b) when maturity 
	*/
	function deactivateMarket(uint256 marketId, bool atLoss) external  onlyController{
		restriction_data[marketId].marketDenied = true; 
		restriction_data[marketId].atLoss = atLoss; 

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
	) external  onlyController {
		min_rep_score = getMinRepScore(marketId);
		restriction_data[marketId] = MarketPhaseData(
			_duringMarketAssessment, 
			_onlyReputable,
			false,
			min_rep_score, 
			false
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
		return (restriction_data[marketId].min_rep_score <= rep.getReputationScore(trader).score || trader == owner); 
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
		) public view returns(bool){
		return restriction_data[marketId].onlyReputable; 

	}

	function isMarketApproved(uint256 marketId) public view returns(bool){
		return(!restriction_data[marketId].duringMarketAssessment && !restriction_data[marketId].marketDenied); 
		
	}

	//TODO Need to find out if the given market has enough (liquidity-required liq)
	function exposureSet(address trader, address ammFactoryAddress, address marketId) internal view returns(bool){
		return true; 
	}

	function marketActive(uint256 marketId) public view returns(bool){
		return !restriction_data[marketId].marketDenied; 
	}

	/// @notice returns true if amount bought is greater than the insurance threshold
	function marketCondition(uint256 marketId) public view returns(bool){
		uint256 principal = controller.vault().fetchInstrumentData(marketId).principal;
		uint256 total_bought = BondingCurve(address(controller.getZCB(marketId))).getTotalCollateral();
		return (total_bought >= (principal * INSURANCE_CONSTANT)/PRICE_PRECISION); 
	}

	/// @dev Called offchain before doTrade contract calls 
	function canBuy(
		address trader,
		uint256 amount, //this is in DS with decimals.
		uint256 marketId
	) public returns(bool) {
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
		
			BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
			uint256 tokens_bought = zcb.calculatePurchaseReturn(amount);
			uint256 price_after_trade = zcb.calculateExpectedPrice(tokens_bought);
			uint256 price_upper_bound = zcb.getUpperBound();

			require(price_upper_bound > 0, "Restrictions need to be set"); 
			require(price_upper_bound > price_after_trade, "Quantity exceeds buy threshold"); 
		}

		return true; 
		// require(_duringMarketAssessment, "Sells not allowed during assessments");
		// require(exposureset(trader, ammFactoryAddress, marketId), "Not enough liquidity");

	}

	// function updateReputation(uint256 marketId, uint256 outcome) publilc {
	// 	BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
		
	// 	address[] memory buyers = zcb.getBuyers();
	// 	uint256 length = buyers.length;
	// 	for (uint256 i = 0; i < length; i++) {
	// 		uint256 p = zcb.calculateProbability(zcb.balanceOf(buyers[i]));
	// 		rep.addScore(buyers[i], (p - uint256(outcome).fromUint()).sqrt());
	// 	}
	// }

	function canSell(
		address trader,
		uint256 amount, 
		uint256 marketId
	) internal view returns(bool) {
		require(marketActive(marketId), "Market Not Active"); 
		bool _duringMarketAssessment = duringMarketAssessment( marketId);
		if (_duringMarketAssessment){
			require(isVerified(trader), "User Not Verified");
		}
		return true; 
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
		require(restriction_data[marketId].marketDenied, "Market Still During Assessment");
		uint256 collateral_amount = assessment_collaterals[marketId][trader]; 
		BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId))); // SOMEHOW GET ZCB
		zcb.redeemPostAssessment(trader, collateral_amount); // SOMEHOW GET ZCB
	}

	/// @notice denies market from validator 
	function denyMarket(
		uint256 marketId
	) external  onlyController {
		MarketPhaseData storage data = restriction_data[marketId]; 
		data.marketDenied = true; 
		data.duringMarketAssessment = false; 
	}



	function buy(
        uint256 _marketId,
        uint256 _collateralIn
    ) external  returns (uint256){
		require(canBuy(msg.sender,
		 	_collateralIn, 
		 	_marketId),"Trade Restricted"
		);


		BondingCurve zcb = BondingCurve(address(controller.getZCB(_marketId))); // SOMEHOW GET ZCB
		uint256 amountOut = zcb.trustedBuy(msg.sender, _collateralIn);
 
 		//Need to log assessment trades for updating reputation scores or returning collateral
 		//when market denied 
		if (duringMarketAssessment(_marketId)){
			uint256 priceOut = zcb.calculateExpectedPrice(0); 
			log_assessment_trade(_marketId, msg.sender, amountOut, _collateralIn, priceOut);

			//  keeps track of amount bought during reputation phase
			// and make transitions from onlyReputation true->false
			uint256 principal = controller.vault().fetchInstrumentData(_marketId).principal;
			uint256 total_bought = zcb.getTotalCollateral();

			if (onlyReputable(_marketId)){

				if (total_bought > (REPUTATION_CONSTANT * principal)/PRICE_PRECISION){
					this.setAssessmentPhase(_marketId, true, false); 
				}

			}

		}

		return amountOut; 
	}


	function sell(
        uint256 _marketId,
        uint256 _zcb_amount_in
    ) external  returns (uint256){

		require(canSell(msg.sender, 
		 	_zcb_amount_in, 
		 	_marketId),"Trade Restricted");

		BondingCurve zcb = BondingCurve(address(controller.getZCB(_marketId))); // SOMEHOW GET ZCB
		uint256 amountOut = zcb.trustedSell(msg.sender, _zcb_amount_in);

	}

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

		// BondingCurve(bondingCurveAddress).mint(_marketId, requested_zcb, trader); 
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
		// address collateral_address = BondingCurve(bondingCurveAddress).getCollateral(); 
		// BondingCurve(bondingCurveAddress).burn(_marketId, repaying_zcb, trader); 
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

		if (atLoss){
			//require(principal_loss >0 && extra_gain==0, "loss err");
			// uint256 total_bought_collateral = bondingcuve.getTotalDS(marketId);
			// uint256 total_bought_bonds = bondingcuve.getTotalZCB(marketId);
			uint256 total_bought_collateral = zcb.getTotalCollateral();
			uint256 total_bought_bonds = zcb.getTotalZCB();

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
			// uint256 max_quantity = bondingcuve.getMaxQuantity(marketId); 
			uint256 max_quantity = zcb.getMaxQuantity();
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
		uint256 principal_loss
	) external  onlyController {
		// BondingCurve bondingcurve = BondingCurve(bondingCurveAddress);
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
				//bondingcurve.burn_first_loss( marketId, burnamount); 
				zcb.getCollateral();
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

		BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
		zcb.redeem(receiver, zcb_redeem_amount, collateral_redeem_amount);
		// BondingCurve(bondingCurveAddress).redeem(marketId,
		//  receiver,
		//  zcb_redeem_amount,
		//  collateral_redeem_amount);

		return collateral_redeem_amount; 

	}


	/// @notice when market is resolved(maturity/early default), calculates score
	/// and update each assessment phase trader's reputation, called by individual traders
	function updateReputation(uint256 marketId) external  {
		require(restriction_data[marketId].marketDenied, "Market not resolved"); 	
		require(assessment_trader[marketId][msg.sender], "Not manager"); 

		bool atLoss = restriction_data[marketId].atLoss; 
		uint256 priceOut = assessment_prices[marketId][msg.sender]; 
		uint256 collateralIn = assessment_collaterals[marketId][msg.sender]; 
		uint256 score = BondingCurve(address(controller.getZCB(marketId))).calculateScore(priceOut, atLoss);
		//TODO 
		rep.addScore(msg.sender, score); 
	}


	function max(uint256 a, uint256 b) internal pure returns (uint256) {
	    return a >= b ? a : b;
	}




}

