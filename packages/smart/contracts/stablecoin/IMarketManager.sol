pragma solidity ^0.8.4;

import "./owned.sol";
import "../turbo/AMMFactory.sol"; 
import "./reputationtoken.sol"; 
import "../bonds/Ibondingcurve.sol"; 


interface IMarketManager {
	/**
	@dev initializes bonding curve for given market.
	 */
	function initiate_bonding_curve(uint256 marketId) 
		external;


	function setMarketRestrictionData(	
		bool _duringMarketAssessment,
		bool _onlyReputable,  
		uint256 marketId,
		uint256 min_rep_score)
		external; 

 	function deactivateMarket(uint256 marketId) external; 

	function setAssessmentPhase(
		uint256 marketId, 
		bool _duringMarketAssessment,
		bool _onlyReputable) 
		external;
	

	function canBuy(
		address trader,
		address ammFactoryAddress, 
		address marketFactoryAddress, 
		uint256 amount,//this is in DS with decimals 
		uint256 marketId) external view returns(bool);



	function buy(
		AMMFactory ammFactory, 
		AbstractMarketFactoryV3 marketFactory, 
        uint256 _marketId,
        uint256 _collateralIn
        ) external returns (uint256);

	function sell(
		AMMFactory ammFactory, 
		AbstractMarketFactoryV3 marketFactory, 
        uint256 _marketId,
        uint256 _zcb_amount_in
        ) external returns (uint256); 
	

	function update_redemption_price(
		uint256 marketId,
		bool atLoss, 
		uint256 extra_gain, 
		uint256 principal_loss) 
		external;

	function handle_maturity(
		uint256 marketId, 
		bool atLoss, 
		uint256 principal_loss) 
		external; 

	function denyMarket(
		uint256 marketId)
		external; 

	function borrow_with_collateral(
		uint256 _marketId, 
		uint256 requested_zcb, 
		address trader
		) external; 

	function repay_for_collateral(
		uint256 _marketId, 
		uint256 repaying_zcb, 
		address trader
		) external;
}

