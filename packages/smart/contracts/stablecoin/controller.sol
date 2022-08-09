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
    Vault public vault;
    ReputationNFT repNFT; 

    uint256 constant TWITTER_UNRATED_GROUP_ID = 16106950158033643226105886729341667676405340206102109927577753383156646348711;
    bytes32 constant private signal = bytes32("twitter-unrated");
    uint256 insurance_constant = 5e5; //1 is 1e6, also needs to be able to be changed 

    /* ========== MODIFIERS ========== */
    modifier onlyValidator() {
        require(validators[msg.sender] == true || msg.sender == creator_address, "Only Validators can call this function");
        _;
    }

 
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

    function setMarketManager(address _marketManager) public onlyOwner {
        require(_marketManager != address(0));
        require(address(marketManager) == address(0));
        marketManager = MarketManager(_marketManager);
    }

    function setVault(address _vault) public onlyOwner {
        require(_vault != address(0));
        require(address(vault) == address(0));
        vault = Vault(_vault);
    }

    function setMarketFactory(address _marketFactory) public onlyOwner {
        require(_marketFactory != address(0));
        require(address(marketFactory) == address(0));
        marketFactory = TrustedMarketFactoryV3(_marketFactory);
    }
    function setReputationNFT(address NFT_address) public onlyOwner{
        repNFT = ReputationNFT(NFT_address); 
    }

    // add instrument to vault, initiate createZCBMarket()

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



    //Validator should be added for each borrower
    function addValidator(address validator_address) external  {
        require(validator_address != address(0), "Zero address detected");
        require(validators[validator_address] == false, "Address already exists");

        validators[validator_address] = true; 
        validators_array.push(validator_address);
    }



    /**
     @dev initiates market, called by frontend loan proposal or instrument form submit button.
     */
    function initiateMarket(
        address recipient,
        string calldata description,
        uint256[] calldata odds,
        Vault.InstrumentData memory instrumentData // marketId should be set to zero, no way of knowing.
    ) external  {
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
            instrumentData
        );

        market_data[marketId] = MarketData(address(instrumentData.Instrument_address), recipient);
        marketManager.setAssessmentPhase(marketId, true, true);
       
    }

   
   
    /*
    @notice main function called at maturity OR premature resolve of instrument(from early default)

    @Param atLoss: when actual returns lower than expected 
    @Param principal_loss: if total returned less than principal, principal-total returned
    */
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
        //update repNFT score 
        //delete market_data[marketId]?

        uint256 winning_outcome = 0; //TODO  
        marketFactory.trustedResolveMarket(marketId, winning_outcome); 
    }


    
    /// @notice called by the validator when market conditions are met
    function approveMarket( 
        uint256 marketId
        ) external onlyValidator{
        require(marketManager.marketCondition(marketId), "Market Condition Not met"); 
        require(!marketManager.onlyReputable(marketId), "Market Phase err"); 
        marketManager.setAssessmentPhase(marketId, false, false); 
        trustInstrument(marketId); 

        // Deposit to the instrument contract
        uint256 principal = vault.fetchInstrumentData(marketId).principal; 
        //maybe this should be separated to prevent attacks 
        vault.depositIntoInstrument(Instrument(market_data[marketId].instrument_address), principal ); 
    }

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


    function trustInstrument(uint256 marketId) private  {
        vault.trustInstrument(Instrument(market_data[marketId].instrument_address));
    }
  

    function getZCB(uint256 marketId) public view returns (OwnedERC20){
        AbstractMarketFactoryV3.Market memory market = marketFactory.getZCBMarket(marketId);
        return OwnedERC20(market.shareTokens[0]);
    }

    function canBeApproved(uint256 marketId) external returns (bool) {
        //TODO
        return true;
    }


}

