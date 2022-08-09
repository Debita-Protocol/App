pragma solidity ^0.8.4;
import "../rewards/MasterChef.sol";
import "./ILendingPool.sol";
import "./IController.sol";
import "../turbo/TrustedMarketFactoryV3.sol";
import {MarketManager} from "./marketmanager.sol";
import {ReputationNFT} from "./reputationtoken.sol";
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import {LinearBondingCurve} from "../bonds/LinearBondingCurve.sol";
import {BondingCurve} from "../bonds/bondingcurve.sol";
import {Vault} from "../vaults/vault.sol";
import {Instrument} from "../vaults/instrument.sol";

import "hardhat/console.sol";
import "@interep/contracts/IInterep.sol";
// Controller contract responsible for providing initial liquidity to the
// borrower cds market, collect winnings when default, and burn the corresponding DS
contract Controller {
    using SafeMath for uint256;

    struct MarketData {
        address instrument_address;
        address recipient;
    }

    mapping(address => bool) public  validators; 
    mapping(address => bool) public  verified;
    mapping(uint256 => MarketData) public market_data; // id => recipient

    address[] validators_array;

    address creator_address;

    IInterep interep;
    TrustedMarketFactoryV3 marketFactory;
    MarketManager marketManager;
    Vault vault;

    uint256 constant TWITTER_UNRATED_GROUP_ID = 16106950158033643226105886729341667676405340206102109927577753383156646348711;
    bytes32 constant private signal = bytes32("twitter-unrated");
    uint256 insurance_constant = 5e5; //1 is 1e6, also needs to be able to be changed 

    /* ========== MODIFIERS ========== */
    modifier onlyValidator() {
        require(validators[msg.sender] == true || msg.sender == creator_address, "Only Validators can call this function");
        _;
    }

    // modifier onlyPools() {
    //     require(msg.sender == address(lendingpool)|| msg.sender == creator_address, "Only Pools can call this function");
    //     _;
    // }

    modifier onlyOwner() {
        require(msg.sender == creator_address, "Only Owner can call this function");
        _;
    }

    constructor (
        address _creator_address,
        address _interep_address
    ) {
        creator_address = _creator_address;
        interep = IInterep(_interep_address);
    }

    /*----Setup Functions----*/

    function setMarketManager(address _marketManager) public {
        require(_marketManager != address(0));
        require(address(marketManager) == address(0));
        marketManager = MarketManager(_marketManager);
    }

    function setVault(address _vault) public {
        require(_vault != address(0));
        require(address(vault) == address(0));
        vault = Vault(_vault);
    }

    function setMarketFactory(address _marketFactory) public {
        require(_marketFactory != address(0));
        require(address(marketFactory) == address(0));
        marketFactory = TrustedMarketFactoryV3(_marketFactory);
    }

    // add instrument to vault, initiate createZCBMarket()
    /**
     @dev initiates market, called by frontend loan proposal or instrument form submit button.
     */
    function initiateMarket_(
        address recipient,
        string calldata description,
        uint256[] calldata odds,
        Vault.InstrumentData memory instrumentData // marketId should be set to zero, no way of knowing.
    ) external {
        uint256 a;
        uint256 b;
        (a, b) = getCurveParams();

        OwnedERC20 zcb = new LinearBondingCurve(
            "name",
            "symbol",
            address(marketManager), // owner
            address(0), // Vault coin => UNDERLYING***
            a,
            b
        );

        uint256 marketId = marketFactory.createZCBMarket(
            address(this), // controller is the settlement address
            description,
            odds,
            zcb
        );

        instrumentData.marketId = marketId;


        vault.addProposal(
            instrumentData.marketId,
            instrumentData.principal,
            instrumentData.expectedYield,
            instrumentData.duration,
            instrumentData.faceValue,
            instrumentData.description,
            Instrument(instrumentData.Instrument_address)
        );

        market_data[marketId] = MarketData(address(instrumentData.Instrument_address), recipient);
    }

    function getCurveParams() public returns (uint256 a, uint256 b){
        a = 1;
        b = 0;
    }

    function verifyAddress(
        uint256 nullifier_hash, 
        uint256 external_nullifier,
        uint256[8] calldata proof
    ) external  {
        require(!verified[msg.sender], "address already verified");
        //interep.verifyProof(TWITTER_UNRATED_GROUP_ID, signal, nullifier_hash, external_nullifier, proof);
        verified[msg.sender] = true;

    }

    function isVerified(address addr) view public returns (bool) {
        return verified[addr];
    }

    function mintRepNFT(
        address NFT_address,
        address trader
        ) external  {
        ReputationNFT(NFT_address).mint(msg.sender);
    }

    //Pool added when contract is deployed 
    // function addPool(address pool_address) external  onlyOwner {
    //     require(pool_address != address(0), "Zero address detected");
    //     require(pools[pool_address] == false, "Address already exists");

    //     pools[pool_address] = true; 
    //     pools_array.push(pool_address);

    // }

    //Validator should be added for each borrower
    function addValidator(address validator_address) external  {
        require(validator_address != address(0), "Zero address detected");
        require(validators[validator_address] == false, "Address already exists");

        validators[validator_address] = true; 
        validators_array.push(validator_address);
    }

    // function initiateMarket(
    //     MarketInfo memory marketData, // marketID shouldn't be set. Everything else should be though
    //     address recipient,
    //     address market_manager_address
    // ) public  {
    //     // AMMFactory amm = AMMFactory(marketData.ammFactoryAddress); // do we need this?
    //     IMarketManager market_manager = IMarketManager(market_manager_address);
    //     TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketData.marketFactoryAddress);
    //     uint256 marketId = marketFactory.createZCBMarket(
    //         msg.sender,
    //         marketData.description,
    //         marketData.names[0],
    //         marketData.odds
    //     );

    //     marketData.marketID = marketId; 
    //     borrower_market_data[loanID] = marketData; 

    //     market_manager.initiate_bonding_curve(marketId); 
    //     market_manager.setMarketRestrictionData(true,true, marketId, 0);
    // }    

    function resolveMarket(
        uint256 marketId,
        bool atLoss,
        uint256 extra_gain, 
        uint256 principal_loss, 
        address market_manager_address
    ) external  {
        marketManager.update_redemption_price(marketId, atLoss, extra_gain, principal_loss); 
        marketManager.handle_maturity(marketId, atLoss, principal_loss); 
        marketManager.deactivateMarket(marketId);

        //delete market_data[marketId]?

        uint256 winning_outcome = 0; //TODO  
        marketFactory.trustedResolveMarket(marketId, winning_outcome); 
    }

    /*
    @Param atLoss: when actual returns lower than expected 
    @Param principal_loss: if total returned less than principal, principal-total returned
    */
    // function resolveMarket(
    //     address recipient,
    //     bytes32 loanID,
    //     bool atLoss,
    //     uint256 extra_gain, 
    //     uint256 principal_loss, 
    //     address market_manager_address
    // ) external  {

    //     MarketInfo storage marketInfo  = borrower_market_data[recipient][loanID];

    //     uint256 marketID = marketInfo.marketID;

    //     AMMFactory amm = AMMFactory(marketInfo.ammFactoryAddress);
    //     IMarketManager market_manager = IMarketManager(market_manager_address);
    //     TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketInfo.marketFactoryAddress);

    //     market_manager.update_redemption_price(marketID, atLoss, extra_gain, principal_loss); 
    //     market_manager.handle_maturity(marketID, atLoss, principal_loss); 
    //     market_manager.deactivateMarket(marketID);

    //     uint256 winning_outcome = 0; //TODO  
    //     marketFactory.trustedResolveMarket( marketID, winning_outcome); 

    //     delete borrower_market_data[recipient][loanID];

    // }
    
    /*
    Market is denied by validator or automatically if conditions are not met 
    */
    function denyMarket(
        uint256 marketId
    ) external  onlyValidator {
        marketManager.denyMarket(marketId);
        //TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketInfo.marketFactoryAddress);
        uint256 winning_outcome = 0; //TODO  
        marketFactory.trustedResolveMarket( marketId, winning_outcome);
    }

    function trustInstrument(uint256 marketId) external onlyValidator {
        vault.trustInstrument(Instrument(market_data[marketId].instrument_address));
    }
    // function approveLoan(address recipient, bytes32 id, address marketFactory) external  onlyValidator{
    //     lendingpool.approveLoan(recipient, id, marketFactory); 
    // }

    function getZCB(uint256 marketId) public returns (OwnedERC20){
        AbstractMarketFactoryV3.Market memory market = marketFactory.getZCBMarket(marketId);
        return OwnedERC20(market.shareTokens[0]);
    }

    function canBeApproved(uint256 marketId) external returns (bool) {
        //TODO
        return true;
    }

    //If true, it means net short CDS buys > required collateral and validator can approve the loan 
    // function canBeApproved(address borrower, 
    //     bytes32 loanID, 
    //     address marketFactoryAddress ) external  returns(bool){

    //     MarketInfo memory marketInfo  = borrower_market_data[borrower][loanID];
    //     uint256 marketId = marketInfo.marketID; 
    //     TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketFactoryAddress);

    //     //TODO include case for multiple outcomes, for now outcome0 is long outcome1 is short 
    //     uint256 longs = marketFactory.getTradeDetails(marketId, 0);
    //     uint256 shorts = marketFactory.getTradeDetails(marketId, 1);
    //     uint256 netShorts = (shorts-longs); //DS amount with decimals 

    //     ILendingPool.LoanMetadata memory loanmetadata = lendingpool.getBorrowerLoanData(borrower); 
    //     uint256 principal = loanmetadata.principal; //this is in decimals format
    //     uint256 required_net_shorts = (principal * insurance_constant/1e6);   //Hardcoded for now

    //     return (required_net_shorts <= netShorts); 
    // }
}

