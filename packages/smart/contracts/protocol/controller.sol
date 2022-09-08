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
import {config} from "./helpers.sol"; 


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
  mapping(uint256=> Vault) public vaults; // vault id to Vault contract
  mapping(uint256=> uint256) public id_parent; //marketId-> vaultId 

  address creator_address;

  IInterep interep;
  TrustedMarketFactoryV3 marketFactory;
  MarketManager marketManager;
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
  // modifier onlyValidator(uint256 marketId) {
  //     require(marketManager.isValidator(marketId, msg.sender)|| msg.sender == creator_address);
  //     _;
  // }

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


  /**
   @notice creates vault
   @param underlying: underlying asset for vault
   @param _onlyVerified: only verified users can mint shares
   @param _r: minimum reputation score to mint shares
   @param _asset_limit: max number of shares for a single address
   @param _total_asset_limit: max number of shares for entire vault
   @param default_params: default params for markets created by vault
   */
  function createVault(
    address underlying,
    bool _onlyVerified, 
    uint256 _r, 
    uint256 _asset_limit, 
    uint256 _total_asset_limit, 
    MarketManager.MarketParameters memory default_params 
  ) public {
    (Vault newVault, uint256 vaultId) = vaultFactory.newVault(
     underlying, 
     address(this),
     _onlyVerified, 
     _r, 
     _asset_limit,
     _total_asset_limit,
     default_params
    );

    vaults[vaultId] = newVault;
  }



  function marketIdToVaultId(uint256 marketId) public view returns(uint256){
    return id_parent[marketId]; 
  }

  /////INITIATORS/////

  /**
   @param P: principal
   @param I: expected yield (total interest)
   @param sigma is the proportion of P that is going to be bought at a discount 
   */
  function createZCBs(
    uint256 P,
    uint256 I, 
    uint256 sigma, 
    uint256 marketId
    ) internal returns(OwnedERC20[] memory) {

    //TODO abstractFactory 
    OwnedERC20[] memory zcb_tokens = new OwnedERC20[](2);

    zcb_tokens[0] = linearBCFactory.newLongZCB(
      string(abi.encodePacked(baseName, "-", Strings.toString(nonce))),
     string(abi.encodePacked(baseSymbol, Strings.toString(nonce))), 
     address(marketManager), 
     getVaultAd( marketId), 
     P,
     I, 
     sigma); 

    zcb_tokens[1] = linearBCFactory.newShortZCB(
      string(abi.encodePacked(s_baseName, "-", Strings.toString(nonce))), 
      string(abi.encodePacked(s_baseSymbol, Strings.toString(nonce))), 
      address(marketManager), 
      getVaultAd( marketId), 
      address(zcb_tokens[0]), 
      marketId); 

    nonce++;

    return zcb_tokens;
  }



  function _initialMarketmanagerSetup(
    uint256 marketId, 
    address shortZCB, 
    Vault.InstrumentData memory instrumentData
  ) internal {

    uint256 base_budget = 1000 * config.WAD; //TODO
    uint256 alpha = marketManager.getParameters(marketId).alpha; 
    uint256 delta = marketManager.getParameters(marketId).delta; 
    marketManager.setMarketPhase(marketId, true, true, base_budget);  
    marketManager.add_short_zcb( marketId, shortZCB); 
    marketManager.set_validator_cap(marketId, instrumentData.principal, instrumentData.expectedYield); 
    marketManager.setUpperBound(marketId, 
    instrumentData.principal.mulDivDown(alpha+delta, 1e6));  //Set initial upper bound 
  }

  /**
   @dev initiates market, called by frontend loan proposal or instrument form submit button.
   @param recipient is the utilizer 
   @param recipient: utilizer for the associated instrument
   */
  function initiateMarket(
    address recipient,
    Vault.InstrumentData memory instrumentData, // marketId should be set to zero, no way of knowing.
    uint256 vaultId
  ) external  {
    // TODO checks for the instrument contract?
    require(instrumentData.Instrument_address != address(0), "must not be zero address");
    require(instrumentData.principal >= config.WAD, "Precision err"); 
    require(address(vaults[vaultId]) != address(0), "Vault doesn't' exist");

    uint256 marketId = marketFactory.marketCount();
    id_parent[marketId] = vaultId; 
    marketManager.setParameters(vaults[vaultId].get_vault_params(), marketId); 


    OwnedERC20[] memory zcb_tokens = createZCBs(
      instrumentData.principal, 
      instrumentData.expectedYield, 
      marketManager.getParameters(marketId).sigma, 
      marketId); 

    require(marketFactory.createZCBMarket(
      address(this), // controller is the settlement address
      instrumentData.description,
      zcb_tokens) == marketId, "MarketID err"); 


    ad_to_id[recipient] = marketId; //only for testing purposes, one utilizer should be able to create multiple markets
    instrumentData.marketId = marketId;

    vaults[vaultId].addProposal(
        instrumentData
    );

    market_data[marketId] = MarketData(instrumentData.Instrument_address, recipient);

    _initialMarketmanagerSetup(marketId, address(zcb_tokens[1]), instrumentData ); //TODO just get shortZCB from controller? gas dif
 
    repNFT.storeTopReputation(marketManager.getParameters(marketId).r,  marketId); 

    emit MarketInitiated(marketId, recipient);
  }




  /// Resolve market functions separated to 3 txs to prevent attacks
  /// @notice Resolve function 1
  function prepareResolve(uint256 marketId) 
  external {
    vaults[id_parent[marketId]].prepareResolve(marketId); 

  }

  /// @notice Resolve function 2
  /// @notice Prepare market/instrument for closing, called separately before resolveMarket
  /// exists to circumvent manipulations via  
  function beforeResolve(uint256 marketId) 
  external 
  //onlyKeepers 
  {
    vaults[id_parent[marketId]].beforeResolve(marketId); 

  }


  /**
  Resolve function 3
  @notice main function called at maturity OR premature resolve of instrument(from early default)
  
  When market finishes at maturity, need to 
  1. burn all vault tokens in bc 
  2. mint all incoming redeeming vault tokens 

  Validators can call this function as they are incentivized to redeem
  any funds left for the instrument , irrespective of whether it is in profit or inloss. 
  */
  function resolveMarket(
    uint256 marketId
  ) external 
  //onlyValidators
  {

    (bool atLoss,
    uint256 extra_gain,
    uint256 principal_loss) = vaults[id_parent[marketId]].resolveInstrument(marketId); 

    marketManager.update_redemption_price(marketId, atLoss, extra_gain, principal_loss); 
    marketManager.deactivateMarket(marketId, atLoss);
    
    uint256 winning_outcome = atLoss? 0 : 1; 
    marketFactory.trustedResolveMarket(marketId, winning_outcome);//Winning Outcome TODO
  }


  /// @notice called when market is resolved 
  function redeem_mint(
    uint256 amount, 
    address to, 
    uint256 marketId) 
  external onlyManager{
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
        // this.resolveMarket(marketId);
        this.beforeResolve(marketId); 
        return true;
    }
    return false;
  }


  /// @notice when market is resolved(maturity/early default), calculates score
  /// and update each assessment phase trader's reputation, called by individual traders when redeeming 
  function updateReputation(
    uint256 marketId, 
    address trader) 
  external onlyManager {
    uint256 implied_probs = marketManager.assessment_probs(marketId, trader);
    console.log("implied probs", implied_probs); 

    uint256 scoreToAdd = implied_probs.mulDivDown(implied_probs, config.WAD); //Experiment
    repNFT.addScore(trader, scoreToAdd); 

  }

  /// @notice function that closes the instrument/market before maturity, maybe to realize gains/cut losses fast
  /// or debt is prematurely fully repaid, or underlying strategy is deemed dangerous, etc.  
  /// @dev withdraws all balance from the instrument. 
  /// If assets in instrument is not in underlying, need all balances to be divested to underlying 
  /// Ideally this should be called by several validators, maybe implement a voting scheme and have a keeper call it.
  /// @param emergency ascribes cases where the instrument should be forcefully liquidated back to the vault
  function forceCloseInstrument(uint256 marketId, bool emergency) external returns(bool){
    Vault vault = vaults[id_parent[marketId]]; 

    // Prepare for close 
    vault.closeInstrument(marketId); 

    // Harvests/records all profit & losses
    vault.beforeResolve(marketId); 

    return true;

    //Now the resolveMarket function should be called in the next transaction 
  }




  /**
   @notice
   */
  function confirmMarket(uint256 marketId) public 
  //onlyValidator(marketId) 
  {
    marketManager.confirmMarket(marketId, msg.sender);
    marketManager.validator_buy(marketId, msg.sender); 
  }

  /// @notice called by the validator when market conditions are met
  function approveMarket(
      uint256 marketId
  ) external 
  //onlyValidator 
  {
    Vault vault = vaults[id_parent[marketId]]; 

    require(marketManager.duringMarketAssessment(marketId), "Not during assessment");
    require(marketManager.marketCondition(marketId), "Market Condition Not met"); 
    require(!marketManager.onlyReputable(marketId), "Market Phase err"); 
    require(marketManager.isConfirmed(marketId), "market not confirmed");
    require(vault.instrumentApprovalCondition(marketId), "Instrument approval condition met"); 
 
    marketManager.approveMarket(marketId);
    marketManager.setLowerBound(marketId,
                getLowerBound(marketId, vault.fetchInstrumentData(marketId).principal)); 
    

    // Deposit to the instrument contract
    // maybe this should be separated to prevent attacks 
    vault.trustInstrument(marketId);
    vault.depositIntoInstrument(marketId, vault.fetchInstrumentData(marketId).principal);
    vault.setMaturityDate(marketId);
    vault.onMarketApproval(marketId);
  }

  function getLowerBound(uint256 marketId, uint256 principal) internal view returns(uint256){
 
    return ( marketManager.getParameters(marketId).alpha-marketManager.getParameters(marketId).delta)
            .mulDivDown(principal, 1e6); 

  }

  /*
  Market is denied by validator or automatically if conditions are not met 
  */
  function denyMarket(
      uint256 marketId
  ) external  
  //onlyValidator(marketId) 
  {
    marketManager.denyMarket(marketId);
    
    uint256 winning_outcome = 0; //TODO  
    marketFactory.trustedResolveMarket(marketId, winning_outcome);

    vaults[id_parent[marketId]].denyInstrument(marketId);

  }

  /* --------GETTER FUNCTIONS---------  */
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

  function getVault(uint256 marketId) public view returns(Vault){
    return vaults[id_parent[marketId]]; 
  }
  function getVaultAd(uint256 marketId) public view returns(address){
    return address(vaults[id_parent[marketId]]); 
  }

  function isVerified(address addr)  public view returns (bool) {
    return verified[addr];
  }

  function getVaultfromId(uint256 vaultId) public view returns(address){
    return address(vaults[vaultId]); 
  }

  function marketId_to_vaultId(uint256 marketId) public view returns(uint256){
    return id_parent[marketId]; 
  }



}

