pragma solidity ^0.8.4;

import "./reputationtoken.sol"; 
import {Controller} from "./controller.sol";
import {ERC20} from "solmate/src/tokens/ERC20.sol";
import "hardhat/console.sol";
import {SafeTransferLib} from "solmate/src/utils/SafeTransferLib.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import {VRFConsumerBaseV2} from "../chainlink/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "../chainlink/VRFCoordinatorV2Interface.sol";
import {config} from "../utils/helpers.sol";
import {SyntheticZCBPool} from "../bonds/synthetic.sol"; 
import {ERC4626} from "../vaults/mixins/ERC4626.sol";
import {Vault} from "../vaults/vault.sol"; 

contract MarketManager 
 // VRFConsumerBaseV2 
 {
  using FixedPointMathLib for uint256;
  using SafeTransferLib for ERC20;

  // Chainlink state variables
  VRFCoordinatorV2Interface COORDINATOR;
  uint64 private immutable subscriptionId;
  bytes32 private keyHash;
  uint32 private callbackGasLimit = 100000;
  uint16 private requestConfirmations = 3;
  uint256 total_validator_bought; // should be a mapping no?
  bool private _mutex;

  // ReputationNFT repToken;
  Controller controller;
  CoreMarketData[] public markets;
  address public owner; 

  // mapping(uint256 => uint256) requestToMarketId; // chainlink request id to marketId
  // mapping(uint256 => ValidatorData) validator_data;
  mapping(uint256=>uint256) private redemption_prices; //redemption price for each market, set when market resolves 
  mapping(uint256=>mapping(address=>uint256)) private assessment_prices; 
  mapping(uint256=>mapping(address=>bool)) private assessment_trader;
  mapping(uint256=>mapping(address=>uint256) ) public assessment_probs; 
  mapping(uint256=> MarketPhaseData) public restriction_data; // market ID => restriction data
  mapping(uint256=> MarketParameters) public parameters; //marketId-> params
  mapping(uint256=> mapping(address=>bool)) private redeemed; 
  mapping(uint256=> mapping(address=>uint256)) public longTrades; 
  mapping(uint256=> mapping(address=>uint256)) public shortTrades;
  mapping(uint256=> uint256) public loggedCollaterals;

  struct CoreMarketData {
    SyntheticZCBPool bondPool; 
    ERC20 longZCB;
    ERC20 shortZCB; 
    string description; // instrument description
    uint256 creationTimestamp;
    uint256 resolutionTimestamp;
    bool isPool; 
  }

  struct MarketPhaseData {
    bool duringAssessment;
    bool onlyReputable;
    bool resolved;
    bool alive;
    bool atLoss;
    // uint256 min_rep_score;
    uint256 base_budget;
  }

  // struct ValidatorData{
  //   mapping(address => uint256) sales; // amount of zcb bought per validator
  //   mapping(address => bool) staked; // true if address has staked vt (approved)
  //   mapping(address => bool) resolved; // true if address has voted to resolve the market
  //   address[] validators;
  //   uint256 val_cap;// total zcb validators can buy at a discount
  //   uint256 avg_price; //price the validators can buy zcb at a discount 
  //   bool requested; // true if already requested random numbers from array.
  //   uint256 totalSales; // total amount of zcb bought;
  //   uint256 totalStaked; // total amount of vault token staked.
  //   uint256 numApproved;
  //   uint256 initialStake; // amount staked
  //   uint256 finalStake; // amount of stake recoverable post resolve
  //   uint256 unlockTimestamp; // creation timestamp + duration.
  //   uint256 numResolved; // number of validators calling resolve on early resolution.
  // }

  /// @param N: upper bound on number of validators chosen.
  /// @param sigma: validators' stake
  /// @param alpha: minimum managers' stake
  /// @param omega: high reputation's stake 
  /// @param delta: Upper and lower bound for price which is added/subtracted from alpha 
  /// @param r: reputation percentile for reputation constraint phase
  /// @param s: senior coefficient; how much senior capital the managers can attract at approval 
  /// @param steak: steak*approved_principal is the staking amount.
  /// param beta: how much volatility managers are absorbing 
  /// param leverage: how much leverage managers can apply 
  /// param base_budget: higher base_budget means lower decentralization, 
  /// @dev omega always <= alpha
  struct MarketParameters{
    uint256 N;
    uint256 sigma; 
    uint256 alpha; 
    uint256 omega;
    uint256 delta; 
    uint256 r;
    uint256 s;
    uint256 steak;
  }

  modifier onlyController(){
    require(address(controller) == msg.sender || msg.sender == owner || msg.sender == address(this), "is not controller"); 
    _;
  }

  modifier onlyControllerOwnerInternal(){
    require(address(controller) == msg.sender || msg.sender == owner || msg.sender == address(this), "is not controller"); 
    _;
  }

  modifier _lock_() {
    require(!_mutex, "ERR_REENTRY");
    _mutex = true;
    _;
    _mutex = false;
  }

  constructor(
    address _creator_address,
    address _controllerAddress,
    address _vrfCoordinator, // 0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed
    bytes32 _keyHash, // 0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f
    uint64 _subscriptionId // 1713, 
  ) 
    //VRFConsumerBaseV2(0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed) 
  {
    controller = Controller(_controllerAddress);
    keyHash = bytes32(0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f);
    subscriptionId = 1713;
    COORDINATOR = VRFCoordinatorV2Interface(0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed);
    
    // push empty market
    markets.push(
      makeEmptyMarketData()
    );

    owner = msg.sender; 
  }

  function makeEmptyMarketData() public pure returns (CoreMarketData memory) {
    return CoreMarketData(
        SyntheticZCBPool(address(0)),
        ERC20(address(0)),
        ERC20(address(0)),
        "",
        0,
        0, 
        false
      );
  }    

  function marketCount() public view returns (uint256) {
    return markets.length;
  }

  function getMarket(uint256 _id) public view returns (CoreMarketData memory) {
    if (_id >= markets.length) {
        return makeEmptyMarketData();
    } else {
        return markets[_id];
    }
  }

  /// @notice parameters have to be set prior 
  function newMarket(
    uint256 marketId,
    SyntheticZCBPool bondPool,  
    address _longZCB, 
    address _shortZCB, 
    string calldata _description, 
    // uint256 _duration, 
    bool isPool
    ) external onlyController {
    uint256 creationTimestamp = block.timestamp;

    markets.push(CoreMarketData(
      bondPool, 
      ERC20(_longZCB),
      ERC20(_shortZCB),  
      _description,
      creationTimestamp,
      0, //TODO resolution timestamp, 
      isPool 
    ));

    uint256 base_budget = 1000 * config.WAD; //TODO 
    setMarketPhase(marketId, true, true, base_budget);

   // _validatorSetup(marketId, principal, creationTimestamp, _duration, isPool);
  }


  /*----Phase Functions----*/

  /// @notice list of parameters in this system for each market, should vary for each instrument 
  /// @dev calculates market driven s from utilization rate. If u-r high,  then s should be low, as 1) it disincentivizes 
  /// managers to approving as more proportion of the profit goes to the LP, and 2) disincentivizes the borrower 
  /// to borrow as it lowers approved principal and increases interest rate 
  function setParameters(
    MarketParameters memory param,
    uint256 utilizationRate,
    uint256 marketId 
    ) public onlyControllerOwnerInternal{
    parameters[marketId] = param; 
    parameters[marketId].s = param.s.mulWadDown(config.WAD - utilizationRate); // experiment
  }

  /**
   @dev in the event that the number of traders in X percentile is less than the specified number of validators
   parameter N is changed to reflect this
   */
  function setN(uint256 marketId, uint256 _N) public onlyController {
    parameters[marketId].N = _N;
  }

  /// @notice sets market phase data
  /// @dev called on market initialization by controller
  /// @param base_budget: base budget (amount of vault tokens to spend) as a market manager during the assessment stage
  function setMarketPhase(
    uint256 marketId, 
    bool duringAssessment,
    bool _onlyReputable,
    uint256 base_budget
    ) public onlyControllerOwnerInternal{
    MarketPhaseData storage data = restriction_data[marketId]; 
    data.onlyReputable = _onlyReputable; 
    data.duringAssessment = duringAssessment;
    // data.min_rep_score = calcMinRepScore(marketId);
    data.base_budget = base_budget;
    data.alive = true;
  }

  /// @notice used to transition from reputationphases 
  function setReputationPhase(
    uint256 marketId,
    bool _onlyReputable
  ) public onlyControllerOwnerInternal {
    require(restriction_data[marketId].alive, "market must be alive");
    restriction_data[marketId].onlyReputable = _onlyReputable;
  }

  /// @notice Called when market should end, a) when denied b) when maturity 
  /// @param resolve is true when instrument does not resolve prematurely
  function deactivateMarket(
    uint256 marketId, 
    bool atLoss, 
    bool resolve) public onlyControllerOwnerInternal{
    restriction_data[marketId].resolved = resolve; 
    restriction_data[marketId].atLoss = atLoss; 
    restriction_data[marketId].alive = false;
  } 

  /// @notice called by validator only
  function denyMarket(
    uint256 marketId
  ) external onlyController {
    //TODO should validators be able to deny even though they've approved.
    require(marketActive(marketId), "Market Not Active"); 
    require(restriction_data[marketId].duringAssessment, "Not in assessment");
    MarketPhaseData storage data = restriction_data[marketId]; 
    data.alive = false;
    data.resolved = true;
  }

  /// @notice main approval function called by controller
  /// @dev if market is alive and market is not during assessment, it is approved. 
  function approveMarket(uint256 marketId) onlyController external {
    require(restriction_data[marketId].alive, "phaseERR");
    restriction_data[marketId].duringAssessment = false;    
  }

  function getPhaseData(
    uint256 marketId
  ) public view returns (MarketPhaseData memory)  {
    return restriction_data[marketId];
  }
  
  function isInstrumentPool(uint256 marketId) external view returns(bool){
    return markets[marketId].isPool; 
  }
  
  /// @dev verification of trader initializes reputation score at 0, to gain reputation need to participate in markets.
  function isVerified(address trader) public view returns(bool){
    return (controller.isVerified(trader) || trader == owner);
  }

  function isReputable(address trader, uint256 marketId) public view returns(bool){
    // return (restriction_data[marketId].min_rep_score <= controller.trader_scores(trader) || trader == owner); 
    return (controller.isReputable(trader, parameters[marketId].r)) || trader == owner;
  }

  function duringMarketAssessment(uint256 marketId) public view returns(bool){
    return restriction_data[marketId].duringAssessment; 
  }

  function onlyReputable(uint256 marketId) public view returns(bool){
    return restriction_data[marketId].onlyReputable; 
  }

  function isMarketApproved(uint256 marketId) public view returns(bool){
    return(!restriction_data[marketId].duringAssessment && restriction_data[marketId].alive);  
  }

  function marketActive(uint256 marketId) public view returns(bool){
    return restriction_data[marketId].alive; 
  }

  function marketResolved(uint256 marketId) public view returns (bool) {
    return restriction_data[marketId].resolved;
  }

  /// @notice returns true if amount bought is greater than the insurance threshold
  function marketCondition(uint256 marketId) public view returns(bool){
    if (markets[marketId].isPool){
      return (loggedCollaterals[marketId] >=
         controller.getVault(marketId).fetchInstrumentData(marketId).poolData.saleAmount); 
    }
    else{
      uint256 principal = controller.getVault(marketId).fetchInstrumentData(marketId).principal;
      return (loggedCollaterals[marketId] >= principal.mulWadDown(parameters[marketId].alpha));
    }
  }

  /// @notice returns whether current market is in phase 
  /// 1: onlyReputable, which also means market is in assessment
  /// 2: not onlyReputable but in asseessment 
  /// 3: in assessment but canbeapproved 
  /// 4: post assessment(accepted or denied), amortized liquidity 
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

  /// @notice get trade budget = f(reputation), returns in collateral_dec
  /// sqrt for now
  function getTraderBudget(uint256 marketId, address trader) public view returns(uint256){
    //uint256 repscore = repToken.getReputationScore(trader); 
    uint256 repscore = controller.trader_scores(trader);
    
    if (repscore==0) return 0; 

    return restriction_data[marketId].base_budget + (repscore*config.WAD).sqrt();
  }
  
  /// @notice computes the price for ZCB one needs to short at to completely
  /// hedge for the case of maximal loss, function of principal and interest
  function getHedgePrice(uint256 marketId) public view returns(uint256){
    uint256 principal = controller.getVault(marketId).fetchInstrumentData(marketId).principal; 
    uint256 yield = controller.getVault(marketId).fetchInstrumentData(marketId).expectedYield; 
    uint256 den = principal.mulWadDown(config.WAD - parameters[marketId].alpha); 
    return config.WAD - yield.divWadDown(den); 
  }

  /// @notice computes maximum amount of quantity that trader can short while being hedged
  /// such that when he loses his loss will be offset by his gains  
  function getHedgeQuantity(address trader, uint256 marketId) public view returns(uint256){
    uint num = controller.getVault(marketId).fetchInstrumentData(marketId)
              .principal.mulWadDown(config.WAD - parameters[marketId].alpha); 
    return num.mulDivDown(controller.getVault(marketId).balanceOf(trader), 
              controller.getVault(marketId).totalSupply()); 
  }

  function getParameters(uint256 marketId) public view returns(MarketParameters memory){
    return parameters[marketId]; 
  }

  function getPool(uint256 marketId) public view returns(SyntheticZCBPool){
    return markets[marketId].bondPool; 
  }

  function getZCB(uint256 marketId) public view returns (ERC20) {
    return markets[marketId].longZCB;
  }

  function getShortZCB(uint256 marketId) public view returns (ERC20) {
    return markets[marketId].shortZCB;
  }
  
  function get_redemption_price(uint256 marketId) public view returns(uint256){
    return redemption_prices[marketId]; 
  }

  function getBondPool(uint256 marketId) public view returns(SyntheticZCBPool){
    return markets[marketId].bondPool; 
  }

  /// @notice whether new longZCB can be issued 
  function _canIssue(
    address trader,
    int256 amount,
    uint256 marketId
    ) internal view {
    if(queuedRepUpdates[trader] > queuedRepThreshold)
      revert("repToken queue threshold"); 

    if (!isVerified(trader)) 
      revert("not verified");

    if (getTraderBudget(marketId, trader) <= uint256(amount))
      revert("budget limit");

    if (controller.trader_scores(trader) == 0)
      revert("Reputation 0"); 
  }

  /// @notice performs checks for buy function
  /// @param amount: collateral used to buy ZCB.
  function _canBuy(
    address trader,
    int256 amount,
    uint256 marketId
  ) internal view {
    //If after assessment there is a set buy threshold, people can't buy above this threshold
    require(marketActive(marketId), "Market Not Active");

    // TODO: check if this is correct
    // require(controller.getVault(marketId).fetchInstrumentData(marketId).maturityDate > block.timestamp, "market maturity reached");

    bool _duringMarketAssessment = duringMarketAssessment(marketId);
    bool _onlyReputable =  onlyReputable(marketId);

    if(amount>0){
      if (_duringMarketAssessment){
        _canIssue(trader, amount, marketId); 
      }
    }

    //During the early risk assessment phase only reputable can buy 
    if (_onlyReputable){
      if (!isReputable(trader, marketId)){
        revert("insufficient reputation");
      }
    }
  }

  /// @notice amount is in zcb_amount_in TODO 
  function _canSell(
    address trader,
    uint256 amount, 
    uint256 marketId
  ) internal view returns(bool) {
    require(marketActive(marketId), "Market Not Active");

    //TODO: check if this is correct
    // require(controller.getVault(marketId).fetchInstrumentData(marketId).maturityDate > block.timestamp, "market maturity reached");

    if(duringMarketAssessment(marketId)) {
      // restrict attacking via disapproving the utilizer by just shorting a bunch
     // if(amount>= hedgeAmount) return false; 

      //else return true;
    }
    else{
      // restrict naked CDS amount
      
      // 
    } 

    return true; 
  }

  // VALIDATOR FUNCTIONS

  /**
   @notice called when the validator votes to approve the market => stakes vt + recieves discounted ZCB
   the staked amount goes to the controller while the discounted ZCB goes to the market manager.
   */
  function validatorApprove(
    uint256 marketId, 
    uint256 collateral_required,
    uint256 zcb_for_sale,
    address validator
  ) external onlyController {
    loggedCollaterals[marketId] += collateral_required;
    SyntheticZCBPool bondPool = getBondPool(marketId); 
    bondPool.BaseToken().transferFrom(validator, address(bondPool), collateral_required); 
    bondPool.trustedDiscountedMint(validator, zcb_for_sale);
  }

  // function viewValidators(uint256 marketId) view public returns (address[] memory) {
  //   return validator_data[marketId].validators;
  // }

  // function getNumApproved(uint256 marketId) view public returns (uint256) {
  //   return validator_data[marketId].numApproved;
  // }

  // function getNumResolved(uint256 marketId) view public returns (uint256) {
  //   return validator_data[marketId].numResolved;
  // }

  // function getTotalStaked(uint256 marketId) view public returns (uint256) {
  //   return validator_data[marketId].totalStaked;
  // }

  // function getInitialStake(uint256 marketId) view public returns (uint256) {
  //   return validator_data[marketId].initialStake;
  // }

  // function getFinalStake(uint256 marketId) view public returns (uint256) {
  //   return validator_data[marketId].finalStake;
  // }

  // /**
  //  @notice randomly choose validators for market approval, async operation => fulfillRandomness is the callback function.
  //  @dev for now called on market initialization
  //  */
  // function _getValidators(uint256 marketId) public {
  //   // retrieve traders that meet requirement.
  //   (address instrument, address utilizer) = controller.market_data(marketId);
  //   address[] memory selected = controller.filterTraders(parameters[marketId].r, utilizer);

  //   if (selected.length <= parameters[marketId].N) {
  //     validator_data[marketId].validators = selected;
  //     return;
  //   }

  //   validator_data[marketId].requested = true;

  //   uint256 _requestId = 1;
  //   // uint256 _requestId = COORDINATOR.requestRandomWords(
  //   //   keyHash,
  //   //   subscriptionId,
  //   //   requestConfirmations,
  //   //   callbackGasLimit,
  //   //   uint32(parameters[marketId].N)
  //   // );

  //   requestToMarketId[_requestId] = marketId;
  // }

  // /**
  //  @notice chainlink callback function, sets validators.
  //  @dev 
  //  */
  // function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) 
  // public 
  // //override 
  // {
  //   uint256 marketId = requestToMarketId[requestId];
  //   assert(randomWords.length == parameters[marketId].N);

  //   (address instrument, address utilizer) = controller.market_data(marketId);

  //   address[] memory temp = controller.filterTraders(parameters[marketId].r, utilizer);
  //   uint256 _N = parameters[marketId].N;
  //   uint256 length = temp.length;
    
  //   // get validators
  //   for (uint8 i=0; i<_N; i++) {
  //     uint256 j = _weightedRetrieve(temp, length, randomWords[i]);
  //     validator_data[marketId].validators.push(temp[j]);
  //     temp[j] = temp[length - 1];
  //     length--;
  //   }
  // }

  // function _weightedRetrieve(address[] memory group, uint256 length, uint256 randomWord) view internal returns (uint256) {
  //   uint256 sum_weights;

  //   for (uint8 i=0; i<length; i++) {
  //     sum_weights += controller.trader_scores(group[i]);//repToken.getReputationScore(group[i]);
  //   }

  //   uint256 tmp = randomWord % sum_weights;

  //   for (uint8 i=0; i<length; i++) {
  //     uint256 wt = controller.trader_scores(group[i]);
  //     if (tmp < wt) {
  //       return i;
  //     }
  //     unchecked {
  //       tmp -= wt;
  //     }
      
  //   }
  //   console.log("should never be here");
  // }


  // /// @notice allows validators to buy at a discount + automatically stake a percentage of the principal
  // /// They can only buy a fixed amount of ZCB, usually a at lot larger amount 
  // /// @dev get val_cap, the total amount of zcb for sale and each validators should buy 
  // /// val_cap/num validators zcb 
  // /// They also need to hold the corresponding vault, so they are incentivized to assess at a systemic level and avoid highly 
  // /// correlated instruments triggers controller.approveMarket
  // function validatorApprove(
  //   uint256 marketId
  // ) external returns(uint256) {
  //   require(isValidator(marketId, msg.sender), "not a validator for the market");
  //   require(restriction_data[marketId].duringAssessment, "already approved");
  //   require(marketCondition(marketId), "market condition not met");

  //   ValidatorData storage valdata = validator_data[marketId]; 
  //   require(!valdata.staked[msg.sender], "caller already staked for this market");

  //   // staking logic
  //   require(ERC20(controller.getVaultAd(marketId)).balanceOf(msg.sender) >= valdata.initialStake, "not enough tokens to stake");
    
  //   ERC20(controller.getVaultAd(marketId)).safeTransferFrom(msg.sender, address(this), valdata.initialStake);

  //   valdata.totalStaked += valdata.initialStake;
  //   valdata.staked[msg.sender] = true;
    
  //   // discount longZCB logic
  //   SyntheticZCBPool bondPool = markets[marketId].bondPool; 

  //   uint256 val_cap =  valdata.val_cap; 
  //   uint256 zcb_for_sale = val_cap/parameters[marketId].N; 
  //   uint256 collateral_required = zcb_for_sale.mulWadDown(valdata.avg_price); 

  //   require(valdata.sales[msg.sender] <= zcb_for_sale, "already approved");

  //   valdata.sales[msg.sender] += zcb_for_sale;
  //   valdata.totalSales += (zcb_for_sale +1);  //since division rounds down 
  //   valdata.numApproved += 1; 
  //   loggedCollaterals[marketId] += collateral_required; 

  //   bondPool.BaseToken().transferFrom(msg.sender, address(bondPool), collateral_required); 
  //   bondPool.trustedDiscountedMint(msg.sender, zcb_for_sale); 

  //   // Last validator pays more gas, is fair because earlier validators are more uncertain 
  //   if (approvalCondition(marketId)) {
  //     controller.approveMarket(marketId);
  //     approveMarket(marketId); // For market to go to a post assessment stage there always needs to be a lower bound set  
  //   }

  //   return collateral_required;
  // }

  // /**
  //  @notice conditions for approval => validator zcb stake fulfilled + validators have all approved
  //  */
  // function approvalCondition(uint256 marketId ) public view returns(bool){
  //   return (validator_data[marketId].totalSales >= validator_data[marketId].val_cap 
  //   && validator_data[marketId].validators.length == validator_data[marketId].numApproved);
  // }

  // /**
  //  @notice condition for resolving market, met when all the validators chosen for the market
  //  have voted to resolve.
  //  */
  // function resolveCondition(
  //   uint256 marketId
  // ) public view returns (bool) {
  //   return (validator_data[marketId].numResolved == validator_data[marketId].validators.length);
  // }

  // /**
  //  @notice updates the validator stake, burned in proportion to loss.
  //  @dev called by controller, resolveMarket
  //  */
  // function updateValidatorStake(uint256 marketId, uint256 principal, uint256 principal_loss) 
  //   external
  //   onlyController
  // {
  //   if (principal_loss == 0) {
  //     validator_data[marketId].finalStake = validator_data[marketId].initialStake;
  //     return;
  //   }

  //   uint256 totalStaked = validator_data[marketId].totalStaked;
  //   uint256 newTotal = totalStaked/2 + (principal - principal_loss).divWadDown(principal).mulWadDown(totalStaked/2);

  //   ERC4626(controller.getVaultAd(marketId)).burn(totalStaked - newTotal);
  //   validator_data[marketId].totalStaked = newTotal;

  //   validator_data[marketId].finalStake = newTotal/validator_data[marketId].validators.length;
  // }

  // /**
  //  @notice called by validators to approve resolving the market, after approval.
  //  */
  // function validatorResolve(
  //   uint256 marketId
  // ) external {
  //   require(isValidator(marketId, msg.sender), "must be validator to resolve the function");
  //   require(marketActive(marketId), "market not active");
  //   require(!duringMarketAssessment(marketId), "market during assessment");
  //   require(!validator_data[marketId].resolved[msg.sender], "validator already voted to resolve");

  //   validator_data[marketId].resolved[msg.sender] = true;
  //   validator_data[marketId].numResolved ++;
  // }

  // /**
  //  @notice called by validators when the market is denied or resolved
  //  stake is burned in proportion to loss
  //  */
  // function unlockValidatorStake(uint256 marketId) external {
  //   require(isValidator(marketId, msg.sender), "not a validator");
  //   require(validator_data[marketId].staked[msg.sender], "no stake");
  //   require(!restriction_data[marketId].alive, "market not alive");


  //   if (!restriction_data[marketId].resolved) {
  //     ERC20(controller.getVaultAd(marketId)).safeTransfer(msg.sender, validator_data[marketId].initialStake);
  //     validator_data[marketId].totalStaked -= validator_data[marketId].initialStake;
  //   } else {
  //     ERC20(controller.getVaultAd(marketId)).safeTransfer(msg.sender, validator_data[marketId].finalStake);
  //     validator_data[marketId].totalStaked -= validator_data[marketId].finalStake;
  //   }
    
  //   validator_data[marketId].staked[msg.sender] = false;
  // }

  // /// @notice sets the validator cap + valdiator amount 
  // /// param prinicipal is saleAmount for pool based instruments 
  // /// @dev called by controller to setup the validator scheme
  // function _validatorSetup(
  //   uint256 marketId,
  //   uint256 principal,
  //   uint256 creationTimestamp,
  //   uint256 duration, 
  //   bool isPool
  // ) internal {
  //   require(principal != 0, "0 principal"); 
  //   _setValidatorCap(marketId, principal, isPool);
  //   _setValidatorStake(marketId, principal); 
  //   validator_data[marketId].unlockTimestamp = creationTimestamp + duration;
  //   _getValidators(marketId); 
  // }

  // /// @notice called when market initialized, calculates the average price and quantities of zcb
  // /// validators will buy at a discount when approving
  // /// valcap = sigma * princpal.
  // function _setValidatorCap(
  //   uint256 marketId,
  //   uint256 principal, 
  //   bool isPool
  // ) internal {
  //   SyntheticZCBPool bondingPool = markets[marketId].bondPool; 
  //   require(config.isInWad(parameters[marketId].sigma) && config.isInWad(principal), "paramERR");
  //   ValidatorData storage valdata = validator_data[marketId]; 

  //   uint256 valColCap = (parameters[marketId].sigma.mulWadDown(principal)); 

  //   // Get how much ZCB validators need to buy in total, which needs to be filled for the market to be approved 
  //   uint256 discount_cap = bondingPool.discount_cap();
  //   uint256 avgPrice = valColCap.divWadDown(discount_cap);

  //   valdata.val_cap = discount_cap;
  //   valdata.avg_price = avgPrice; 
  // }

  // /**
  //  @notice sets the amount of vt staked by a single validator for a specific market
  //  @dev steak should be between 1-0 wad.
  //  */
  // function _setValidatorStake(uint256 marketId, uint256 principal) internal {
  //   //get vault
  //   ERC4626 vault = ERC4626(controller.vaults(controller.id_parent(marketId)));
  //   uint256 shares = vault.convertToShares(principal);

  //   validator_data[marketId].initialStake = parameters[marketId].steak.mulWadDown(shares);
  // }

  // /**
  //  @notice returns true if user is validator for corresponding market
  //  */
  // function isValidator(uint256 marketId, address user) view public returns(bool){
  //   address[] storage _validators = validator_data[marketId].validators;
  //   for (uint i = 0; i < _validators.length; i++) {
  //     if (_validators[i] == user) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  // function getValidatorRequiredCollateral(uint256 marketId) public view returns(uint256){
  //   uint256 val_cap =  validator_data[marketId].val_cap; 
  //   uint256 zcb_for_sale = val_cap/parameters[marketId].N; 
  //   return zcb_for_sale.mulWadDown(validator_data[marketId].avg_price); 
  // }

  /// @notice calculates implied probability of the trader, used to
  /// update the reputation score by brier scoring mechanism 
  /// @param budget of trader in collateral decimals 
  function calcImpliedProbability(
    uint256 bondAmount, 
    uint256 collateral_amount,
    uint256 budget
    ) public view returns(uint256){
    console.log('bond', bondAmount, collateral_amount, budget); 
    uint256 avg_price = collateral_amount.divWadDown(bondAmount); 
    uint256 b = avg_price.mulWadDown(config.WAD - avg_price);
    uint256 ratio = bondAmount.divWadDown(budget); 

    return ratio.mulWadDown(b)+ avg_price;
  }

  /// @notice log how much collateral trader has at stake, 
  /// to be used for redeeming, restricting trades
  function _logTrades(
    uint256 marketId,
    address trader, 
    uint256 collateral,
    uint256 shortCollateral,  
    bool isBuy, 
    bool isLong
    ) internal {

    if (isLong){

      // If buying bond during assessment, trader is manager, so should update 
      if (isBuy) {
        longTrades[marketId][trader] += collateral; 
        loggedCollaterals[marketId] += collateral; 
        queuedRepUpdates[trader] += 1; 
        } else {
        longTrades[marketId][trader] -= collateral;
        loggedCollaterals[marketId] -= collateral; 
        } 
      } else{
      if (isBuy) {
        // shortCollateral is amount trader pays to buy shortZCB
        shortTrades[marketId][trader] += shortCollateral;

        // collateral is the area under the curve that is subtracted due to the (short)selling
        loggedCollaterals[marketId] -= collateral; 
        } else {
        // revert if underflow, which means trader sold short at a profit, which is not allowed during assessment 
        shortTrades[marketId][trader] -= shortCollateral; 
        loggedCollaterals[marketId] += collateral; 
      } 
    }
  }

  /// @notice general limitorder claim + liquidity provision funnels used post-assessment, 
  /// which will be recorded if necessary 
  /// param type: 1 if open long, 2 if close long, 3 if open short, 4 if close short
  /// type 5: partially claim , TODO do all possible trading functions 
  function claimFunnel(
    uint256 marketId, 
    uint16 point, 
    uint256 funnel
    ) external returns(uint256 claimedAmount){
    SyntheticZCBPool bondPool = markets[marketId].bondPool; 

    if (funnel == 1) claimedAmount = bondPool.makerClaimOpen(point,true, msg.sender); 
    else if (funnel == 2) claimedAmount = bondPool.makerClaimClose(point,true, msg.sender);
    else if (funnel == 3) claimedAmount = bondPool.makerClaimOpen(point,false, msg.sender); 
    else if (funnel == 4) claimedAmount = bondPool.makerClaimClose(point,false, msg.sender); 
  }

  /// @notice called by pool when buying, transfers funds from trader to pool 
  function tradeCallBack(uint256 amount, bytes calldata data) external{
    SyntheticZCBPool(msg.sender).BaseToken().transferFrom(abi.decode(data, (address)), msg.sender, amount); 
  }

  /// @notice deduce fees for non vault stakers, should go down as maturity time approach 0 
  function deduct_selling_fee(uint256 marketId ) internal view returns(uint256){
    // Linearly decreasing fee 
    uint256 normalizedTime = (
      controller.getVault(marketId).fetchInstrumentData(marketId).maturityDate
      - block.timestamp)  * config.WAD 
    / controller.getVault(marketId).fetchInstrumentData(marketId).duration; 
    return normalizedTime.mulWadDown( riskTransferPenalty); 
  }

  struct localVars{
    uint256 promised_return; 
    uint256 inceptionTime; 
    uint256 inceptionPrice; 
    uint256 leverageFactor; 

    uint256 srpPlusOne; 
    uint256 totalAssetsHeld; 
    uint256 juniorSupply; 
    uint256 seniorSupply; 

    bool belowThreshold; 
  }
  /// @notice get programmatic pricing of a pool based longZCB 
  /// returns psu: price of senior(VT's share of investment) vs underlying 
  /// returns pju: price of junior(longZCB) vs underlying
  function poolZCBValue(
    uint256 marketId
    ) public 
    view 
    returns(uint256 psu, uint256 pju, uint256 levFactor, Vault vault){
    localVars memory vars; 
    vault = controller.getVault(marketId); 

    (vars.promised_return, vars.inceptionTime, vars.inceptionPrice, vars.leverageFactor) 
        = vault.fetchPoolTrancheData(marketId); 
    levFactor = vars.leverageFactor; 

    require(vars.inceptionPrice > 0, "0 INCEPTION_PRICE"); 

    // Get senior redemption price that increments per unit time 
    vars.srpPlusOne = vars.inceptionPrice.mulWadDown((vars.promised_return)
      .rpow(block.timestamp - vars.inceptionTime, config.WAD));

    // Get total assets held by the instrument 
    vars.totalAssetsHeld = vault.instrumentAssetOracle( marketId); 
    vars.juniorSupply = markets[marketId].longZCB.totalSupply(); 
    vars.seniorSupply = vars.juniorSupply.mulWadDown(vars.leverageFactor); 

    if (vars.seniorSupply == 0) return(vars.srpPlusOne,vars.srpPlusOne,levFactor, vault); 
    
    // Check if all seniors can redeem
    if (vars.totalAssetsHeld >= vars.srpPlusOne.mulWadDown(vars.seniorSupply))
      psu = vars.srpPlusOne; 
    else{
      psu = vars.totalAssetsHeld.divWadDown(vars.seniorSupply);
      vars.belowThreshold = true;  
    }

    // should be 0 otherwise 
    if(!vars.belowThreshold) pju = (vars.totalAssetsHeld 
      - vars.srpPlusOne.mulWadDown(vars.seniorSupply)).divWadDown(vars.juniorSupply); 
  }

  /// @notice after assessment, let managers buy newly issued longZCB if the instrument is pool based 
  /// funds + funds * levFactor will be directed to the instrument 
  function issuePoolBond(
    uint256 _marketId, 
    uint256 _amountIn
    ) external _lock_ {
    require(!duringMarketAssessment(_marketId), "Pre Approval"); 
    _canIssue(msg.sender, int256(_amountIn), _marketId); 

    // Get price and sell longZCB with this price
    (uint256 psu, uint256 pju, uint256 levFactor, Vault vault ) = poolZCBValue(_marketId);
    markets[_marketId].bondPool.BaseToken().transferFrom(msg.sender, address(vault), _amountIn);
    uint256 issueQTY = _amountIn.divWadDown(pju); 
    markets[_marketId].bondPool.trustedDiscountedMint(msg.sender, issueQTY); 

    // Need to transfer funds automatically to the instrument, seniorAmount is longZCB * levFactor * psu  
    vault.depositIntoInstrument(_marketId, _amountIn + issueQTY.mulWadDown(levFactor).mulWadDown(psu)); 
  }

  /// @notice when a manager redeems a poollongzcb, redeemAmount*levFactor are automatically 
  /// withdrawn from the instrument
  function redeemPoolLongZCB(
    uint256 marketId, 
    uint256 redeemAmount
    ) external _lock_ returns(uint256 collateral_redeem_amount, uint256 seniorAmount){
    require(!marketActive(marketId), "Market Active"); 
    require(restriction_data[marketId].resolved, "Market not resolved"); 
    require(markets[marketId].isPool, "not Pool"); 
    require(markets[marketId].longZCB.balanceOf(msg.sender) > redeemAmount, "insufficient bal"); 

    (uint256 psu, uint256 pju, uint256 levFactor , Vault vault ) = poolZCBValue(marketId);
    collateral_redeem_amount = pju.mulWadDown(redeemAmount); 
    seniorAmount = redeemAmount.mulWadDown(levFactor).mulWadDown(psu); 

    // Need to check if redeemAmount*levFactor can be withdrawn from the pool and do so
    require(vault.fetchInstrument( marketId).isLiquid(seniorAmount), "Not enough liquidity"); 
    vault.withdrawFromInstrumentExternal(marketId, seniorAmount); 

    // TODO update reputation 

    // This means that the sender is a manager
    if (queuedRepUpdates[msg.sender] > 0){
     unchecked{queuedRepUpdates[msg.sender] -= 1;} 
    }

    markets[marketId].bondPool.trustedBurn(msg.sender, redeemAmount, true); 
    controller.redeem_transfer(collateral_redeem_amount, msg.sender, marketId); 
  }

  uint256 public constant riskTransferPenalty = 1e17; 
  mapping(address => uint8) public queuedRepUpdates; 
  uint8 public constant queuedRepThreshold = 3; // at most 3 simultaneous assessment per manager

  /// @notice main entry point for longZCB buys 
  /// @param _amountIn is negative if specified in zcb quantity
  function buyBond(
    uint256 _marketId, 
    int256 _amountIn, 
    uint256 _priceLimit, 
    bytes calldata _tradeRequestData 
    ) external _lock_ returns(uint256 amountIn, uint256 amountOut){
    require(!restriction_data[_marketId].resolved, "must not be resolved");
    _canBuy(msg.sender, _amountIn, _marketId);

    CoreMarketData memory marketData = markets[_marketId]; 
    SyntheticZCBPool bondPool = marketData.bondPool; 
    
    // During assessment, real bonds are issued from utilizer, they are the sole LP 
    if (duringMarketAssessment(_marketId)){

      (amountIn, amountOut) = bondPool.takerOpen(true, _amountIn, _priceLimit, abi.encode(msg.sender)); 
      console.log('amountin', amountIn, amountOut); 
      //Need to log assessment trades for updating reputation scores or returning collateral when market denied 
      _logTrades(_marketId, msg.sender, amountIn, 0, true, true);

      // Get implied probability estimates by summing up all this manager bought for this market 
      assessment_probs[_marketId][msg.sender] = calcImpliedProbability(
          getZCB(_marketId).balanceOf(msg.sender) + leveragePosition[_marketId][msg.sender].amount, 
          longTrades[_marketId][msg.sender], 
          getTraderBudget(_marketId, msg.sender) 
      ); 

      // Phase Transitions when conditions met
      if(onlyReputable(_marketId)){
        uint256 total_bought = loggedCollaterals[_marketId];

        if (total_bought >= parameters[_marketId].omega.mulWadDown(
              controller
              .getVault(_marketId)
              .fetchInstrumentData(_marketId)
              .principal)
        ) {
          restriction_data[_marketId].onlyReputable = false;
        }
      }
    }

    // Synthetic bonds are issued (liquidity provision are amortized as counterparties)
    else{
      (uint16 point, bool isTaker) = abi.decode(_tradeRequestData, (uint16,bool ));
      if(isTaker)
        (amountIn, amountOut) = bondPool.takerOpen(true, _amountIn, _priceLimit, abi.encode(msg.sender));
      else{
        (uint256 escrowAmount, uint128 crossId) = bondPool.makerOpen(point, uint256(_amountIn), true, msg.sender); 
      }
    }
  }

  /// @notice longZCB sells  
  /// @param _amountIn quantity in longZCB 
  function sellBond(
      uint256 _marketId,
      uint256 _amountIn, 
      uint256 _priceLimit, 
      bytes calldata _tradeRequestData 
    ) external _lock_ returns (uint256 amountIn, uint256 amountOut){
    // if (duringMarketAssessment(_marketId)) revert("can't close during assessment"); 
    require(!restriction_data[_marketId].resolved, "must not be resolved");
    require(_canSell(msg.sender, _amountIn, _marketId),"Trade Restricted");
    SyntheticZCBPool bondPool = markets[_marketId].bondPool; 

    if (duringMarketAssessment(_marketId)){

      (amountIn, amountOut) = bondPool.takerClose(
                                    true, int256(_amountIn), _priceLimit, abi.encode(msg.sender));

      _logTrades(_marketId, msg.sender, amountIn, 0, false, true );                                          

    }
    else{
      deduct_selling_fee( _marketId ); //TODO, if validator or manager, deduct reputation 

      (uint16 point, bool isTaker) = abi.decode(_tradeRequestData, (uint16,bool ));
      if(isTaker) (amountIn, amountOut) = bondPool.takerClose(
              true, int256(_amountIn), _priceLimit, abi.encode(msg.sender));
      else {
        (uint256 escrowAmount, uint128 crossId) = bondPool.makerClose(point, uint256(_amountIn), true, msg.sender);        
      }
    }
  } 

  /// @param _amountIn: amount of short trader is willing to buy
  /// @param _priceLimit: slippage tolerance on trade
  function shortBond(
    uint256 _marketId,
    uint256 _amountIn, 
    uint256 _priceLimit,
    bytes calldata _tradeRequestData 
    ) external _lock_ returns (uint256 amountIn, uint256 amountOut){
    require(_canSell(msg.sender, _amountIn, _marketId),"Trade Restricted");
    SyntheticZCBPool bondPool = markets[_marketId].bondPool; 

    if (duringMarketAssessment(_marketId)){

      // amountOut is base collateral down the curve, amountIn is collateral used to buy shortZCB 
      (amountOut, amountIn) = bondPool.takerOpen(false, int256(_amountIn), _priceLimit, abi.encode(msg.sender));

      _logTrades(_marketId, msg.sender, amountOut, amountIn, true, false);

    }
    else{
      //deduct_selling_fee(); //if naked CDS( staked vault)

      (uint16 point, bool isTaker) = abi.decode(_tradeRequestData, (uint16,bool ));
      if (isTaker)
        (amountOut, amountIn) = bondPool.takerOpen(false, int256(_amountIn), _priceLimit, abi.encode(msg.sender));
      
      else{
        (uint256 escrowAmount, uint128 crossId) = bondPool.makerOpen(point, uint256(_amountIn), false, msg.sender);
      }
    }
  }

  /// @param _amountIn is amount of short trader is willing to cover 
  function coverBondShort(
    uint256 _marketId, 
    uint256 _amountIn, 
    uint256 _priceLimit,
    bytes calldata _tradeRequestData 
    ) external _lock_ returns (uint256 amountIn, uint256 amountOut){
    SyntheticZCBPool bondPool = markets[_marketId].bondPool; 

    if (duringMarketAssessment(_marketId)){

      // amountOut is collateral up the curve, amountIn is collateral returned from closing  
      (amountOut, amountIn) = bondPool.takerClose(false, -int256(_amountIn), _priceLimit, abi.encode(msg.sender));

      _logTrades(_marketId, msg.sender, amountOut, amountIn, true, false); 
     // deduct_selling_fee(); 
    }
    else{
      (uint16 point, bool isTaker) = abi.decode(_tradeRequestData, (uint16,bool ));
      if (isTaker)
        (amountOut, amountIn) = bondPool.takerClose(false, -int256(_amountIn), _priceLimit, abi.encode(msg.sender));
      
      else{
        (uint256 escrowAmount, uint128 crossId) = bondPool.makerClose(point, _amountIn, false, msg.sender);
      }
    }
  }


  /// @notice called by traders when market is denied before approval TODO
  /// ??? if the market is denied, this function is called and everything is redeemed 
  /// validator will need to call this on denial + isLong = true to redeem their collateral.
  function redeemDeniedMarket(
    uint256 marketId, 
    bool isLong
  ) external _lock_ {
    require(!restriction_data[marketId].alive, "Market Still During Assessment"); // TODO
    require(restriction_data[marketId].duringAssessment, "Market has been approved");
    SyntheticZCBPool bondPool = markets[marketId].bondPool; 

    uint256 collateral_amount;
    uint256 balance; 
    // Get collateral at stake in shorts, which will be directly given back to traders
    if(!isLong){
      balance = markets[marketId].shortZCB.balanceOf(msg.sender); 
      require(balance >= 0, "Empty Balance");

      // TODO this means if trader's loss will be refunded if loss was realized before denied market
      collateral_amount = shortTrades[marketId][msg.sender]; 
      delete shortTrades[marketId][msg.sender]; 

      //Burn all their balance
      bondPool.trustedBurn(msg.sender, balance, false);
    } 

    // Get collateral at stake in longs, which will be directly given back to traders
    else {
      balance = markets[marketId].longZCB.balanceOf(msg.sender); 
      require(balance >= 0, "Empty Balance");

      // TODO this means if trader's loss will be refunded if loss was realized before denied market
      if (controller.isValidator(marketId, msg.sender) && controller.hasApproved(marketId, msg.sender)) {
        collateral_amount = controller.deniedValidator(marketId, msg.sender);
      }
      else{
        collateral_amount = longTrades[marketId][msg.sender]; 
        delete longTrades[marketId][msg.sender]; 
      }

      // Burn all their balance 
      bondPool.trustedBurn(msg.sender, balance, true); 
      
      // This means that the sender is a manager
      if (queuedRepUpdates[msg.sender] > 0){
        unchecked{queuedRepUpdates[msg.sender] -= 1;} 
      }    
    }

    // Before redeem_transfer is called all funds for this instrument should be back in the vault
    controller.redeem_transfer(collateral_amount, msg.sender, marketId);
    //TODO need to check if last redeemer, so can kill market.
  }

  
  /// @dev Redemption price, as calculated (only once) at maturity,
  /// depends on total_repayed/(principal + predetermined yield)
  /// If total_repayed = 0, redemption price is 0
  /// @param atLoss: defines circumstances where expected returns are higher than actual
  /// @param loss: facevalue - returned amount => non-negative always?
  /// @param extra_gain: any extra yield not factored during assessment. Is 0 yield is as expected
  function updateRedemptionPrice(
    uint256 marketId,
    bool atLoss, 
    uint256 extra_gain, 
    uint256 loss, 
    bool premature
  ) external  onlyController {  
    if (atLoss) assert(extra_gain == 0); 

    uint256 total_supply = markets[marketId].longZCB.totalSupply(); 
    uint256 total_shorts = (extra_gain >0) ?  markets[marketId].shortZCB.totalSupply() :0; 

    if(!atLoss)
      redemption_prices[marketId] = config.WAD + extra_gain.divWadDown(total_supply + total_shorts); 
    
    else {
      if (config.WAD <= loss.divWadDown(total_supply)){
        redemption_prices[marketId] = 0; 
      }
      else {
        redemption_prices[marketId] = config.WAD - loss.divWadDown(total_supply);
      }
    }

    deactivateMarket(marketId, atLoss, !premature); 

    // TODO edgecase redemption price calculations  
  }

  /// @notice trader will redeem entire balance of ZCB
  /// Needs to be called at maturity, market needs to be resolved first(from controller)
  function redeem(
    uint256 marketId
    ) external _lock_ returns(uint256 collateral_redeem_amount){
    require(!marketActive(marketId), "Market Active"); 
    require(restriction_data[marketId].resolved, "Market not resolved"); 
    require(!redeemed[marketId][msg.sender], "Already Redeemed");
    redeemed[marketId][msg.sender] = true; 

    SyntheticZCBPool bondPool = markets[marketId].bondPool; 

    if (controller.isValidator(marketId, msg.sender)) controller.redeemValidator(marketId, msg.sender);

    uint256 zcb_redeem_amount = markets[marketId].longZCB.balanceOf(msg.sender); 
    uint256 redemption_price = get_redemption_price(marketId); 
    collateral_redeem_amount = redemption_price.mulWadDown(zcb_redeem_amount); 

    if (!controller.isValidator(marketId, msg.sender)) { // TODO should validators get reputation if they do ok.
      bool increment = redemption_price >= config.WAD? true: false;
      controller.updateReputation(marketId, msg.sender, increment);
    }

    // This means that the sender is a manager
    if (queuedRepUpdates[msg.sender] > 0){
     unchecked{queuedRepUpdates[msg.sender] -= 1;} 
   }

    bondPool.trustedBurn(msg.sender, zcb_redeem_amount, true); 
    controller.redeem_transfer(collateral_redeem_amount, msg.sender, marketId); 

  }

  /// @notice called by short buyers when market is resolved  
  function redeemShortZCB(
    uint256 marketId 
    ) external _lock_ returns(uint256 collateral_redeem_amount){
    require(!marketActive(marketId), "Market Active"); 
    require(restriction_data[marketId].resolved, "Market not resolved"); 
    require(!redeemed[marketId][msg.sender], "Already Redeemed");
    redeemed[marketId][msg.sender] = true; 

    SyntheticZCBPool bondPool = markets[marketId].bondPool; 

    uint256 shortZCB_redeem_amount = markets[marketId].shortZCB.balanceOf(msg.sender); 
    uint256 long_redemption_price = get_redemption_price(marketId);
    uint256 redemption_price = long_redemption_price >= config.WAD 
                               ? 0 
                               : config.WAD - long_redemption_price; 
    collateral_redeem_amount = redemption_price.mulWadDown(shortZCB_redeem_amount);

    bondPool.trustedBurn(msg.sender, shortZCB_redeem_amount, false); 
    controller.redeem_transfer(collateral_redeem_amount, msg.sender, marketId); 
  }

  /// @notice returns the manager's maximum leverage 
  function getMaxLeverage(address manager) public view returns(uint256){
    //return (repToken.getReputationScore(manager) * config.WAD).sqrt(); //TODO experiment 
    return (controller.trader_scores(manager) * config.WAD).sqrt();
  }

  mapping(uint256=>mapping(address=> LeveredBond)) public leveragePosition; 
  struct LeveredBond{
    uint128 debt; //how much collateral borrowed from vault 
    uint128 amount; // how much bonds were bought with the given leverage
  }

  function getLeveragePosition(uint256 marketId, address manager) public view returns(uint256, uint256){
    return (uint256(leveragePosition[marketId][manager].debt), 
      uint256(leveragePosition[marketId][manager].amount));
  }

  /// @notice for managers that are a) meet certain reputation threshold and b) choose to be more
  /// capital efficient with their zcb purchase. 
  /// @param _amountIn (in collateral) already accounts for the leverage, so the actual amount manager is transferring
  /// is _amountIn/_leverage 
  /// @dev the marketmanager should take custody of the quantity bought with leverage
  /// and instead return notes of the levered position 
  /// TODO do + instead of creating new positions and implied prob cumulative 
  function buyBondLevered(
    uint256 _marketId, 
    uint256 _amountIn, 
    uint256 _priceLimit, 
    uint256 _leverage //in 18 dec 
    ) external _lock_ returns(uint256 amountIn, uint256 amountOut){
    require(duringMarketAssessment(_marketId), "PhaseERR"); 
    require(!restriction_data[_marketId].resolved, "must not be resolved");
    require(_leverage <= getMaxLeverage(msg.sender) && _leverage >= config.WAD, "exceeds allowed leverage");
    _canBuy(msg.sender, int256(_amountIn), _marketId);
    SyntheticZCBPool bondPool = markets[_marketId].bondPool; 

    // stack collateral from trader and borrowing from vault 
    uint256 amountPulled = _amountIn.divWadDown(_leverage); 
    bondPool.BaseToken().transferFrom(msg.sender, address(this), amountPulled); 
    controller.pullLeverage(_marketId, _amountIn - amountPulled); 

    // Buy with leverage, zcb transferred here
    bondPool.BaseToken().approve(address(this), _amountIn); 
    (amountIn, amountOut) = bondPool.takerOpen(true, int256(_amountIn), _priceLimit, abi.encode(address(this))); 

    //Need to log assessment trades for updating reputation scores or returning collateral when market denied 
    _logTrades(_marketId, msg.sender, _amountIn, 0, true, true);

    // Get implied probability estimates by summing up all this managers bought for this market 
    assessment_probs[_marketId][msg.sender] = calcImpliedProbability(
        amountOut, 
        amountIn, 
        getTraderBudget(_marketId, msg.sender) 
    ); 

    // Phase Transitions when conditions met
    if(onlyReputable(_marketId)){
      uint256 total_bought = loggedCollaterals[_marketId];

      if (total_bought >= parameters[_marketId].omega.mulWadDown(
            controller
            .getVault(_marketId)
            .fetchInstrumentData(_marketId)
            .principal)
      ) {
        restriction_data[_marketId].onlyReputable = false;
      }
    }
    // create note to trader 
    leveragePosition[_marketId][msg.sender] = LeveredBond(uint128(_amountIn - amountPulled ),uint128(amountOut)) ; 
  }

  function redeemLeveredBond(uint256 marketId) public{
    require(!marketActive(marketId), "Market Active"); 
    require(restriction_data[marketId].resolved, "Market not resolved"); 
    require(!redeemed[marketId][msg.sender], "Already Redeemed");
    redeemed[marketId][msg.sender] = true; 

    if (controller.isValidator(marketId, msg.sender)) controller.redeemValidator(marketId, msg.sender); 

    LeveredBond memory position = leveragePosition[marketId][msg.sender]; 
    require(position.amount>0, "ERR"); 

    uint256 redemption_price = get_redemption_price(marketId); 
    uint256 collateral_back = redemption_price.mulWadDown(position.amount) ; 
    uint256 collateral_redeem_amount = collateral_back >= uint256(position.debt)  
        ? collateral_back - uint256(position.debt) : 0; 

    if (!controller.isValidator(marketId, msg.sender)) {
      bool increment = redemption_price >= config.WAD? true: false;
      controller.updateReputation(marketId, msg.sender, increment);
    }

    // This means that the sender is a manager
    if (queuedRepUpdates[msg.sender] > 0){
     unchecked{queuedRepUpdates[msg.sender] -= 1;} 
    }

    leveragePosition[marketId][msg.sender].amount = 0; 
    markets[marketId].bondPool.trustedBurn(address(this), position.amount, true); 
    controller.redeem_transfer(collateral_redeem_amount, msg.sender, marketId); 
  }

  function redeemDeniedLeveredBond(uint256 marketId) public returns(uint collateral_amount){
    LeveredBond memory position = leveragePosition[marketId][msg.sender]; 
    require(position.amount>0, "ERR"); 
    leveragePosition[marketId][msg.sender].amount = 0; 

    // TODO this means if trader's loss will be refunded if loss was realized before denied market
    if (controller.isValidator(marketId, msg.sender)) {
      collateral_amount = controller.deniedValidator(marketId, msg.sender);
    }
    else{
      collateral_amount = longTrades[marketId][msg.sender]; 
      delete longTrades[marketId][msg.sender]; 
    }

    // Burn all their position, 
    markets[marketId].bondPool.trustedBurn(address(this), position.amount, true); 

    // This means that the sender is a manager
    if (queuedRepUpdates[msg.sender] > 0){
      unchecked{queuedRepUpdates[msg.sender] -= 1;} 
    }    

    // Before redeem_transfer is called all funds for this instrument should be back in the vault
    controller.redeem_transfer(collateral_amount - uint256(position.debt), msg.sender, marketId);
  }
}

