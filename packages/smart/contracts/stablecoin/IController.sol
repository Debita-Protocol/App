pragma solidity ^0.8.4;


//controller contract responsible for providing initial liquidity to the
//borrower cds market, collect winnings when default, and burn the corresponding DS
interface IController  {
    struct MarketInfo {
        address borrower;
        address ammFactoryAddress; 
        address marketFactoryAddress;
        uint256 liquidityAmountUSD;
        uint256 marketID;
        string description;
        string[] names;
        uint256[] odds;
    }
    
    function verifyAddress(
        uint256 nullifier_hash, 
        uint256 external_nullifier,
        uint256[8] calldata proof
    ) external;

    function mintRepNFT(address NFT_address, address trader) external;

    function addValidator(address validator_address) external;

    function validators(address addr) external returns (bool);
    
    function verified(address addr) external returns (bool);


    function initiateMarket_(
        MarketInfo memory marketData, // marketID shouldn't be set. Everything else should be though
        address recipient,
        bytes32 loanID, 
        address bonding_curve_address, 
        address market_manager_address
    ) external;


    function resolveMarket_(
        address recipient,
        bytes32 loanID,
        bool atLoss,
        uint256 extra_gain, 
        uint256 principal_loss, 
        address market_manager_address
    ) external;

    function denyMarket(
        address recipient,
        bytes32 loanID,
        uint256 marketId, 
        address market_manager_address
    ) external;

    function approveLoan(address recipient, bytes32 id, address marketFactory) external;

    function canBeApproved(address borrower, 
        bytes32 loanID, 
        address marketFactoryAddress ) external returns(bool);

    

}