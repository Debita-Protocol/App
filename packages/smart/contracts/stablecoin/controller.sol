pragma solidity ^0.8.4;
import "../rewards/MasterChef.sol";
import "./ILendingPool.sol";
import "./IController.sol";
import "../turbo/TrustedMarketFactoryV3.sol";
import "./IMarketManager.sol";
import "./IReputationNFT.sol";

import "hardhat/console.sol";
import "@interep/contracts/IInterep.sol";
// Controller contract responsible for providing initial liquidity to the
// borrower cds market, collect winnings when default, and burn the corresponding DS
contract Controller is IController {
    using SafeMath for uint256;

    struct LiquidityInfo {
    	uint256 lptokenamount;
    	uint256 suppliedDS; 
    }

    mapping(address => bool) public override validators; 
    mapping(address => bool) pools;
    mapping(address => bool) public override verified;
    mapping(address => mapping(bytes32 => MarketInfo)) public borrower_market_data; // maps address + loan id => market information, called by lendingpool
    mapping(address => mapping(uint256 => bytes32)) public marketID_to_loan_data; // maps address + market id => loan id.
    mapping(address => mapping(uint256=> LiquidityInfo)) lpinfo;

    address[] validators_array;

    address creator_address;
    address timelock_address;
    address MasterChef_address;

    MasterChef masterchef; 
    ILendingPool lendingpool;
    IInterep interep;

    uint256 constant TWITTER_UNRATED_GROUP_ID = 16106950158033643226105886729341667676405340206102109927577753383156646348711;
    bytes32 constant private signal = bytes32("twitter-unrated");
    uint256 insurance_constant = 5e5; //1 is 1e6, also needs to be able to be changed 

    /* ========== MODIFIERS ========== */
    modifier onlyValidator() {
        require(validators[msg.sender] == true || msg.sender == creator_address, "Only Validators can call this function");
        _;
    }

    modifier onlyPools() {
        require(msg.sender == address(lendingpool)|| msg.sender == creator_address, "Only Pools can call this function");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == creator_address, "Only Owner can call this function");
        _;
    }

    constructor (
        address _creator_address,
        address _timelock_address,
        address _MasterChef_address, 
        address _LendingPool_address, 
        address _DS_address,
        address _interep_address
    )   
    {   // _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        // DEFAULT_ADMIN_ADDRESS = _msgSender();
        // _grantRole(DEFAULT_ADMIN_ROLE, _creator_address);
        creator_address = _creator_address;
        MasterChef_address=_MasterChef_address;

        masterchef = MasterChef(_MasterChef_address);
        lendingpool = ILendingPool(_LendingPool_address); 
        interep = IInterep(_interep_address);
    }

    function verifyAddress(
        uint256 nullifier_hash, 
        uint256 external_nullifier,
        uint256[8] calldata proof
    ) external override {
        require(!verified[msg.sender], "address already verified");
        //interep.verifyProof(TWITTER_UNRATED_GROUP_ID, signal, nullifier_hash, external_nullifier, proof);
        verified[msg.sender] = true;

    }

    function mintRepNFT(
        address NFT_address,
        address trader
        ) external {
        IReputationNFT(NFT_address).mint(msg.sender);
    }

    //Pool added when contract is deployed 
    // function addPool(address pool_address) external override onlyOwner {
    //     require(pool_address != address(0), "Zero address detected");
    //     require(pools[pool_address] == false, "Address already exists");

    //     pools[pool_address] = true; 
    //     pools_array.push(pool_address);

    // }

    //Validator should be added for each borrower
    function addValidator(address validator_address) external override onlyPools {
        require(validator_address != address(0), "Zero address detected");
        require(validators[validator_address] == false, "Address already exists");

        validators[validator_address] = true; 
        validators_array.push(validator_address);

    }

   

 function initiateMarket_(
        MarketInfo memory marketData, // marketID shouldn't be set. Everything else should be though
        address recipient,
        bytes32 loanID, 
        address bonding_curve_address, 
        address market_manager_address
    ) public  {
  

        AMMFactory amm = AMMFactory(marketData.ammFactoryAddress);
        IMarketManager market_manager = IMarketManager(market_manager_address);
        TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketData.marketFactoryAddress);
        uint256 marketId = marketFactory.createZCBMarket(
                    msg.sender,
                    marketData.description, 
                    marketData.names[0], 
                    marketData.odds,
                    bonding_curve_address);

        marketData.marketID = marketId; 
        borrower_market_data[recipient][loanID] = marketData; 

        market_manager.initiate_bonding_curve(marketId); 
        market_manager.setMarketRestrictionData(
            true,true, marketId, 0);
            
    
    }    


    /*
    @Param atLoss: when actual returns lower than expected 
    @Param principal_loss: if total returned less than principal, principal-total returned
    */
    function resolveMarket_(
        address recipient,
        bytes32 loanID,
        bool atLoss,
        uint256 extra_gain, 
        uint256 principal_loss, 
        address market_manager_address
    ) external  {

        MarketInfo storage marketInfo  = borrower_market_data[recipient][loanID];

        uint256 marketID = marketInfo.marketID;

        AMMFactory amm = AMMFactory(marketInfo.ammFactoryAddress);
        IMarketManager market_manager = IMarketManager(market_manager_address);
        TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketInfo.marketFactoryAddress);

        market_manager.update_redemption_price(marketID, atLoss,extra_gain, principal_loss); 
        market_manager.handle_maturity(marketID, atLoss, principal_loss); 
        market_manager.deactivateMarket(marketID); 

        uint256 winning_outcome = 0; //TODO  
        marketFactory.trustedResolveMarket( marketID, winning_outcome); 

        delete borrower_market_data[recipient][loanID];

    }
    
    /*
    Market is denied by validator or automatically if conditions are not met 
    */
    function denyMarket(
        address recipient,
        bytes32 loanID,
        uint256 marketId, 
        address market_manager_address
        ) 
        external 
        onlyValidator
    {
        MarketInfo storage marketInfo  = borrower_market_data[recipient][loanID];

        IMarketManager(market_manager_address).denyMarket(marketId);
        TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketInfo.marketFactoryAddress);

        uint256 winning_outcome = 0; //TODO  
        marketFactory.trustedResolveMarket( marketId, winning_outcome); 
        delete borrower_market_data[recipient][loanID];

    }

    function approveLoan(address recipient, bytes32 id, address marketFactory) external onlyValidator{
        lendingpool.approveLoan(recipient, id, marketFactory); 
    }


    //If true, it means net short CDS buys > required collateral and validator can approve the loan 
    function canBeApproved(address borrower, 
        bytes32 loanID, 
        address marketFactoryAddress ) external override returns(bool){

        MarketInfo memory marketInfo  = borrower_market_data[borrower][loanID];
        uint256 marketId = marketInfo.marketID; 
        TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketFactoryAddress);

        //TODO include case for multiple outcomes, for now outcome0 is long outcome1 is short 
        uint256 longs = marketFactory.getTradeDetails(marketId, 0);
        uint256 shorts = marketFactory.getTradeDetails(marketId, 1);
        uint256 netShorts = (shorts-longs); //DS amount with decimals 

        ILendingPool.LoanMetadata memory loanmetadata = lendingpool.getBorrowerLoanData(borrower); 
        uint256 principal = loanmetadata.principal; //this is in decimals format
        uint256 required_net_shorts = (principal * insurance_constant/1e6);   //Hardcoded for now

        return (required_net_shorts <= netShorts); 
    }
}

