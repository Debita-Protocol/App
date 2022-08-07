pragma solidity ^0.8.4; 


interface IBondingCurve{
	function setMarketManager(address _market_manager) external;
	function getTotalZCB(uint256 marketId) external returns (uint256 result);
	function getTotalDS(uint256 marketId) external returns (uint256 result);
	function getMaxQuantity(uint256 marketId) external view returns (uint256 result);
	function curveInit(uint256 marketId) external;
	function getExpectedPrice(uint256 marketId, uint256 amountIn) external view returns (uint256 result);
	function getCollateral() external returns (address);
	function buy(
		address marketFactoryAddress, 
		address trader,
		uint256 amountIn, 
		uint256 marketId
	) external returns(uint256);
	function sell(
		address marketFactoryAddress, 
		address trader,
		uint256 amountIn, 
		uint256 marketId
	) external returns (uint256);
	function redeem(
		uint256 marketId, 
		address receiver, 
		uint256 zcb_redeem_amount, 
		uint256 collateral_redeem_amount
	) external;
	function redeemPostAssessment(
		uint256 marketId, 
		address redeemer,
		uint256 collateral_amount
	) external;
	function burnFirstLoss(
		uint256 marketId, 
		uint256 burn_collateral_amount
	) external;
	function mint(
		uint256 marketId, 
		uint256 mintAmount,
		address to
	) external;
	function burn(
		uint256 marketId, 
		uint256 burnAmount, 
		address to
	) external;
}