pragma solidity ^0.8.4;

import "./owned.sol";
import "../turbo/AMMFactory.sol"; 
import "./reputationtoken.sol"; 

contract MarketManager is Owned {

	/*Types of restrictions are 
		1) Being verified 
		2) For verified address, if market during assessment cant sell  
		3) Exposure control for controller, liquidity needs to be in range 
		
		4) Restriction to quantity 
		5) Only higher reputation can buy early 

	Misc. 
		a) To avoid securitization, enforce selling Fee  
	*/
	ReputationNFT rep;

	constructor(address _creator_address,
				address reputationNFTaddress) Owned(_creator_address){
		rep = ReputationNFT(reputationNFTaddress);
	}

	//Conditions 
	function isVerified(address trader) internal view returns(bool){
		return (rep.balanceOf(trader) >= 1); 
	}

	function duringMarketAssessment(
		address trader, 
		address marketFactoryAddress, 
		uint256 marketId) internal view returns(bool){
		AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress); 
		return marketFactory.isInAssessment(marketId);
	}

	//function exposureSet()
	//Called offchain before doTrade contract calls f
	function canBuy(
		address trader,
		address marketFactoryAddress, 
		uint256 marketId) internal returns(bool) {

		require(isVerified(trader) && duringMarketAssessment(trader, marketFactoryAddress, marketId ) );
	}




	function buy(
		AMMFactory ammFactory, 
		AbstractMarketFactoryV3 marketFactory, 
        uint256 _marketId,
        uint256 _outcome,
        uint256 _collateralIn,
        uint256 _minTokensOut		
        ) external returns (uint256){

		return 1; 
		// ammFactory.buy(marketFac)
	}




}

