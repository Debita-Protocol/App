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

    function initiateMarket(
        address borrower,
        address ammFactoryAddress, 
        address marketFactoryAddress, 
        uint256 liquidityAmountUSD, 
        string calldata description,  //Needs to be in format name + ":" + borrower description since it is called offchain
        string calldata loanID, 
        string[] memory names, 
        uint256[] memory odds
    ) external;

    function resolveMarket(address recipient, bytes32 loanID, bool isDefault) external;
    function verified(address _addr) external returns (bool);
    function validators(address _addr) external returns (bool);
    function canBeApproved (
        address borrower, 
        string calldata loanID, 
        address marketFactoryAddress 
    ) external returns(bool);
    
    function _initiateMarket(
        MarketInfo memory data,
        address borrower,
        string calldata loanID
    ) external;
    
    function verifyAddress(
        uint256 nullifier_hash, 
        uint256 external_nullifier,
        uint256[8] calldata proof
    ) external;

    
}