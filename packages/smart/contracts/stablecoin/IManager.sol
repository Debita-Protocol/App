pragma solidity ^0.7.6;
pragma abicoder v2;


//Manager contract responsible for providing initial liquidity to the
//borrower cds market, collect winnings when default, and burn the corresponding DS
interface IManager  {
    
    function addPool(address pool_address) external;

    function addValidator(address validator_address) external;

    function initiateMarket(address ammFactoryAddress,
             address marketFactoryAddress, uint256 marketID,
               uint256 liquidityAmountUSD ) external ;


    function resolveMarket(address ammFactoryAddress, 
    	address marketFactoryAddress, uint256 marketID, bool isDefault) external; 

}