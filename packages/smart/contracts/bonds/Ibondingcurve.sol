pragma solidity ^0.8.4; 


interface IBondingCurve{

	function buy(address marketFactoryAddress, address to, uint256 amountIn, uint256 marketId) external returns(uint256);
 	function sell(address marketFactoryAddress, 
		address from, 
		uint256 zcb_amountIn, 
		uint256 marketId) external returns(uint256);
    function calcAmountOut_(uint256 c, uint256 T) external view returns(uint256); 
    function _calcAmountOut(uint256 a) external view returns(uint256); 
    function getExpectedPriceAfterTrade(
		uint256 marketId, 
		uint256 amountIn) external view returns(uint256); 
    function redeem(uint256 marketId, 
		address receiver, 
		uint256 zcb_redeem_amount, 
		uint256 collateral_redeem_amount) external; 
    function getCollateral() external view returns(address); 
    function curve_init(uint256 marketId) external; 
    function addManager(address _manager_address) external ; 
	function getBondFunds(uint256 marketId) external view returns(uint256);
	function getTotalPurchased(uint256 marketId) external view returns(uint256);

	function getMaxQuantity(uint256 marketId) external view returns(uint256);

	function burn_first_loss(uint256 marketId, uint256 burn_collateral_amount) external; 
	
	function  redeem_post_assessment(
		uint256 marketId, 
		address redeemer,
		uint256 collateral_amount) external; 


	function mint(
		uint256 marketId, 
		uint256 mintAmount,
		address to
		) external; 

	function burn(
		uint256 marketId, 
		uint256 burnAmount, 
		address to) external; 


}