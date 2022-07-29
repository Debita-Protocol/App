pragma solidity ^0.8.4; 


interface IBondingCurve{

	function buy(
		address marketFactoryAddress, 
		address to,
		uint256 amountIn, 
		uint256 marketId) external returns(uint256);
 	function sell(
		address marketFactoryAddress, 
		address from, 
		uint256 zcb_amountIn, 
		uint256 marketId) external returns(uint256);
    function calcAmountOut_(uint256 c, uint256 T) external view returns(uint256); 
    function _calcAmountOut(uint256 a) external view returns(uint256); 


}