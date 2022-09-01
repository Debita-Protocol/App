pragma solidity ^0.8.4;
import "../turbo/TrustedMarketFactoryV3.sol";
import {MarketManager} from "./marketmanager.sol";
import {ReputationNFT} from "./reputationtoken.sol";
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import {LinearBondingCurve} from "../bonds/LinearBondingCurve.sol";
import {BondingCurve} from "../bonds/bondingcurve.sol";
import {LinearBondingCurveFactory} from "../bonds/LinearBondingCurveFactory.sol"; 
import {Vault} from "../vaults/vault.sol";
import {Instrument} from "../vaults/instrument.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import {VaultFactory} from "./factories.sol"; 
import "hardhat/console.sol";
import "@interep/contracts/IInterep.sol";


// Controller contract responsible for providing initial liquidity to the
// borrower cds market, collect winnings when default, and burn the corresponding DS
contract Controller {
  using SafeMath for uint256;
  using FixedPointMathLib for uint256;

  struct MarketData {
      address instrument_address;
      address recipient;
  }

  event MarketInitiated(uint256 marketId, address recipient);

  mapping(address => bool) public  verified;
  mapping(uint256 => MarketData) public market_data; // id => recipient
  mapping(address=> uint256) public ad_to_id; //utilizer address to marketId, only one market ID per address at given moment, can generalize later
  mapping(uint256=> Vault) public vaults; 
  mapping(uint256=> uint256) public id_parent; //marketId-> vaultId 

  address creator_address;

  IInterep interep;
  TrustedMarketFactoryV3 marketFactory;
  MarketManager marketManager;
  Vault public vault;
  ReputationNFT repNFT; 
  LinearBondingCurveFactory linearBCFactory; 
  VaultFactory vaultFactory; 

  uint256 constant TWITTER_UNRATED_GROUP_ID = 16106950158033643226105886729341667676405340206102109927577753383156646348711;
  bytes32 constant private signal = bytes32("twitter-unrated");
  uint256 constant private insurance_constant = 5e5; //1 is 1e6, also needs to be able to be changed 
  uint256 constant PRICE_PRECISION = 1e18; 
  
  // Bond Curve Name
  string constant baseName = "Bond";
  string constant baseSymbol = "B";
  string constant s_baseName = "sBond";
  string constant s_baseSymbol = "sB";
  uint256 nonce = 0;

  /* ========== MODIFIERS ========== */
  modifier onlyValidator(uint256 marketId) {
      require(marketManager.isValidator(marketId, msg.sender));
      _;
  }

  modifier onlyOwner() {
      require(msg.sender == creator_address, "Only Owner can call this function");
      _;
  }
  modifier onlyManager() {
      require(msg.sender == address(marketManager) || msg.sender == creator_address, "Only Manager can call this function");
      _;
  }

  constructor (
      address _creator_address,
      address _interep_address
  ) {
      creator_address = _creator_address;
      interep = IInterep(_interep_address);

      linearBCFactory = new LinearBondingCurveFactory(); 
  }

  /*----Setup Functions----*/

  function setMarketManager(address _marketManager) public onlyOwner {
      require(_marketManager != address(0));
      marketManager = MarketManager(_marketManager);
  }

  function setVault(address _vault) public onlyOwner {
      require(_vault != address(0));
      vault = Vault(_vault);
  }

  function setMarketFactory(address _marketFactory) public onlyOwner {
      require(_marketFactory != address(0));
      marketFactory = TrustedMarketFactoryV3(_marketFactory);
  }

  function setReputationNFT(address NFT_address) public onlyOwner{
      repNFT = ReputationNFT(NFT_address); 
  }

  function setVaultFactory(address _vaultFactory) public onlyOwner {
    vaultFactory = VaultFactory(_vaultFactory); 
  }

  function verifyAddress(
      uint256 nullifier_hash, 
      uint256 external_nullifier,
      uint256[8] calldata proof
  ) external  {
      require(!verified[msg.sender], "address already verified");
      interep.verifyProof(TWITTER_UNRATED_GROUP_ID, signal, nullifier_hash, external_nullifier, proof);
      verified[msg.sender] = true;
  }

  function testVerifyAddress() external {
    verified[msg.sender] = true;
  }


  function mintRepNFT(
    address NFT_address,
    address trader
    ) external  {
    ReputationNFT(NFT_address).mint(msg.sender);
  }

  //////VAULT CREATORS//////
  function createVault(
    address underlying, 
    address controller, 

    bool _onlyVerified, 
    uint256 _r, 
    uint256 _mint_limit, 
    uint256 _total_mint_limit, 

    MarketManager.MarketParameters memory default_params 
    ) public {
    (Vault newVault, uint256 vaultId) = vaultFactory.newVault(
     underlying, 
     controller, 

     _onlyVerified, 
     _r, 
     _mint_limit,
     _total_mint_limit, 

     default_params
    ); 

    vaults[vaultId] = newVault; 

  }

  function marketId_to_vaultId(uint256 marketId) public view returns(uint256){
    return id_parent[marketId]; 
  }




  /////INITIATORS/////

  function createZCBs(
    uint256 P,
    uint256 I, 
    uint256 sigma, 
    uint256 marketId
    ) internal returns(OwnedERC20[] memory) {

    string memory name = string(abi.encodePacked(baseName, "-", Strings.toString(nonce)));
    string memory symbol = string(abi.encodePacked(baseSymbol, Strings.toString(nonce)));
    string memory s_name = string(abi.encodePacked(s_baseName, "-", Strings.toString(nonce)));
    string memory s_symbol = string(abi.encodePacked(s_baseSymbol, Strings.toString(nonce)));
    nonce++;
    //TODO abstractFactory 
    OwnedERC20 longzcb = linearBCFactory.newLongZCB(name, symbol, address(marketManager), address(vault), P,I, sigma); 
    OwnedERC20 shortzcb = linearBCFactory.newShortZCB(s_name, s_symbol, address(marketManager), address(vault), address(longzcb), marketId); 

    OwnedERC20[] memory zcb_tokens = new OwnedERC20[](2);
    zcb_tokens[0] = longzcb;
    zcb_tokens[1] = shortzcb; 

    return zcb_tokens;
  }


  function setMarketParameters(uint256 marketId) internal    {
    //TODO determine how to determine parameters for each instrument, below is default params 
    uint256  INSURANCE_CONSTANT = 5 * 10**5; 
    uint256  REPUTATION_CONSTANT = 3 * 10**5;
    uint256  VALIDATOR_CONSTANT = 3 * 10**4; 
    uint256  NUM_VALIDATOR = 1; 
    uint256  DELTA = 1* 10**5; 
    uint256  REP = 10; //number of top reputations allowed during onlyReputation phase 
    MarketManager.MarketParameters memory param = vaults[id_parent[marketId]].get_default_params(); 
    // MarketManager.MarketParameters memory param =  MarketManager.MarketParameters(
    //   NUM_VALIDATOR, VALIDATOR_CONSTANT, INSURANCE_CONSTANT, REPUTATION_CONSTANT, DELTA, REP);

    marketManager.set_parameters(param, marketId); 
  }

  /**
   @dev initiates market, called by frontend loan proposal or instrument form submit button.
   @param recipient is the 
   @dev a and b must be 60.18 format
   */

  /**
   @notice 
   */
  function initiateMarket(
    address recipient,
    Vault.InstrumentData memory instrumentData, // marketId should be set to zero, no way of knowing.
    uint256 vaultId
  ) external  {

    uint256 marketId = marketFactory.marketCount();
    id_parent[marketId] = vaultId;  
    setMarketParameters(marketId); 

    OwnedERC20[] memory zcb_tokens = createZCBs(
      instrumentData.principal, 
      instrumentData.expectedYield, 
      marketManager.getParameters(marketId).sigma, 
      marketId); 

    require(marketFactory.createZCBMarket(
      address(this), // controller is the settlement address
      instrumentData.description,
      zcb_tokens) == marketId, "MarketID err"); 


    ad_to_id[recipient] = marketId; 
    instrumentData.marketId = marketId;

    vaults[vaultId].addProposal(
        instrumentData
    );

    market_data[marketId] = MarketData(address(instrumentData.Instrument_address), recipient);
    // marketManager.setAssessmentPhase(marketId, true, true);  
    marketManager.setMarketPhase(marketId, true, true, 1000 * (10**6));  // need to set min rep score here as well
    marketManager.add_short_zcb( marketId, address(zcb_tokens[1])); 
    marketManager.set_validator_cap(marketId, instrumentData.principal, instrumentData.expectedYield); 

    repNFT.storeTopReputation(marketManager.getParameters(marketId).r,  marketId); 

    emit MarketInitiated(marketId, recipient);
  }

  /////RESOLVERS//////

  /**
  @notice main function called at maturity OR premature resolve of instrument(from early default)

  When market finishes at maturity, need to 
  1. burn all vault tokens in bc 
  2. mint all incoming redeeming vault tokens 
  */
  function resolveMarket(
    uint256 marketId
  ) external  
  {
    uint256 vaultId = id_parent[marketId]; 
    {uint256 bc_vault_balance = vaults[vaultId].balanceOf(getZCB_ad(marketId));
    uint256 sbc_vault_balance = vaults[vaultId].balanceOf(getshortZCB_ad(marketId)); 
    vaults[vaultId].controller_burn(bc_vault_balance,getZCB_ad(marketId)); 
    vaults[vaultId].controller_burn(sbc_vault_balance, getshortZCB_ad(marketId));}

    (bool atLoss,
    uint256 extra_gain,
    uint256 principal_loss) = vaults[vaultId].resolveInstrument(marketId); 

    marketManager.update_redemption_price(marketId, atLoss, extra_gain, principal_loss); 
    marketManager.deactivateMarket(marketId, atLoss);
    
    marketFactory.trustedResolveMarket(marketId, 0);//Winning Outcome TODO
  }


  /// @notice called when market is resolved 
  function redeem_mint(uint256 amount, address to, uint256 marketId) external onlyManager{
    vaults[id_parent[marketId]].controller_mint(amount,to); 
  }


  /// @notice checks for maturity, resolve at maturity
  function checkInstrument(
      uint256 marketId
  ) external
  ///onlyKeepers 
   returns (bool) {
    Vault.InstrumentData memory data = vaults[id_parent[marketId]].fetchInstrumentData( marketId);
      
    require(data.marketId > 0 && data.trusted, "instrument must be active");
    require(data.maturityDate > 0, "instrument hasn't been approved yet" );

    if (block.timestamp >= data.maturityDate) {
        this.resolveMarket(marketId);
        return true;
    }
    return false;
  }


  /// @notice when market is resolved(maturity/early default), calculates score
  /// and update each assessment phase trader's reputation, called by individual traders when redeeming 
  function updateReputation(uint256 marketId, address trader) external onlyManager {
    uint256 implied_probs = marketManager.assessment_probs(marketId, trader);
    console.log("implied probs", implied_probs); 

    uint256 scoreToAdd = implied_probs.mulDivDown(implied_probs, 10**18); //Experiment
    repNFT.addScore(trader, scoreToAdd); 


  }






  /////APPROVERS/DENIERS///////

  /**
   @notice
   */
  function confirmMarket(uint256 marketId) onlyValidator(marketId) {
    marketManager.confirmMarket(marketId, msg.sender);
    marketManager.validator_buy(marketId, msg.sender); 
  }

  /// @notice called by the validator when market conditions are met
  function approveMarket(
      uint256 marketId
  ) external 
  //onlyValidator 
  {
    require(marketManager.duringMarketAssessment(marketId), "Not during assessment");
    require(marketManager.marketCondition(marketId), "Market Condition Not met"); 
    require(!marketManager.onlyReputable(marketId), "Market Phase err"); 

    require(marketManager.isConfirmed(marketId), "market not confirmed");
    // marketManager.validator_buy(marketId, msg.sender); 
    // if (!marketManager.validator_can_approve(marketId)) return; 

    marketManager.approveMarket(marketId);
    marketManager.setUpperBound(marketId, 1000000*10**6); // need to get upper bound 
    
    trustInstrument(marketId); 

    // Deposit to the instrument contract
    uint256 principal = vault.fetchInstrumentData(marketId).principal; 
    //maybe this should be separated to prevent attacks 
    uint256 vaultId = id_parent[marketId];
    vaults[vaultId].depositIntoInstrument(Instrument(market_data[marketId].instrument_address), principal );
    vaults[vaultId].setMaturityDate(Instrument(market_data[marketId].instrument_address));
    vaults[vaultId].onMarketApproval(marketId);
  }

  // /// @notice computes 
  // function getUpperLowerBound(uint256 marketId) internal returns(uint256, uint256){
  //   marketManager.getParameters(marketId).delta
  //   return 
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
    
    marketFactory.trustedResolveMarket(marketId, winning_outcome);
    
    vaults[id_parent[marketId]].denyInstrument(marketId);
  }
 

  function trustInstrument(uint256 marketId) private  {
    vaults[id_parent[marketId]].trustInstrument(Instrument(market_data[marketId].instrument_address));
  }










  /* --------VIEW FUNCTIONS---------  */
  function getMarketId(address recipient) public view returns(uint256){
    return ad_to_id[recipient];
  }

  function getZCB(uint256 marketId) public view returns (OwnedERC20){
    AbstractMarketFactoryV3.Market memory market = marketFactory.getZCBMarket(marketId);
    return OwnedERC20(market.shareTokens[0]);
  }
  function getZCB_ad(uint256 marketId) public view returns (address){
    AbstractMarketFactoryV3.Market memory market = marketFactory.getZCBMarket(marketId);
    return address(OwnedERC20(market.shareTokens[0]));
  }
  function getshortZCB_ad(uint256 marketId) public view returns(address){
    AbstractMarketFactoryV3.Market memory market = marketFactory.getZCBMarket(marketId);
    return address(OwnedERC20(market.shareTokens[1]));
  }

  function canBeApproved(uint256 marketId) public view returns (bool) {
      //TODO
    return true;
  }

  function getVault(uint256 marketId) public view returns(Vault){
    return vaults[id_parent[marketId]]; 
  }

  function isVerified(address addr) view public returns (bool) {
    return verified[addr];
  }
}

