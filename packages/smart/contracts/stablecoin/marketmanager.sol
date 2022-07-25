// pragma solidity ^0.8.4;

// import "./owned.sol";
// import "../turbo/AMMFactory.sol"; 
// import "./reputationtoken.sol"; 

// contract MarketManager is Owned {

// 	/*Types of restrictions are 
// 		1) Being verified 
// 		2) For verified address, if market during assessment cant sell  
// 		3) Exposure control for controller, liquidity needs to be in range 
		
// 		4) Restriction to quantity 
// 		5) Only higher reputation can buy early 

// 	Misc. 
// 		a) To avoid securitization, enforce selling Fee  
// 	*/
// 	ReputationNFT rep;

// 	constructor(address _creator_address,
// 				address reputationNFTaddress) Owned(_creator_address){
// 		rep = ReputationNFT(reputationNFTaddress);
// 	}

// 	//Conditions 
// 	function isVerified(address trader) internal view returns(bool){
// 		return (rep.balanceOf(trader) >= 1); 
// 	}

// 	function duringMarketAssessment(
// 		address trader, 
// 		address marketFactoryAddress, 
// 		uint256 marketId) internal view returns(bool){
// 		return AbstractMarketFactoryV3(marketFactoryAddress).isInAssessment(marketId);
// 	}

// 	//Need to find ot if the given market has enough (liquidity-required liq)
// 	function exposureSet(address trader, address ammFactoryAddress, address marketId) internal view returns(bool){
// 		return true; 
// 	}

// 	// function QuantityCondition(address marketFactoryAddress, uint256 marketId){
// 	// 	AbstractMarketFactoryV3(marketFactoryAddress).canQuantity(marketId)

// 	// }


// 	//Called offchain before doTrade contract calls 
// 	function canBuy(
// 		address trader,
// 		address ammFactoryAddress, 
// 		address marketFactoryAddress, 
// 		uint256 amount,//this is in DS with decimals 
// 		uint256 marketId) internal returns(bool) {

// 		require(isVerified(trader) "User Not Verified");
// 		require(duringMarketAssessment(trader, marketFactoryAddress, marketId), "Sells not allowed during assessments");
// 		require(exposureset(trader, ammFactoryAddress, marketId), "Not enough liquidity");

// 	}




// 	function buy(
// 		AMMFactory ammFactory, 
// 		AbstractMarketFactoryV3 marketFactory, 
//         uint256 _marketId,
//         uint256 _outcome,
//         uint256 _collateralIn,
//         uint256 _minTokensOut		
//         ) external returns (uint256){
// 		require(canBuy(msg.sender, address(marketFactory), _collateralIn, _marketId),"Trader Restricted");

// 		marketFactory.collateral().transferFrom(msg.sender, address(this), _collateralIn);
// 		marketFactory.collateral().approve(address(ammFactory), _collateralIn); 
// 		uint256 totalDesiredOutcome = ammFactory.buy(marketFactory, _marketId, _outcome, _collateralIn, _minTokensOut);

		

// 		return 1; 
// 		// ammFactory.buy(marketFac)
// 	}




// }

