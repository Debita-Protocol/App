pragma solidity ^0.8.4;

import "./owned.sol";
import "./reputationtoken.sol"; 
import {BondingCurve} from "../bonds/bondingcurve.sol";
import {Controller} from "./controller.sol";
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {LinearShortZCB, ShortBondingCurve} from "../bonds/LinearShortZCB.sol"; 
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import {ChainlinkClient} from "./VRFConsumer.sol";

import {config} from "./helpers.sol"; 

contract MarketManager is Owned {
  using FixedPointMathLib for uint256;

  uint256 private constant PRICE_PRECISION = 1e6; 

  ReputationNFT rep;
  Controller controller;

  mapping(uint256=>uint256) private redemption_prices; //redemption price for each market, set when market resolves 
  mapping(uint256=>mapping(address=>uint256)) private assessment_collaterals;  //marketId-> trader->collateralIn
  mapping(uint256=>mapping(address=>uint256)) private assessment_prices; 
  mapping(uint256=>mapping(address=>bool)) private assessment_trader;
  mapping(uint256=>mapping(address=>uint256) ) public assessment_probs; 
  mapping(uint256=> MarketPhaseData) public restriction_data; // market ID => restriction data
  mapping(uint256=> uint256) collateral_pot; // marketID => total collateral recieved (? isn't this redundant bc bonding curves fundsperBonds)
  mapping(uint256=> CDP) private debt_pools; // marketID => debt info
  mapping(uint256=> MarketParameters) private parameters; //marketId-> params
  mapping(uint256=> mapping(address=>bool )) private redeemed; 


  struct ValidatorData{
    uint256 val_cap;// total zcb validators can buy at a discount
    uint256 avg_price; //price the validators can buy zcb at a discount 
    address[] possible; // possible validators
    address[] validators;
    uint8 confirmations;
  }
  mapping(uint256 => ValidatorData) validator_data; //marketId-> total amount of zcb validators can buy 
  mapping(address=> uint256) sale_data; //marketId-> total amount of zcb bought
  uint256 total_validator_bought; 
  ChainlinkClient VRFConsumer;

  struct CDP{
    mapping(address=>address) collateral_address; 
    mapping(address=>uint256) collateral_amount;
    mapping(address=>uint256) borrowed_amount; 
    uint256 total_debt; 
    uint256 total_collateral; //only usdc 
  }

  struct MarketPhaseData {
    bool duringAssessment;
    bool onlyReputable;
    bool resolved;
    uint256 min_rep_score;
    bool alive;
    bool atLoss;
    uint256 base_budget;
    uint8 confirmations;
    address validator; 
  }


  /// @param N: number of validators
  /// @param sigma: validators' stake
  /// @param alpha: managers' stake
  /// @param omega: high reputation's stake 
  /// @param delta: Upper and lower bound for price which is added/subtracted from alpha 
  /// @param r:  reputation ranking for onlyRep phase
  /// @dev omega always <= alpha
  struct MarketParameters{
    uint32 N;
    uint256 sigma; 
    uint256 alpha; 
    uint256 omega;
    uint256 delta; 
    uint256 r; 
  }


  modifier onlyController(){
    require(address(controller) == msg.sender || msg.sender == owner || msg.sender == address(this), "is not controller"); 
    _;
  }

  bool private _mutex;
  modifier _lock_() {
    require(!_mutex, "ERR_REENTRY");
    _mutex = true;
    _;
    _mutex = false;
  }

  constructor(
    address _creator_address,
    address reputationNFTaddress,  
    address _controllerAddress
  ) Owned(_creator_address){
    rep = ReputationNFT(reputationNFTaddress);
    controller = Controller(_controllerAddress); 

  }

  /*----Phase Functions----*/

  /// @notice list of parameters in this system for each market, should vary for each instrument 
  function set_parameters(
    MarketParameters memory param, 
    uint256 marketId 
    ) external onlyController{
    parameters[marketId] = param; 
  }

  /// @notice gets the top percentile reputation score threshold 
  function calcMinRepScore(uint256 marketId) internal view returns(uint256){
    return rep.getMinRepScore(parameters[marketId].r, marketId); 
  }

  /*
  called on market initialization by controller
  */
  function setMarketPhase(
    uint256 marketId, 
    bool duringAssessment,
    bool _onlyReputable,
    uint256 base_budget
  ) external  onlyController {
    MarketPhaseData storage data = restriction_data[marketId]; 
    data.onlyReputable = _onlyReputable; 
    data.duringAssessment = duringAssessment;
    data.min_rep_score = calcMinRepScore(marketId);
    data.base_budget = base_budget;
    data.alive = true;
    data.validator = address(0);
  }

  /**
   called by this when onlyRep => false.
   */
  function setReputationPhase(
    uint256 marketId,
    bool _onlyReputable
  ) internal {
    require(restriction_data[marketId].alive, "market must be alive");
    restriction_data[marketId].onlyReputable = _onlyReputable;
  }

  /**
   called by controller
   */
  function approveMarket(uint256 marketId) external onlyController {
    require(restriction_data[marketId].alive);
    require(restriction_data[marketId].duringAssessment);

    restriction_data[marketId].duringAssessment = false;    
  }

  /// @notice called by controller when market is initialized 
  function setUpperBound(
    uint256 marketId, 
    uint256 upper_bound
    ) external onlyController {
    BondingCurve(controller.getZCB_ad(marketId)).setUpperBound(upper_bound);
  }
    
  /// @notice called by controller when market is approved
  function setLowerBound(
    uint256 marketId, 
    uint256 lower_bound
    ) external onlyController {
    BondingCurve(controller.getZCB_ad(marketId)).setLowerBound(lower_bound);
  }

  /* 
  Called when market should end, a) when denied b) when maturity 
  */
  function deactivateMarket(uint256 marketId, bool atLoss) external  onlyController{
    restriction_data[marketId].resolved = true; 
    restriction_data[marketId].atLoss = atLoss; 
    restriction_data[marketId].alive = false; 

  }

  /*---View Functions---*/

  /* 
  Returns Minimal reputation score to participate in the onlyReputation phase
  TODO
  */
  function getMinRepScore(uint256 marketId) public view returns(uint256){
    return restriction_data[marketId].min_rep_score;
  }


  /* Conditions */
  
  /**
   @dev verification of trader initializes reputation score at 0, to gain reputation need to participate in markets.
   */
  function isVerified(address trader) public view returns(bool){
    return (controller.isVerified(trader) || trader == owner);
    //return (rep.balanceOf(trader) >= 1 || trader == owner); 
  }


  function isReputable(address trader, uint256 marketId) public view returns(bool){
    return (restriction_data[marketId].min_rep_score <= rep.getReputationScore(trader) || trader == owner); 
  }

  /*
  Returns true if during risk assessment phase
  */
  function duringMarketAssessment(
    uint256 marketId) public view returns(bool){
    return restriction_data[marketId].duringAssessment; 
  }

  /*
  Returns true when market only allows reputable traders
  */
  function onlyReputable(
    uint256 marketId
    ) public view returns(bool){
    return restriction_data[marketId].onlyReputable; 

  }

  function isMarketApproved(uint256 marketId) public view returns(bool){
    return(!restriction_data[marketId].duringAssessment && restriction_data[marketId].alive); 
    
  }

  function marketActive(uint256 marketId) public view returns(bool){
    return restriction_data[marketId].alive; 
  }

  /// @notice returns true if amount bought is greater than the insurance threshold
  function marketCondition(uint256 marketId) public view returns(bool){
    BondingCurve bc = BondingCurve(controller.getZCB_ad(marketId)); 
    uint256 principal = controller.getVault(marketId).fetchInstrumentData(marketId).principal;
    uint256 total_bought = bc.getTotalCollateral();

    return (total_bought>= principal.mulWadDown(parameters[marketId].alpha)); 
  }

  /// @notice returns whether current market is in phase 
  /// 1: onlyReputable, which also means market is in assessment
  /// 2: not onlyReputable but in asseessment 
  /// 3: in assessment but canbeapproved 
  /// 4: post assessment(accepted or denied )
  function getCurrentMarketPhase(uint256 marketId) public view returns(uint256){
    if (onlyReputable(marketId)){
      assert(!marketCondition(marketId) && !isMarketApproved(marketId) && duringMarketAssessment(marketId) ); 
      return 1; 
    }

    else if (duringMarketAssessment(marketId) && !onlyReputable(marketId)){
      assert(!isMarketApproved(marketId)); 
      if (marketCondition(marketId)) return 3; 
      return 2; 
    }

    else if (isMarketApproved( marketId)){
      assert (!duringMarketAssessment(marketId) && marketCondition(marketId)); 
      return 4; 
    }

  }


  function getDebtPosition(address trader, uint256 marketId) public view returns(uint256, uint256){
    CDP storage cdp = debt_pools[marketId];
    return (cdp.collateral_amount[trader], cdp.borrowed_amount[trader]);
  }

  /// @notice get trade budget = f(reputation), returns in collateral_dec
  /// sqrt for now 
  function getTraderBudget(uint256 marketId, address trader) public view returns(uint256){
    uint256 repscore = rep.getReputationScore(trader); 
    uint256 collateral_dec =  BondingCurve(controller.getZCB_ad(marketId)).collateral_dec(); 

    //convert to collateral_decimals 
    return restriction_data[marketId].base_budget + (repscore*config.WAD).sqrt();
  }
  
  /// @notice computes the price for ZCB one needs to short at to completely
  /// hedge for the case of maximal loss, function of principal and interest
  function getHedgePrice(uint256 marketId) public view returns(uint256){
    uint256 principal = controller.getVault(marketId).fetchInstrumentData(marketId).principal; 
    uint256 yield = controller.getVault(marketId).fetchInstrumentData(marketId).expectedYield; 
    uint256 den = principal.mulWadDown(config.WAD - parameters[marketId].alpha); 
    return config.WAD - yield.divWadDown(den); 
    // uint256 den = (principal * (PRICE_PRECISION - parameters[marketId].alpha))/PRICE_PRECISION; 
    // return PRICE_PRECISION -  (yield*PRICE_PRECISION)/den;

  }

  function getParameters(uint256 marketId) public view returns(MarketParameters memory){
    return parameters[marketId]; 
  }

  /// @notice computes maximum amount of quantity that trader can short while being hedged
  /// such that when he loses his loss will be offset by his gains  
  function getHedgeQuantity(address trader, uint256 marketId) public view returns(uint256){
    uint num = controller.getVault(marketId).fetchInstrumentData(marketId)
              .principal.mulWadDown(config.WAD - parameters[marketId].alpha); 
    return num.mulDivDown(controller.getVault(marketId).balanceOf(trader), 
              controller.getVault(marketId).totalSupply()); 
  } 

  
  function canBuy(
    address trader,
    uint256 amount, //this is in DS with decimals.
    uint256 marketId
  ) public view returns(bool, uint) {
    //If after assessment there is a set buy threshold, people can't buy above this threshold
    require(marketActive(marketId), "Market Not Active"); // this is not correct since marketDenied set to false by default.

    BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));

    //If called from shortZCB contract should b 
    if (isShortZCB[marketId][msg.sender]){
      return (true, 0); 
    }

    bool _duringMarketAssessment = duringMarketAssessment(marketId);
    bool _onlyReputable =  onlyReputable(marketId);

    if (_duringMarketAssessment){
      if (!isVerified(trader) || !(getTraderBudget(marketId, trader)>= amount)) return (false, 0); 
  
    }

    //During the early risk assessment phase only reputable can buy 
    if (_onlyReputable){
      require(_duringMarketAssessment, "Market needs to be in assessment phase"); 
      if (!isReputable(trader, marketId)){ 
        console.log('notreputable'); 
        return (false, 1); 
      }
    }


    return (true, 0); 

  }


  /// @notice amount is in zcb_amount_in
  function canSell(
    address trader,
    uint256 amount, 
    uint256 marketId
  ) internal view returns(bool) {
    require(marketActive(marketId), "Market Not Active");
    BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));

    // For current onchain conditions, the estimated collateral 
    // trader would obtain should be less than budget  
    if (!(getTraderBudget(marketId, trader) >= zcb.calculateSaleReturn(amount))) return false; 
    
    return true; 
  }


  
  /// @notice During assessment phase, need to log the trader's 
  /// total collateral when he bought zcb. Trader can only redeem collateral in 
  /// when market is not approved 
  function log_assessment_trade(
    uint256 marketId, 
    address trader, 
    uint256 collateralIn,
    uint256 probability
    )
    internal 
  { 
    assessment_trader[marketId][trader] = true; 
    assessment_collaterals[marketId][trader] = collateralIn;
    assessment_probs[marketId][trader] = probability; 
  }


  /// @notice denies market from validator 
  function denyMarket(
    uint256 marketId
  ) external  onlyController {
    require(marketActive(marketId), "Market Not Active"); 
    require(restriction_data[marketId].duringAssessment, "Not in assessment"); 
    MarketPhaseData storage data = restriction_data[marketId]; 
    data.resolved = true; 
    data.duringAssessment = false;
  }


  ///VALIDATOR FUNCTIONS 

  /// @notice called when market initialized, calculates the average price and quantities of zcb
  /// validators will buy at a discount when approving 
  function set_validator_cap(
    uint256 marketId,
    uint256 principal,
    uint256 interest) external onlyController{
    BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId))); // SOMEHOW GET ZCB
    assert(config.isInWad(parameters[marketId].sigma) && config.isInWad(principal));

    uint256 valColCap = (parameters[marketId].sigma.mulWadDown(principal)); 
    uint256 disCap = zcb.get_discount_cap(); 
    uint256 avgPrice = valColCap.divWadDown(disCap);

    validator_data[marketId].val_cap = disCap; 
    validator_data[marketId].avg_price = avgPrice; 
  }

  function setVRFConsumer(address consumer) external onlyOwner {
    VRFConsumer = ChainlinkClient(consumer);
  }

  function isValidator(uint256 marketId, address user) public returns(bool){
    address[] storage _validators = validator_data[marketId].validators;
    for (uint i = 0; i < _validators.length; i++) {
      if (_validators[i] == user) {
        return true;
      }
    }
    return false;
  }

  function confirmMarket(uint256 marketId, address user) public onlyController {
    require(isValidator(marketId, user), "must be validator");
    require(validator_data[marketId].confirmations < parameters[marketId].N, "confirmations exceeds number of required validators");

    _removeValidator(marketId, user);
    validator_data[marketId].confirmations++;
  }

  function isConfirmed(uint256 marketId) public returns (bool) {
    return parameters[marketId].N == validator_data[marketId].confirmations;
  }

  function _removeValidator(uint256 marketId, address user) internal {
    address[] storage arr = validator_data[marketId].validators;
    uint256 length = arr.length;
    
    for (uint i = 0; i < length; i++) {
      if (user == arr[i]) {
        arr[i] = arr[length - 1];
        arr.pop();
        return;
      }
    }
  }


  mapping(uint256=>mapping(address=>bool)) marketValidators; 

  function testSetValidator(uint256 marketId, address validator) public onlyOwner{
    marketValidators[marketId][validator] = true; 
  }

  function _isValidator(uint256 marketId, address validator) public view returns(bool){
    return marketValidators[marketId][validator]; 
  }

  function initializeValidatorRandomness(uint256 marketId) public {
    require(restriction_data[marketId].alive, "market must be alive");
    require(restriction_data[marketId].duringAssessment, "market must be during assessment");
    VRFConsumer.requestRandomWords(parameters[marketId].N);
  }

  function setValidators(uint256 marketId) public {
    require(restriction_data[marketId].alive, "market must be alive");
    require(restriction_data[marketId].duringAssessment, "market must be during assessment");
    require(VRFConsumer.wordLength() == parameters[marketId].N, "retrieve numbers");
    
    if (validator_data[marketId].possible.length < parameters[marketId].N) {
      validator_data[marketId].validators = validator_data[marketId].possible;
      return;
    }

    uint256[] memory randomNums = VRFConsumer.getNums();
    address[] memory temp = validator_data[marketId].possible;
    uint256 _N = parameters[marketId].N;
    uint256 length = _N;

    for (uint8 i = 0; i < _N; i++) {
      uint j = randomNums[i] % length;
      address selected = temp[j];
      validator_data[marketId].validators.push(selected);
      temp[j] = temp[length - 1];
      length--;
    }
  }

  /// @notice allows validators to buy at a discount 
  /// @dev get val_cap, the total amount of zcb for sale and each validators should buy 
  /// val_cap/num validators zcb 
  function validator_buy(uint256 marketId, address validator) external 
//onlyValidator 
  {
    require(marketCondition(marketId), "Market can't be approved"); 
    BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId))); // SOMEHOW GET ZCB

    uint256 val_cap =  validator_data[marketId].val_cap; 
    uint256 zcb_for_sale = val_cap/parameters[marketId].N; 
    uint256 collateral_required = zcb_for_sale.mulWadDown(validator_data[marketId].avg_price); 

    require(sale_data[validator] <= zcb_for_sale, "Already approved"); 

    sale_data[validator] += zcb_for_sale; 
    total_validator_bought += zcb_for_sale; 

    ERC20(zcb.getCollateral()).transferFrom(validator, address(zcb), collateral_required); 
    zcb.trustedDiscountedMint(validator, zcb_for_sale);
  }

  function validator_can_approve(uint256 marketId ) public view returns(bool){
    return(total_validator_bought >= validator_data[marketId].val_cap); 
  }




  /// @notice main entry point for longZCB buys
  /// @param _min_amount_out is min quantity of ZCB returned
  function buy(
      uint256 _marketId,
      uint256 _collateralIn,
      uint256 _min_amount_out
    ) external _lock_ returns (uint256 amountOut){
    require(!restriction_data[_marketId].resolved, "must not be resolved");
    (bool canbuy, uint256 error) = canBuy(msg.sender, _collateralIn, _marketId); 
    if(!canbuy) console.log('error', error); 
    require(canbuy,"Trade Restricted");

    BondingCurve zcb = BondingCurve(controller.getZCB_ad(_marketId)); // SOMEHOW GET ZCB

    //Need to log assessment trades for updating reputation scores or returning collateral
    //when market denied 
    if (duringMarketAssessment(_marketId)){

      // keep track of amount bought during reputation phase
      // and make transitions from onlyReputation true->false
      if(onlyReputable(_marketId)){
        uint256 principal = controller.getVault(_marketId).fetchInstrumentData(_marketId).principal;
        uint256 total_bought = zcb.getTotalCollateral();

        // first time rep user buying.
        if (!assessment_trader[_marketId][msg.sender]) {
          validator_data[_marketId].possible.push(msg.sender);
        }

        if (total_bought >= parameters[_marketId].omega.mulWadDown(principal)) 
        {setReputationPhase(_marketId, false);}
      } 

      log_assessment_trade(
        _marketId,
          msg.sender, 
        _collateralIn, 
        zcb.calcImpliedProbability(
        _collateralIn, 
        getTraderBudget(_marketId, msg.sender) 
        )
      );
      
    }

    amountOut = zcb.trustedBuy(msg.sender, _collateralIn, _min_amount_out);

  }


  function sell(
      uint256 _marketId,
      uint256 _zcb_amount_in, 
      uint256 _min_collateral_out
    ) external _lock_ returns (uint256 amountOut){
    require(!restriction_data[_marketId].resolved, "must not be resolved");
    require(canSell(msg.sender, 
      _zcb_amount_in, 
      _marketId),"Trade Restricted");

    BondingCurve zcb = BondingCurve(controller.getZCB_ad(_marketId)); // SOMEHOW GET ZCB
    amountOut = zcb.trustedSell(msg.sender, _zcb_amount_in, _min_collateral_out);


    if (duringMarketAssessment(_marketId)) deduct_selling_fee(); 
  }

  function deduct_selling_fee() internal {}


  ///// Shorting logic  /////
  mapping(uint256=>mapping(address=>bool)) isShortZCB; //marketId-> address-> isshortZCB
  mapping(uint256=>address) shortZCBs; 
  mapping(uint256=>mapping(address=>uint256) )assessment_shorts; 


  function add_short_zcb(
    uint256 marketId,
    address shortZCB_address
  ) external onlyController{
    isShortZCB[marketId][shortZCB_address] = true;
    shortZCBs[marketId] = shortZCB_address;

    BondingCurve(controller.getZCB_ad(marketId)).setShortZCB(shortZCB_address); 

  }

  function openShort(
    uint256 marketId,
    uint256 collateralIn, 
    uint256 min_amount_out
    ) external _lock_ {

    if (duringMarketAssessment(marketId)){
      log_assessment_shorts(marketId, msg.sender, collateralIn); 
    }
    ShortBondingCurve shortZCB = ShortBondingCurve(shortZCBs[marketId]); 

    (uint lendAmount, uint c) = shortZCB.calculateAmountGivenSell(collateralIn); 

    lendForShort(marketId, lendAmount);

    if (duringMarketAssessment(marketId)) deduct_selling_fee(); 

    shortZCB.trustedShort(msg.sender, collateralIn, min_amount_out); 

  }

  /// @notice called when short is being opened, it allows shortZCB contract to 
  /// "borrow" by minting new ZCB to the shortZCB contract. 
  /// @dev although minting new zcb is different from borrowing from existing zcb holders, 
  /// in the context of our bonding curve prediction 
  /// market this is alllowed since we just dont allow longZCB holders 
  /// to sell when liquidity dries up   
  function lendForShort(
    uint256 marketId, 
    uint256 requested_zcb
    ) internal {
    BondingCurve zcb = BondingCurve(controller.getZCB_ad(marketId));

    // Log debt data 
    CDP storage cdp = debt_pools[marketId];
    cdp.collateral_amount[msg.sender] += requested_zcb; 
    cdp.borrowed_amount[msg.sender] += requested_zcb;  
    cdp.total_debt += requested_zcb; 
    cdp.total_collateral += requested_zcb; //only ds 
    collateral_pot[marketId] += requested_zcb; //Total ds collateral 

    zcb.trustedDiscountedMint(shortZCBs[marketId], requested_zcb); 

  }
   function repayForShort(
    uint256 marketId, 
    uint256 repaying_zcb
    ) internal {
    BondingCurve zcb = BondingCurve(controller.getZCB_ad(marketId)); // SOMEHOW GET ZCB

    CDP storage cdp = debt_pools[marketId];
    cdp.collateral_amount[msg.sender] -= repaying_zcb; 
    cdp.borrowed_amount[msg.sender] -= repaying_zcb; 
    cdp.total_debt -= repaying_zcb; 
    cdp.total_collateral -= repaying_zcb; 
    collateral_pot[marketId] -= repaying_zcb;

  }
  /// @param close_amount is in of shortZCB, 18dec 
  function closeShort(
    uint256 marketId, 
    uint256 close_amount, 
    uint256 min_collateral_out
    ) external _lock_ {


    ShortBondingCurve shortZCB = ShortBondingCurve(shortZCBs[marketId]);

    repayForShort(marketId, close_amount);

    // This will buy close_amount worth of longZCB to the shortZCB contract 
    (uint256 returned_collateral, uint256 tokenToBeBurned) = shortZCB.trustedClose(msg.sender, close_amount, min_collateral_out);  
 
    if(duringMarketAssessment(marketId)){

      assessment_shorts[marketId][msg.sender] -= returned_collateral;  
    }
    console.log('roundings', tokenToBeBurned, close_amount);
    // Now burn the contract's bought longZCB imediately  
    BondingCurve(controller.getZCB_ad(marketId)).trustedDiscountedBurn(shortZCBs[marketId], tokenToBeBurned);


  }

  function log_assessment_shorts(uint256 marketId, address trader, uint256 collateralIn) internal {
    assessment_shorts[marketId][trader] += collateralIn; 
  }


  /// @notice called by traders when market is resolved  
  function redeemShortZCB(
    uint256 marketId 
    ) external _lock_ returns(uint256){
    require(!marketActive(marketId), "Market Active"); 
    LinearShortZCB shortZCB = LinearShortZCB(shortZCBs[marketId]);
    uint256 shortZCB_redeem_amount = shortZCB.balanceOf(msg.sender); 
    shortZCB.trustedBurn(msg.sender, shortZCB_redeem_amount); 
    assert(controller.getVault(marketId).balanceOf(address(shortZCB))==0);

    uint256 long_redemption_price = get_redemption_price(marketId);
    uint256 redemption_price = long_redemption_price >= config.WAD? 0 : 
          config.WAD - long_redemption_price; 
    uint256 collateral_redeem_amount = redemption_price.mulWadDown(shortZCB_redeem_amount); 

    controller.redeem_mint(collateral_redeem_amount, msg.sender, marketId); 
    return collateral_redeem_amount; 
  }

  /// @notice called by assessment traders when market is denied 
  function redeemDeniedMarket(
    uint256 marketId, 
    bool isLong) 
  public _lock_{
    require(!restriction_data[marketId].alive, "Market Still During Assessment");
    require(!redeemed[marketId][msg.sender], "Already Redeemed"); 
    redeemed[marketId][msg.sender] = true; 
    uint256 collateral_amount;
    if(!isLong){
      ShortBondingCurve shortZCB = ShortBondingCurve(shortZCBs[marketId]);
      collateral_amount = assessment_shorts[marketId][msg.sender];
      assessment_shorts[marketId][msg.sender] = 0; 
      shortZCB.trustedBurn( msg.sender,  shortZCB.balanceOf(msg.sender));
    }

    else{
      BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
      collateral_amount = assessment_collaterals[marketId][msg.sender]; 
      assessment_collaterals[marketId][msg.sender] = 0; 
      zcb.trustedBurn(msg.sender, zcb.balanceOf(msg.sender)); 
    }

    controller.redeem_mint(collateral_amount, msg.sender, marketId); 

  }



  /*Maturity Functions */


  function get_redemption_price(uint256 marketId) public view returns(uint256){
    return redemption_prices[marketId]; 
  }

  /**
  @dev Redemption price, as calculated (only once) at maturity,
  depends on total_repayed/(principal + predetermined yield)
  If total_repayed = 0, redemption price is 0
  @param atLoss: defines circumstances where expected returns are higher than actual
  @param loss: facevalue - returned amount => non-negative always?
  @param extra_gain: any extra yield not factored during assessment. Is 0 yield is as expected
   */
  function update_redemption_price(
    uint256 marketId,
    bool atLoss, 
    uint256 extra_gain, 
    uint256 loss
  ) external  onlyController {  
    if (atLoss) assert(extra_gain == 0); 
    assert(debt_pools[marketId].total_debt 
        == ShortBondingCurve(shortZCBs[marketId]).totalSupply()); 
    BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId))); // SOMEHOW GET ZCB

    uint256 total_supply = zcb.getTotalZCB(); 
    uint256 total_shorts = (extra_gain >0) ? debt_pools[marketId].total_debt :0; 

    if(!atLoss){
      redemption_prices[marketId] = config.WAD + 
                extra_gain.divWadDown(total_supply+total_shorts); 
    }
    else{
      if (config.WAD <=  loss.divWadDown(total_supply)){
        redemption_prices[marketId] = 0; 
      }
      else{
        redemption_prices[marketId] = config.WAD - loss.divWadDown(total_supply); 
      }
    }

  }


  /* 
  @notice trader will redeem entire balance of ZCB
  Needs to be called at maturity, market needs to be resolved first(from controller)
  */
  function redeem(
    uint256 marketId
  ) public _lock_ returns(uint256){
    require(!marketActive(marketId), "Market Active"); 
    require(restriction_data[marketId].resolved, "Market not resolved"); 
    require(!redeemed[marketId][msg.sender], "Already Redeemed");
    redeemed[marketId][msg.sender] = true; 

    if (_isValidator(marketId, msg.sender)) sale_data[msg.sender] = 0; 

    BondingCurve zcb = BondingCurve(address(controller.getZCB(marketId)));
    assert(controller.getVault(marketId).balanceOf(address(zcb))==0);

    uint256 zcb_redeem_amount = zcb.balanceOf(msg.sender); 
    zcb.trustedBurn(msg.sender, zcb_redeem_amount); 

    uint256 redemption_price = get_redemption_price(marketId); 
    require(redemption_price > 0, "Redeem price is 0");
    uint256 collateral_redeem_amount = redemption_price.mulWadDown(zcb_redeem_amount); 

    controller.redeem_mint(collateral_redeem_amount, msg.sender, marketId); 
    if (redemption_price >= PRICE_PRECISION && !_isValidator(marketId, msg.sender)) {
      controller.updateReputation(marketId, msg.sender);
    }
    return collateral_redeem_amount; 

  }








}

