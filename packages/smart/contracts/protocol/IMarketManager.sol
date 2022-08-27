pragma solidity ^0.8.4;

interface IMarketManager {
	function buy(
        uint256 _marketId,
        uint256 _collateralIn
    ) external  returns (uint256);

	function sell(
        uint256 _marketId,
        uint256 _zcb_amount_in
    ) external  returns (uint256);

	function borrow_for_shortZCB(
		uint256 marketId, 
		uint256 requested_zcb 
	) external;

	function sellShort(
		uint256 marketId, 
		uint256 collateralIn
	) external;

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
	
	function redeem(
		uint256 marketId,
	 	address receiver 
	) external returns(uint256);

	function updateReputation(
		uint256 marketId
	) external;
}

