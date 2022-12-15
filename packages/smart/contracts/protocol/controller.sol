pragma solidity ^0.8.4;
import {MarketManager} from "./marketmanager.sol";
import {ReputationNFT} from "./reputationtoken.sol";
import {Vault} from "../vaults/vault.sol";
import {Instrument} from "../vaults/instrument.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import {VaultFactory} from "./factories.sol"; 
import "hardhat/console.sol";
// import "@interep/contracts/IInterep.sol";
import {config} from "../utils/helpers.sol"; 
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {ERC20} from "solmate/src/tokens/ERC20.sol";
import {ERC4626} from "../vaults/mixins/ERC4626.sol";
import {Vault} from "../vaults/vault.sol";
// import "@interep/contracts/IInterep.sol";
import {SyntheticZCBPoolFactory, SyntheticZCBPool} from "../bonds/synthetic.sol"; 
import {SafeTransferLib} from "solmate/src/utils/SafeTransferLib.sol";


contract Controller {
  using SafeMath for uint256;
  using FixedPointMathLib for uint256;
  using SafeTransferLib for ERC20;

  struct MarketData {
      address instrument_address;
      address utilizer;
  }

  struct ApprovalData{
    uint256 approved_principal; 
    uint256 approved_yield; 
  }


  
  event MarketInitiated(uint256 marketId, address recipient);

  mapping(uint256=>ApprovalData) approvalDatas;

  function getApprovalData(uint256 marketId) public view returns (ApprovalData memory) {
    approvalDatas[marketId];
  }

  mapping(address => bool) public  verified;
  mapping(uint256 => MarketData) public market_data; // id => recipient
  mapping(address=> uint256) public ad_to_id; //utilizer address to marketId
  mapping(uint256=> Vault) public vaults; // vault id to Vault contract
  mapping(uint256=> uint256) public id_parent; //marketId-> vaultId 
  mapping(uint256=> uint256) public vault_debt; //vault debt for each marketId ??
  mapping(uint256=>uint256[]) public vault_to_marketIds;

  address creator_address;

  // IInterep interep;
  // TrustedMarketFactoryV3 marketFactory;
  MarketManager marketManager;
  // ReputationNFT repNFT; 
  VaultFactory vaultFactory; 
  SyntheticZCBPoolFactory poolFactory; 

  uint256 constant TWITTER_UNRATED_GROUP_ID = 16106950158033643226105886729341667676405340206102109927577753383156646348711;
  bytes32 constant private signal = bytes32("twitter-unrated");
  uint256 constant MIN_DURATION = 1 days;

  /* ========== MODIFIERS ========== */
  modifier onlyValidator(uint256 marketId) {
      require(isValidator(marketId, msg.sender)|| msg.sender == creator_address, "not validator for market");
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
      address _interep_address //TODO
  ) {
      creator_address = _creator_address;
  }

  /*----Setup Functions----*/

  function setMarketManager(address _marketManager) public onlyOwner {
    require(_marketManager != address(0));
    marketManager = MarketManager(_marketManager);
  }

  // function setReputationNFT(address NFT_address) public onlyOwner{
  //   repNFT = ReputationNFT(NFT_address); 
  // }

  function setVaultFactory(address _vaultFactory) public onlyOwner {
    vaultFactory = VaultFactory(_vaultFactory); 
  }

  function setPoolFactory(address _poolFactory) public onlyOwner{
    poolFactory = SyntheticZCBPoolFactory(_poolFactory); 
  }

  // function verifyAddress(
  //     uint256 nullifier_hash, 
  //     uint256 external_nullifier,
  //     uint256[8] calldata proof
  // ) external  {
  //     require(!verified[msg.sender], "address already verified");
  //     interep.verifyProof(TWITTER_UNRATED_GROUP_ID, signal, nullifier_hash, external_nullifier, proof);
  //     verified[msg.sender] = true;
  // }

  function testVerifyAddress() external {
    verified[msg.sender] = true;
  }


  /// @notice called only when redeeming, transfer funds from vault 
  function redeem_transfer(
    uint256 amount, 
    address to, 
    uint256 marketId) 
  external onlyManager{
    vaults[id_parent[marketId]].trusted_transfer(amount,to); 
  }
  
  /// @notice creates vault
  /// @param underlying: underlying asset for vault
  /// @param _onlyVerified: only verified users can mint shares
  /// @param _r: minimum reputation score to mint shares
  /// @param _asset_limit: max number of shares for a single address
  /// @param _total_asset_limit: max number of shares for entire vault
  /// @param default_params: default params for markets created by vault
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

  /// @notice initiates market, called by frontend loan proposal or instrument form submit button.
  /// @dev Instrument should already be deployed 
  /// @param recipient: utilizer for the associated instrument
  /// @param instrumentData: instrument arguments
  /// @param vaultId: vault identifier
  function initiateMarket(
    address recipient,
    Vault.InstrumentData memory instrumentData, 
    uint256 vaultId
  ) external  {
    require(recipient != address(0), "address0"); 
    require(instrumentData.Instrument_address != address(0), "address0");
    require(address(vaults[vaultId]) != address(0), "address0");

    Vault vault = vaults[vaultId]; 
    uint256 marketId = marketManager.marketCount();
    id_parent[marketId] = vaultId;
    vault_to_marketIds[vaultId].push(marketId);
    market_data[marketId] = MarketData(instrumentData.Instrument_address, recipient);
    marketManager.setParameters(vault.get_vault_params(), vault.utilizationRate(), marketId); //TODO non-default 

    // Create new pool and bonds and store initial price and liquidity for the pool
    (address longZCB, address shortZCB, SyntheticZCBPool pool) 
              = poolFactory.newPool(address(vaults[vaultId].UNDERLYING()), address(marketManager)); 

    if (instrumentData.isPool){
      pool.calculateInitCurveParamsPool(instrumentData.poolData.saleAmount, 
        instrumentData.poolData.initPrice, instrumentData.poolData.inceptionPrice, marketManager.getParameters(marketId).sigma); 
      console.log("?");

      marketManager.newMarket(marketId, pool, longZCB, shortZCB, instrumentData.description, true); 
      console.log("??");

      // set validators
      _validatorSetup(marketId, instrumentData.poolData.saleAmount, instrumentData.isPool);
    }
    else{
      pool.calculateInitCurveParams(instrumentData.principal,
          instrumentData.expectedYield, marketManager.getParameters(marketId).sigma); 

      marketManager.newMarket(marketId, pool, longZCB, shortZCB, instrumentData.description, false);
      // set validators
      _validatorSetup(marketId, instrumentData.principal, instrumentData.isPool);
    }

    // add vault proposal 
    instrumentData.marketId = marketId;
    vault.addProposal(instrumentData);

    emit MarketInitiated(marketId, recipient);
    ad_to_id[recipient] = marketId; //only for testing purposes, one utilizer should be able to create multiple markets
  }

  /// @notice Resolve function 1
  /// @dev Prepare market/instrument for closing, called separately before resolveMarket
  /// this is either called automatically from the instrument when conditions are met i.e fully repaid principal + interest
  /// or, in the event of a default, by validators who deem the principal recouperation is finished
  /// and need to collect remaining funds by redeeming ZCB
  function beforeResolve(uint256 marketId) external 
  //onlyValidator(marketId) 
  {
    require(!marketManager.duringMarketAssessment(marketId) && marketManager.marketActive(marketId), "market conditions not met");
    require(resolveCondition(marketId), "not enough validators have voted to resolve");
    vaults[id_parent[marketId]].beforeResolve(marketId);
  }
 
  /// Resolve function 2
  /// @notice main function called at maturity OR premature resolve of instrument(from early default)  
  /// @dev validators call this function from market manager
  /// any funds left for the instrument, irrespective of whether it is in profit or inloss. 
  function resolveMarket(
    uint256 marketId
    ) external onlyValidator(marketId) {
    (bool atLoss, uint256 extra_gain, uint256 principal_loss, bool premature) 
          = vaults[id_parent[marketId]].resolveInstrument(marketId);

    marketManager.updateRedemptionPrice(marketId, atLoss, extra_gain, principal_loss, premature);
    _updateValidatorStake(marketId, approvalDatas[marketId].approved_principal, principal_loss);
    cleanUpDust(marketId);
  }

  /// @notice When market resolves, should collect remaining liquidity and/or dust from  
  /// the pool and send them back to the vault
  /// @dev should be called before redeem_transfer is allowed 
  function cleanUpDust(uint256 marketId) internal {
    marketManager.getPool(marketId).flush(getVaultAd(marketId), type(uint256).max); 
  }

  // /// @notice checks for maturity, resolve at maturity
  // /// @param marketId: called for anyone.
  // function checkInstrument(uint256 marketId) external
  // ///onlyKeepers 
  //  returns (bool) {
  //   Vault.InstrumentData memory data = vaults[id_parent[marketId]].fetchInstrumentData( marketId);
      
  //   require(data.marketId > 0 && data.trusted, "instrument must be active");
  //   require(data.maturityDate > 0, "instrument hasn't been approved yet" );

  //   if (block.timestamp >= data.maturityDate) {
  //       // this.resolveMarket(marketId);
  //       this.beforeResolve(marketId);
  //       return true;
  //   }
  //   return false;
  // }

  /// @notice when market is resolved(maturity/early default), calculates score
  /// and update each assessment phase trader's reputation, called by individual traders when redeeming 
  function updateReputation (
    uint256 marketId, 
    address trader, 
    bool increment) 
  external onlyManager {
    uint256 implied_probs = marketManager.assessment_probs(marketId, trader);
    // int256 scoreToUpdate = increment ? int256(implied_probs.mulDivDown(implied_probs, config.WAD)) //experiment 
    //                                  : -int256(implied_probs.mulDivDown(implied_probs, config.WAD));
    uint256 change = implied_probs.mulDivDown(implied_probs, config.WAD);
    
    if (increment) {
      _incrementScore(trader, change);
    } else {
      _decrementScore(trader, change);
    }
  }

  /// @notice function that closes the instrument/market before maturity, maybe to realize gains/cut losses fast
  /// or debt is prematurely fully repaid, or underlying strategy is deemed dangerous, etc. 
  /// After, the resolveMarket function should be called in a new block  
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
  }

  /// @notice called by the validator from validatorApprove when market conditions are met
  /// need to move the collateral in the wCollateral to 
  function approveMarket(
    uint256 marketId
  ) internal {
    Vault vault = vaults[id_parent[marketId]]; 
    SyntheticZCBPool pool = marketManager.getPool(marketId); 
    
    require(marketManager.getCurrentMarketPhase(marketId) == 3,"!marketCondition");
    require(vault.instrumentApprovalCondition(marketId), "!instrumentCondition");

    bool isPool = marketManager.isInstrumentPool(marketId); 
    uint256 managerCollateral = marketManager.loggedCollaterals(marketId); 

    if (isPool) poolApproval(marketId, managerCollateral, vault.fetchInstrumentData( marketId).poolData.leverageFactor); 

    else {
      if (vault.getInstrumentType(marketId) == 0) creditApproval(marketId, pool); 

      else generalApproval(marketId); 
    }
    // pull from pool to vault, which will be used to fund the instrument
    pool.flush(address(vault), managerCollateral); 

    // Trust and deposit to the instrument contract
    vault.trustInstrument(marketId, approvalDatas[marketId], isPool);

    // Since funds are transfered from pool to vault, set default liquidity in pool to 0 
    pool.resetLiq(); 
  }

  function poolApproval(uint256 marketId, uint256 managerCollateral, uint256 leverageFactor) internal{
    require(leverageFactor > 0, "0 LEV_FACTOR"); 

    approvalDatas[marketId] = ApprovalData(managerCollateral.mulWadDown(leverageFactor), 0 ); 
  }

  /// @notice receives necessary market information. Only applicable for creditlines 
  /// required for market approval such as max principal, quoted interest rate
  function creditApproval(uint256 marketId, SyntheticZCBPool pool) internal{
    (uint256 proposed_principal, uint256 proposed_yield) 
          = vaults[id_parent[marketId]].viewPrincipalAndYield(marketId); 

    // get max_principal which is (s+1) * total long bought for creditline, or just be
    // proposed principal for other instruments 
    uint256 max_principal = min((marketManager.getParameters(marketId).s + config.WAD)
                            .mulWadDown(marketManager.loggedCollaterals(marketId)),
                            proposed_principal ); 

    // Required notional yield amount denominated in underlying  given credit determined by managers
    uint256 quoted_interest = min(pool.areaBetweenCurveAndMax(max_principal), proposed_yield ); 

    approvalDatas[marketId] = ApprovalData(max_principal, quoted_interest); 
  }

  function generalApproval(uint256 marketId) internal {
    (uint256 proposed_principal, uint256 proposed_yield) = vaults[id_parent[marketId]].viewPrincipalAndYield(marketId); 
    approvalDatas[marketId] = ApprovalData(proposed_principal, proposed_yield); 
  }

  /**
   @dev called by validator denial of market.
   */
  function denyMarket(
      uint256 marketId
  ) external  onlyValidator(marketId) {
    vaults[id_parent[marketId]].denyInstrument(marketId);
    cleanUpDust(marketId);
    marketManager.denyMarket(marketId);
  }

  /*----Validator Logic----*/
  struct ValidatorData {
    mapping(address => uint256) sales; // amount of zcb bought per validator
    mapping(address => bool) staked; // true if address has staked vt (approved)
    mapping(address => bool) resolved; // true if address has voted to resolve the market
    address[] validators;
    uint256 val_cap;// total zcb validators can buy at a discount
    uint256 avg_price; //price the validators can buy zcb at a discount 
    bool requested; // true if already requested random numbers from array.
    uint256 totalSales; // total amount of zcb bought;
    uint256 totalStaked; // total amount of vault token staked.
    uint256 numApproved;
    uint256 initialStake; // amount staked
    uint256 finalStake; // amount of stake recoverable post resolve
    uint256 numResolved; // number of validators calling resolve on early resolution.
  }

  mapping(uint256 => uint256) requestToMarketId;
  mapping(uint256 => ValidatorData) validator_data;

    /// @notice sets the validator cap + valdiator amount 
  /// param prinicipal is saleAmount for pool based instruments 
  /// @dev called by controller to setup the validator scheme
  function _validatorSetup(
    uint256 marketId,
    uint256 principal,
    bool isPool
  ) internal {
    require(principal != 0, "0 principal");
    _getValidators(marketId);
    _setValidatorCap(marketId, principal, isPool);
    _setValidatorStake(marketId, principal);
  }

  function viewValidators(uint256 marketId) view public returns (address[] memory) {
    return validator_data[marketId].validators;
  }

  function getNumApproved(uint256 marketId) view public returns (uint256) {
    return validator_data[marketId].numApproved;
  }

  function getNumResolved(uint256 marketId) view public returns (uint256) {
    return validator_data[marketId].numResolved;
  }

  function getTotalStaked(uint256 marketId) view public returns (uint256) {
    return validator_data[marketId].totalStaked;
  }

  function getInitialStake(uint256 marketId) view public returns (uint256) {
    return validator_data[marketId].initialStake;
  }

  function getFinalStake(uint256 marketId) view public returns (uint256) {
    return validator_data[marketId].finalStake;
  }

  /**
   @notice randomly choose validators for market approval, async operation => fulfillRandomness is the callback function.
   @dev for now called on market initialization
   */
  function _getValidators(uint256 marketId) public {
    // retrieve traders that meet requirement.
    // address instrument = market_data[marketId].instrument_address;
    address utilizer = market_data[marketId].utilizer;
    (uint256 N,,,,,uint256 r,,) = marketManager.parameters(marketId);
    address[] memory selected = _filterTraders(r, utilizer);

    // if there are not enough traders, set validators to all selected traders.
    if (selected.length <= N) {
      validator_data[marketId].validators = selected;
      if (selected.length < N) marketManager.setN(marketId, selected.length);
      return;
    }

    validator_data[marketId].requested = true;

    uint256 _requestId = 1;
    // uint256 _requestId = COORDINATOR.requestRandomWords(
    //   keyHash,
    //   subscriptionId,
    //   requestConfirmations,
    //   callbackGasLimit,
    //   uint32(parameters[marketId].N)
    // );

    requestToMarketId[_requestId] = marketId;
  }

    /**
   @notice chainlink callback function, sets validators.
   @dev TODO => can be called by anyone?
   */
  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) 
  public //internal  
  //override 
  {
    uint256 marketId = requestToMarketId[requestId];
    (uint256 N,,,,,uint256 r,,) = marketManager.parameters(marketId);
    assert(randomWords.length == N);

    // address instrument = market_data[marketId].instrument_address;
    address utilizer = market_data[marketId].utilizer;

    address[] memory temp = _filterTraders(r, utilizer);
    uint256 length = temp.length;
    
    // get validators
    for (uint8 i=0; i<N; i++) {
      uint256 j = _weightedRetrieve(temp, length, randomWords[i]);
      validator_data[marketId].validators.push(temp[j]);
      temp[j] = temp[length - 1];
      length--;
    }
  }

  function _weightedRetrieve(address[] memory group, uint256 length, uint256 randomWord) view internal returns (uint256) {
    uint256 sum_weights;

    for (uint8 i=0; i<length; i++) {
      sum_weights += trader_scores[group[i]];//repToken.getReputationScore(group[i]);
    }

    uint256 tmp = randomWord % sum_weights;

    for (uint8 i=0; i<length; i++) {
      uint256 wt = trader_scores[group[i]];
      if (tmp < wt) {
        return i;
      }
      unchecked {
        tmp -= wt;
      }
      
    }
    console.log("should never be here");
  }

    /// @notice allows validators to buy at a discount + automatically stake a percentage of the principal
  /// They can only buy a fixed amount of ZCB, usually a at lot larger amount 
  /// @dev get val_cap, the total amount of zcb for sale and each validators should buy 
  /// val_cap/num validators zcb 
  /// They also need to hold the corresponding vault, so they are incentivized to assess at a systemic level and avoid highly 
  /// correlated instruments triggers controller.approveMarket
  function validatorApprove(
    uint256 marketId
  ) external returns(uint256) {
    require(isValidator(marketId, msg.sender), "not a validator for the market");
    require(marketManager.duringMarketAssessment(marketId), "already approved");
    require(marketManager.marketCondition(marketId), "market condition not met");

    ValidatorData storage valdata = validator_data[marketId]; 
    require(!valdata.staked[msg.sender], "caller already staked for this market");

    // staking logic, TODO optional since will throw error on transfer.
   // require(ERC20(getVaultAd(marketId)).balanceOf(msg.sender) >= valdata.initialStake, "not enough tokens to stake");
    
    // staked vault tokens go to controller
    ERC20(getVaultAd(marketId)).safeTransferFrom(msg.sender, address(this), valdata.initialStake);

    valdata.totalStaked += valdata.initialStake;
    valdata.staked[msg.sender] = true;

    (uint256 N,,,,,,,) = marketManager.parameters(marketId);
    uint256 zcb_for_sale = valdata.val_cap/N; 
    uint256 collateral_required = zcb_for_sale.mulWadDown(valdata.avg_price); 

    require(valdata.sales[msg.sender] <= zcb_for_sale, "already approved");

    valdata.sales[msg.sender] += zcb_for_sale;
    valdata.totalSales += (zcb_for_sale +1);  //since division rounds down ??
    valdata.numApproved += 1;

    // marketManager actions on validatorApprove, transfers collateral to marketManager.
    marketManager.validatorApprove(marketId, collateral_required, zcb_for_sale, msg.sender);

    // Last validator pays more gas, is fair because earlier validators are more uncertain 
    if (approvalCondition(marketId)) {
      approveMarket(marketId);
      marketManager.approveMarket(marketId); // For market to go to a post assessment stage there always needs to be a lower bound set
    }

    return collateral_required;
  }

  /**
   @notice conditions for approval => validator zcb stake fulfilled + validators have all approved
   */
  function approvalCondition(uint256 marketId ) public view returns(bool){
    return (validator_data[marketId].totalSales >= validator_data[marketId].val_cap 
    && validator_data[marketId].validators.length == validator_data[marketId].numApproved);
  }

  /**
   @notice returns true if user is validator for corresponding market
   */
  function isValidator(uint256 marketId, address user) view public returns(bool){
    address[] storage _validators = validator_data[marketId].validators;
    for (uint i = 0; i < _validators.length; i++) {
      if (_validators[i] == user) {
        return true;
      }
    }
    return false;
  }

  /**
   @notice condition for resolving market, met when all the validators chosen for the market
   have voted to resolve.
   */
  function resolveCondition(
    uint256 marketId
  ) public view returns (bool) {
    return (validator_data[marketId].numResolved == validator_data[marketId].validators.length);
  }

  /**
   @notice updates the validator stake, burned in proportion to loss.
   principal and principal loss are in the underlying asset of the vault => must be converted to vault shares.
   @dev called by resolveMarket
   */
  function _updateValidatorStake (
    uint256 marketId, 
    uint256 principal, 
    uint256 principal_loss
  ) 
    internal
  {
    if (principal_loss == 0) {
      validator_data[marketId].finalStake = validator_data[marketId].initialStake;
      return;
    }

    ERC4626 vault = ERC4626(vaults[id_parent[marketId]]);
    uint256 p_shares = vault.convertToShares(principal);
    uint256 p_loss_shares = vault.convertToShares(principal_loss);

    uint256 totalStaked = validator_data[marketId].totalStaked;
    uint256 newTotal = totalStaked/2 + (p_shares - p_loss_shares).divWadDown(p_shares).mulWadDown(totalStaked/2);

    ERC4626(getVaultAd(marketId)).burn(totalStaked - newTotal);
    validator_data[marketId].totalStaked = newTotal;

    validator_data[marketId].finalStake = newTotal/validator_data[marketId].validators.length;
  }

    /**
   @notice called by validators to approve resolving the market, after approval.
   */
  function validatorResolve(
    uint256 marketId
  ) external {
    require(isValidator(marketId, msg.sender), "must be validator to resolve the function");
    require(marketManager.marketActive(marketId), "market not active");
    require(!marketManager.duringMarketAssessment(marketId), "market during assessment");
    require(!validator_data[marketId].resolved[msg.sender], "validator already voted to resolve");

    validator_data[marketId].resolved[msg.sender] = true;
    validator_data[marketId].numResolved ++;
  }

  /**
   @notice called by validators when the market is resolved or denied to retrieve their stake.
   */
  function unlockValidatorStake(uint256 marketId) external {
    require(isValidator(marketId, msg.sender), "not a validator");
    require(validator_data[marketId].staked[msg.sender], "no stake");
    require(!marketManager.marketActive(marketId), "market not alive");
    require(marketManager.marketResolved(marketId), "market not resolved");

    // market early denial, no loss.
    ERC4626 vault = ERC4626(vaults[id_parent[marketId]]);
    if (marketManager.duringMarketAssessment(marketId)) {
      ERC20(getVaultAd(marketId)).safeTransfer(msg.sender, validator_data[marketId].initialStake);
      validator_data[marketId].totalStaked -= validator_data[marketId].initialStake;
    } else { // market resolved.
      ERC20(getVaultAd(marketId)).safeTransfer(msg.sender, validator_data[marketId].finalStake);
      validator_data[marketId].totalStaked -= validator_data[marketId].finalStake;
    }

    validator_data[marketId].staked[msg.sender] = false;
  }

  /// @notice called when market initialized, calculates the average price and quantities of zcb
  /// validators will buy at a discount when approving
  /// valcap = sigma * princpal.
  function _setValidatorCap(
    uint256 marketId,
    uint256 principal,
    bool isPool //??
  ) internal {
    SyntheticZCBPool bondingPool = marketManager.getBondPool(marketId);
    (,uint256 sigma,,,,,,) = marketManager.parameters(marketId);
    require(config.isInWad(sigma) && config.isInWad(principal), "paramERR");
    ValidatorData storage valdata = validator_data[marketId]; 

    uint256 valColCap = (sigma.mulWadDown(principal)); 

    // Get how much ZCB validators need to buy in total, which needs to be filled for the market to be approved 
    uint256 discount_cap = bondingPool.discount_cap();
    uint256 avgPrice = valColCap.divWadDown(discount_cap);

    valdata.val_cap = discount_cap;
    valdata.avg_price = avgPrice; 
  }

  /**
   @notice sets the amount of vt staked by a single validator for a specific market
   @dev steak should be between 1-0 wad.
   */
  function _setValidatorStake(uint256 marketId, uint256 principal) internal {
    //get vault
    ERC4626 vault = ERC4626(vaults[id_parent[marketId]]);
    uint256 shares = vault.convertToShares(principal);
    (,,,,,,,uint256 steak) = marketManager.parameters(marketId);
    validator_data[marketId].initialStake = steak.mulWadDown(shares);
  }

  function hasApproved(uint256 marketId, address validator) view public returns (bool) {
    return validator_data[marketId].staked[validator];
  }

  /**
   @notice called by marketManager.redeemDeniedMarket, redeems the discounted ZCB
   */
  function deniedValidator(uint256 marketId, address validator) onlyManager external returns (uint256 collateral_amount) {
    //??? is this correct
    collateral_amount = validator_data[marketId].sales[validator].mulWadDown(validator_data[marketId].avg_price);
    delete validator_data[marketId].sales[validator];
  }

  function redeemValidator(uint256 marketId, address validator) onlyManager external {
    delete validator_data[marketId].sales[validator]; 
  }

  function getValidatorRequiredCollateral(uint256 marketId) public view returns(uint256){
    uint256 val_cap =  validator_data[marketId].val_cap;
    (uint256 N,,,,,,,) = marketManager.parameters(marketId);
    uint256 zcb_for_sale = val_cap/N; 
    return zcb_for_sale.mulWadDown(validator_data[marketId].avg_price); 
  }
  /*----Reputation Logic----*/
  mapping(address=>uint256) public trader_scores; // trader address => score
  mapping(address=>bool) public isRated;
  address[] public traders;

  /**
   @notice calculates whether a trader meets the requirements to trade during the reputation assessment phase.
   @param percentile: 0-100 w/ WAD.
   */
  function isReputable(address trader, uint256 percentile) view external returns (bool) {
    uint256 k = _findTrader(trader);
    uint256 n = (traders.length - (k+1))*config.WAD;
    uint256 N = traders.length*config.WAD;
    uint256 p = uint256(n).divWadDown(N)*10**2;

    if (p >= percentile) {
      return true;
    } else {
      return false;
    }
  }

  /**
   @notice finds the first trader within the percentile
   @param percentile: 0-100 WAD
   @dev returns 0 on no minimum threshold
   */
  function calculateMinScore(uint256 percentile) view external returns (uint256) {
    uint256 l = traders.length * config.WAD;
    if (percentile / 1e2 == 0) {
      return 0;
    }
    uint256 x = l.mulWadDown(percentile / 1e2);
    x /= config.WAD;
    return trader_scores[traders[x - 1]];
  }

  function setTraderScore(address trader, uint256 score) external {
    uint256 prev_score = trader_scores[trader];
    if (score > prev_score) {
      _incrementScore(trader, score - prev_score);
    } else if (score < prev_score) {
      _decrementScore(trader, prev_score - score);
    }
  }

  /**
   @dev percentile is is wad 0-100
   @notice returns a list of top X percentile traders excluding the utilizer. 
   */
  function _filterTraders(uint256 percentile, address utilizer) view public returns (address[] memory) {
    uint256 l = traders.length * config.WAD;
    
    // if below minimum percentile, return all traders excluding the utilizer
    if (percentile / 1e2 == 0) {
      console.log("here");
      if (isRated[utilizer]) {
        address[] memory result = new address[](traders.length - 1);

        uint256 j = 0;
        for (uint256 i=0; i<traders.length; i++) {
          if (utilizer == traders[i]) {
            j = 1;
            continue;
          }
          result[i - j] = traders[i];
        }
        return result;
      } else {
        return traders;
      }
    }

    uint256 x = l.mulWadDown((config.WAD*100 - percentile) / 1e2);
    x /= config.WAD;

    address[] memory selected; 
    if (utilizer == address(0) || !isRated[utilizer]) {
      selected = new address[](x);
      for (uint256 i=0; i<x; i++) {
        selected[i] = traders[i];
      }
    } else {
      selected = new address[](x - 1);
      uint256 j=0;
      for (uint256 i = 0; i<x; i++) {
        if (traders[i] == utilizer) {
          j = 1;
          continue;
        }
        selected[i - j] = traders[i];
      }
    }

    return selected;
  }

  /**
   @notice retrieves all rated traders
   */
  function getTraders() public returns (address[] memory) {
    return traders;
  }

  /**
   @notice increments trader's score
   @dev score >= 0, update > 0
   */
  function _incrementScore(address trader, uint256 update) public {
    trader_scores[trader] += update;
    _updateRanking(trader, true);
  }

  /**
   @notice decrements trader's score
   @dev score >= 0, update > 0
   */
  function _decrementScore(address trader, uint256 update) public {
    if (update >= trader_scores[trader]) {
      trader_scores[trader] = 0;
    } else {
      trader_scores[trader] -= update;
    }
    _updateRanking(trader, false);
  }

  /**
   @notice updates top trader array
   */
  function _updateRanking(address trader, bool increase) internal {
    uint256 score = trader_scores[trader];

    if (!isRated[trader]) {
      isRated[trader] = true;
      if (traders.length == 0) {
        traders.push(trader);
        return;
      }
      for (uint256 i=0; i<traders.length; i++) {
        if (score > trader_scores[traders[i]]) {
          traders.push(address(0));
          _shiftRight(i, traders.length-1);
          traders[i] = trader;
          return;
        }
        if (i == traders.length - 1) {
          traders.push(trader);
          return;
        }
      }
    } else {
      uint256 k = _findTrader(trader);
      //swap places with someone.
      if ((k == 0 && increase)
      || (k == traders.length - 1 && !increase)) {
        return;
      }

      if (increase) {
        for (uint256 i=0; i<k; i++) {
          if (score > trader_scores[traders[i]]) {
            _shiftRight(i,k);
            traders[i] = trader;
            return;
          }
        }
      } else {
        for (uint256 i=traders.length - 1; i>k; i--) {
          if (score < trader_scores[traders[i]]) {
            _shiftLeft(k, i);
            traders[i] = trader;
            return;
          }
        }
      }
    }
  }

  function _findTrader(address trader) internal view returns (uint256) {
    for (uint256 i=0; i<traders.length; i++) {
      if (trader == traders[i]) {
        return i;
      }
    }
  }

  /**
   @notice 
   */
  function _shiftRight(uint256 pos, uint256 end) internal {
    for (uint256 i=end; i>pos; i--) {
      traders[i] = traders[i-1];
    }
  }

  function _shiftLeft(uint256 pos, uint256 end) internal {
    for (uint256 i=pos; i<end; i++) {
      traders[i] = traders[i+1];
    }
  }

  function pullLeverage(uint256 marketId, uint256 amount) external onlyManager{
    getVault(marketId).trusted_transfer(amount, address(marketManager)); 
  }

  function getMarketId(address recipient) public view returns(uint256){
    return ad_to_id[recipient];
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

  function marketIdToVaultId(uint256 marketId) public view returns(uint256){
    return id_parent[marketId]; 
  }
  function getMarketIds(uint256 vaultId) public view returns (uint256[] memory) {
    return vault_to_marketIds[vaultId];
  }
  function max(uint256 a, uint256 b) internal pure returns (uint256) {
      return a >= b ? a : b;
  }
  function min(uint256 a, uint256 b) internal pure returns (uint256) {
      return a <= b ? a : b;
  }
}

