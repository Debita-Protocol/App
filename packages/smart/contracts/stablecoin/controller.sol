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

  mapping(address => bool) public  validators; 
  mapping(address => bool) public  verified;
  mapping(uint256 => MarketData) public market_data; // id => recipient
  mapping(address=> uint256) public ad_to_id; //utilizer address to marketId, only one market ID per address at given moment, can generalize later

  address[] validators_array;

  address creator_address;

  IInterep interep;
  TrustedMarketFactoryV3 marketFactory;
  MarketManager marketManager;
  Vault public vault;
  ReputationNFT repNFT; 
  LinearBondingCurveFactory linearBCFactory; 

  uint256 constant TWITTER_UNRATED_GROUP_ID = 16106950158033643226105886729341667676405340206102109927577753383156646348711;
  bytes32 constant private signal = bytes32("twitter-unrated");
  uint256 insurance_constant = 5e5; //1 is 1e6, also needs to be able to be changed 
  uint256 constant PRICE_PRECISION = 1e18; 
  
  // Bond Curve Name
  string constant baseName = "Bond";
  string constant baseSymbol = "B";
  string constant s_baseName = "sBond";
  string constant s_baseSymbol = "sB";
  uint256 nonce = 0;

  /* ========== MODIFIERS ========== */
  modifier onlyValidator() {
      require(validators[msg.sender] == true || msg.sender == creator_address, "Only Validators can call this function");
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


  /// @notice curveparams for linear bonds 
  /// b is a initial price parameter we choose i.e 0.9, a is a function of b
  /// a = (1-b) **2 / 2* interest 
  /// @dev both principal/interest should be in price precision
  /// @param interest is amount of interest in dollars, not percentage,
  /// returns a,b is both in 18 price_precision
  function getCurveParams(uint256 principal, uint256 interest) internal view returns (uint256, uint256){

    uint256 price_precision = 1e18; 
    uint256 interest_ = interest * (10**12); 
    uint256 principal_ = principal * (10**12); 

    uint256 b = (2*principal_).divWadDown(principal_+interest_) - price_precision; 
    uint256 a = (price_precision -b).divWadDown(principal_+interest_); 

    return (a,b);


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
  //Validator should be added for each borrower
  function addValidator(address validator_address) external  {
    require(validator_address != address(0), "Zero address detected");
    require(validators[validator_address] == false, "Address already exists");

    validators[validator_address] = true; 
    validators_array.push(validator_address);
}



  function createZCBs(
    uint256 a,
    uint256 b
    ) internal returns(OwnedERC20[] memory) {

    string memory name = string(abi.encodePacked(baseName, "-", Strings.toString(nonce)));
    string memory symbol = string(abi.encodePacked(baseSymbol, Strings.toString(nonce)));
    string memory s_name = string(abi.encodePacked(s_baseName, "-", Strings.toString(nonce)));
    string memory s_symbol = string(abi.encodePacked(s_baseSymbol, Strings.toString(nonce)));
    nonce++;

    uint256 marketId = marketFactory.marketCount(); 
    OwnedERC20 longzcb = linearBCFactory.newLongZCB(name, symbol, address(marketManager), address(vault), a,b); 
    OwnedERC20 shortzcb = linearBCFactory.newShortZCB(s_name, s_symbol, address(marketManager), address(vault), address(longzcb), marketId); 

    OwnedERC20[] memory zcb_tokens = new OwnedERC20[](2);
    zcb_tokens[0] = longzcb;
    zcb_tokens[1] = shortzcb; 

    return zcb_tokens;
  }

  /**
   @dev initiates market, called by frontend loan proposal or instrument form submit button.
   @param recipient is the 
   @dev a and b must be 60.18 format
   */

  function initiateMarket(
      address recipient,
      Vault.InstrumentData memory instrumentData // marketId should be set to zero, no way of knowing.
  ) external  {

    (uint256 a, uint256 b) = getCurveParams(instrumentData.principal, instrumentData.expectedYield);
    uint256 marketId = marketFactory.marketCount(); 

    OwnedERC20[] memory zcb_tokens = createZCBs(a,b); 

    require(marketFactory.createZCBMarket(
        address(this), // controller is the settlement address
        instrumentData.description,
        zcb_tokens) == marketId, "MarketID err"); 


    ad_to_id[recipient] = marketId; 
    instrumentData.marketId = marketId;

    vault.addProposal(
        instrumentData
    );

    market_data[marketId] = MarketData(address(instrumentData.Instrument_address), recipient);
    // marketManager.setAssessmentPhase(marketId, true, true);  
    marketManager.setMarketPhase(marketId, true, true, 0, 1000 * (10**6));  // need to set min rep score here as well.e
    marketManager.add_short_zcb( marketId, address(zcb_tokens[1])); 
  
    emit MarketInitiated(marketId, recipient);
}

  
 
  /**
  @notice main function called at maturity OR premature resolve of instrument(from early default)
  @dev triggered by resolve Loan 
  @param atLoss: when actual returns lower than expected 
  @param principal_loss: if total returned less than principal, principal-total returned, this is total loss

  When market finishes at maturity, need to 
  1. burn all vault tokens in bc 
  2. mint all incoming redeeming vault tokens 
  */
function resolveMarket(
    uint256 marketId,
    bool atLoss,
    uint256 extra_gain,
    uint256 principal_loss
) external  {
    marketManager.update_redemption_price(marketId, atLoss, extra_gain, principal_loss); 
    marketManager.handle_maturity(marketId, atLoss, principal_loss); 
    marketManager.deactivateMarket(marketId, atLoss);
    
    //Burn all vault tokens in BC
    address bc_ad = getZCB_ad( marketId); 
    uint256 bc_vault_balance = vault.balanceOf(bc_ad); 
    vault.controller_burn(bc_vault_balance,bc_ad); 

    uint256 winning_outcome = 0; //TODO  
    marketFactory.trustedResolveMarket(marketId, winning_outcome);
  }


  /// @notice called by the validator when market conditions are met
  function approveMarket(
      uint256 marketId
  ) external onlyValidator {
    if (!marketManager.marketCondition(marketId)) revert("Market Condition Not met");    
    require(!marketManager.onlyReputable(marketId), "Market Phase err"); 
    
    marketManager.approveMarket(marketId);
    marketManager.setUpperBound(marketId, 1000000*10**6); // need to get upper bound 
    
    trustInstrument(marketId); 

    // Deposit to the instrument contract
    uint256 principal = vault.fetchInstrumentData(marketId).principal; 
    //maybe this should be separated to prevent attacks 
    
    vault.depositIntoInstrument(Instrument(market_data[marketId].instrument_address), principal );
    vault.setMaturityDate(Instrument(market_data[marketId].instrument_address));
    vault.onMarketApproval(marketId);
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
    
    marketFactory.trustedResolveMarket(marketId, winning_outcome);
    
    vault.denyInstrument(marketId);
  }
 


  function trustInstrument(uint256 marketId) private  {
    vault.trustInstrument(Instrument(market_data[marketId].instrument_address));
  }

  function redeem_mint(uint256 amount, address to) external onlyManager{
    vault.controller_mint(amount,to); 
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

  function isVerified(address addr) view public returns (bool) {
    return verified[addr];
  }
}

