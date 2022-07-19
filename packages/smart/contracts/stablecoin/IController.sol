pragma solidity ^0.8.4;


//controller contract responsible for providing initial liquidity to the
//borrower cds market, collect winnings when default, and burn the corresponding DS
interface IController  {
    struct MarketInfo {
        address ammFactoryAddress; 
        address marketFactoryAddress;
        uint256 liquidityAmountUSD;
        uint256 marketID;
        string description;
        string[] names;
        uint256[] odds;
    }
    
    function addPool(address pool_address) external;

    function addValidator(address validator_address) external;

    function initiateMarket(MarketInfo memory marketData, address recipient, string calldata id) external;

    function resolveMarket(address recipient, bytes32 loanID, bool isDefault) external;
    function verified(address _addr) external returns (bool);

}