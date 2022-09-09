pragma solidity ^0.8.4;

import {Auth} from "./auth/Auth.sol";
import {ERC4626} from "./mixins/ERC4626.sol";

import {SafeCastLib} from "./utils/SafeCastLib.sol";
import {SafeTransferLib} from "./utils/SafeTransferLib.sol";
import {FixedPointMathLib} from "./utils/FixedPointMathLib.sol";

import {ERC20} from "./tokens/ERC20.sol";
import {Instrument} from "./instrument.sol";
import {Controller} from "../protocol/controller.sol";
import {MarketManager} from "../protocol/marketmanager.sol"; 
import "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";


contract Vault is ERC4626, Auth{
    using SafeCastLib for uint256; 
    using SafeTransferLib for ERC20;
    using FixedPointMathLib for uint256;


    event InstrumentDeposit(address indexed user, Instrument indexed instrument, uint256 underlyingAmount);
    event InstrumentWithdrawal(address indexed user, Instrument indexed instrument, uint256 underlyingAmount);
    event InstrumentTrusted(address indexed user, Instrument indexed instrument);
    event InstrumentDistrusted(address indexed user, Instrument indexed instrument);
    event InstrumentHarvest(address indexed instrument, uint256 instrument_balance, uint256 mag, bool sign); //sign is direction of mag, + or -.

    /*///////////////////////////////////////////////////////////////
                                 CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 internal BASE_UNIT;
    uint256 totalInstrumentHoldings; //total holdings deposited into all Instruments collateral
    ERC20 public immutable UNDERLYING;
    Controller private controller;
    MarketManager.MarketParameters default_params; 

    ///// For Factory
    bool onlyVerified; 
    uint256 r; //reputation ranking  
    uint256 mint_limit; 
    uint256 total_mint_limit; 

    mapping(Instrument => InstrumentData) public getInstrumentData;
    mapping(address => uint256) public  num_proposals;
    mapping(uint256=> Instrument) Instruments; //marketID-> Instrument

    enum InstrumentType {
        CreditLine,
        Other
    }

    /// @param trusted Whether the Instrument is trusted.
    /// @param balance The amount of underlying tokens held in the Instrument.
    struct InstrumentData {
        // Used to determine if the Vault will operate on a Instrument.
        bool trusted;
        // Balance of the contract denominated in Underlying, 
        // used to determine profit and loss during harvests of the Instrument.  
        // represents the amount of debt the Instrument has incurred from this vault   
        uint248 balance; // in underlying
        uint256 faceValue; // in underlying
        uint256 marketId;
        uint256 principal; //this is total available allowance in underlying
        uint256 expectedYield; // total interest paid over duration in underlying
        uint256 duration;
        string description;
        address Instrument_address;
        InstrumentType instrument_type;
        uint256 maturityDate;
    }

    constructor(
        address _UNDERLYING,
        address _controller, 
        address owner, 

        bool _onlyVerified, //
        uint256 _r, //reputation ranking
        uint256 _mint_limit, 
        uint256 _total_mint_limit,

        MarketManager.MarketParameters memory _default_params

    )
        ERC4626(
            ERC20(_UNDERLYING),
            string(abi.encodePacked("debita ", ERC20(_UNDERLYING).name(), " Vault")),
            string(abi.encodePacked("db", ERC20(_UNDERLYING).symbol()))
        )  Auth(owner)

    {
        UNDERLYING = ERC20(_UNDERLYING);
        //BASE_UNIT = 10**ERC20(_UNDERLYING).decimals();
        BASE_UNIT = 10**18; 
        controller = Controller(_controller);
        set_minting_conditions( _onlyVerified,  _r, _mint_limit, _total_mint_limit); 
        default_params = _default_params; 
        //totalSupply = type(uint256).max;
    }
    
    modifier onlyController(){
        require(address(controller) == msg.sender || msg.sender == owner || address(this) == msg.sender ,  "is not controller"); 
        _;
    }

    /// @notice called by controller at maturity 
    function controller_burn(uint256 amount, address bc_address) external onlyController {
        _burn(bc_address,amount); 
    }
    /// @notice called by controller at maturity, since redeem amount > balance in bc
    function controller_mint(uint256 amount, address to) external onlyController {
        _mint(to , amount); 
    }

    /// @notice burns all balance of address 
    function burnAll(address to) private{
      _burn(to, balanceOf[to]); 
    }



    /// @notice Harvest a trusted Instrument, records profit/loss 
    function harvest(address instrument) public {
        require(getInstrumentData[Instrument(instrument)].trusted, "UNTRUSTED_Instrument");
        
        uint256 oldTotalInstrumentHoldings = totalInstrumentHoldings; 
        
        uint256 balanceLastHarvest = getInstrumentData[Instrument(instrument)].balance;
        
        uint256 balanceThisHarvest = Instrument(instrument).balanceOfUnderlying(address(instrument));
        
        if (balanceLastHarvest == balanceThisHarvest) {
            return;
        }
        
        getInstrumentData[Instrument(instrument)].balance = balanceThisHarvest.safeCastTo248();

        uint256 delta;
       
        bool net_positive = balanceThisHarvest >= balanceLastHarvest;
        
        delta = net_positive ? balanceThisHarvest - balanceLastHarvest : balanceLastHarvest - balanceThisHarvest;

        totalInstrumentHoldings = net_positive ? oldTotalInstrumentHoldings + delta : oldTotalInstrumentHoldings - delta;

        emit InstrumentHarvest(instrument, balanceThisHarvest, delta, net_positive);
    }

    /// @notice Deposit a specific amount of float into a trusted Instrument.
    /// Called when market is approved. 
    /// Also has the role of granting a credit line to a credit-based Instrument like uncol.loans 
    function depositIntoInstrument(uint256 marketId, uint256 underlyingAmount) internal{
      Instrument instrument = fetchInstrument(marketId); 
      require(getInstrumentData[instrument].trusted, "UNTRUSTED Instrument");

      if (decimal_mismatch) underlyingAmount = decSharesToAssets(underlyingAmount); 
      console.log('underlying', underlyingAmount); 
      totalInstrumentHoldings += underlyingAmount; 

      getInstrumentData[instrument].balance += underlyingAmount.safeCastTo248();

      require(UNDERLYING.transfer(address(instrument), underlyingAmount), "DEPOSIT_FAILED");

      emit InstrumentDeposit(msg.sender, instrument, underlyingAmount);
    }

    /// @notice Withdraw a specific amount of underlying tokens from a Instrument.
    function withdrawFromInstrument(Instrument instrument, uint256 underlyingAmount) internal {
      require(getInstrumentData[instrument].trusted, "UNTRUSTED Instrument");
      
      if (decimal_mismatch) underlyingAmount = decSharesToAssets(underlyingAmount); 

      getInstrumentData[instrument].balance -= underlyingAmount.safeCastTo248();
      
      totalInstrumentHoldings -= underlyingAmount;
      
      require(instrument.redeemUnderlying(underlyingAmount), "REDEEM_FAILED");
      
      emit InstrumentWithdrawal(msg.sender, instrument, underlyingAmount);

    }

    /// @notice Stores a Instrument as trusted when its approved
    function trustInstrument(uint256 marketId) external onlyController{
      getInstrumentData[fetchInstrument(marketId)].trusted = true;

      depositIntoInstrument(marketId, fetchInstrumentData(marketId).principal);
    
      setMaturityDate(marketId);
      
      onMarketApproval(marketId);
    }

    /// @notice Stores a Instrument as untrusted
    function distrustInstrument(Instrument instrument) external onlyController {
      getInstrumentData[instrument].trusted = false; 
    }


    /// @notice returns true if Instrument is approved
    function isTrusted(Instrument instrument) public view returns(bool){
      return getInstrumentData[instrument].trusted; 
    }

    /// @notice Calculates the total amount of underlying tokens the Vault holds, excluding profit 
    function totalAssets() public view override returns(uint256){
      return totalInstrumentHoldings + totalFloat();
    }

    
    function totalFloat() public view returns (uint256) {
        return UNDERLYING.balanceOf(address(this));
    }

    function fetchInstrument(uint256 marketId) public view returns(Instrument){
      return Instruments[marketId]; 
    }

    function fetchInstrumentData(uint256 marketId) public view returns(InstrumentData memory){
        return getInstrumentData[Instruments[marketId]];
    }
    /**
     called on market denial + removal, maybe no chekcs?
     */
    function removeInstrument(uint256 marketId) internal {
        InstrumentData storage data = getInstrumentData[Instruments[marketId]];
        require(data.marketId > 0, "instrument doesn't exist");
        delete getInstrumentData[Instruments[marketId]];
        delete Instruments[marketId];
        // emit event here;
    }


    function onMarketApproval(uint256 marketId) internal {
        Instruments[marketId].onMarketApproval();
    }

    /// @notice add instrument proposal created by the Utilizer 
    /// @dev Instrument instance should be created before this is called
    /// need to add authorization
    function addProposal(
        InstrumentData memory data
    ) external onlyController {
        require(data.principal > 0, "principal must be greater than 0");
        require(data.duration > 0, "duration must be greater than 0");
        require(data.faceValue > 0, "faceValue must be greater than 0");
        require(data.principal >= BASE_UNIT, "Needs to be in decimal format"); // should be collateral address, not DS. Can't be less than 1.0 X?
        require(data.marketId > 0, "must be valid instrument");

        num_proposals[msg.sender] ++; 
        getInstrumentData[Instrument(data.Instrument_address)] = (
          InstrumentData(
            false, 
                0, 
                data.faceValue, 
                data.marketId, 
                data.principal, 
                data.expectedYield, 
                data.duration, 
                data.description, 
                data.Instrument_address,
                data.instrument_type,
                0
            )
        ); 

        Instruments[data.marketId] = Instrument(data.Instrument_address);
        assert(data.marketId !=0); 
    }

    /**
     @notice called by controller on approveMarket.
     */
    function setMaturityDate(uint256 marketId) internal {

        getInstrumentData[fetchInstrument(marketId)].maturityDate = getInstrumentData[fetchInstrument(marketId)].duration + block.timestamp;
    }

    /// @notice RESOLVE FUNCTION #1
    /// checks if instrument is ready to be resolved
    /// and locks capital inside the instrument 
    /// @dev resolving is separated into three tx 
    /// prepareResolve->beforeResolve->resolveinstrument
    function prepareResolve(uint256 marketId) external onlyController{

        Instrument _instrument = Instruments[marketId]; 
        require(isTrusted( _instrument)); 

        // This will check if instrument is ready to be resolved (i.e all debts payed, investments liquidated, etc)
        // and lock further drawdowns or usage of capital 
        _instrument.prepareWithdraw(); 
    }

    /// @notice RESOLVE FUNCTION #2
    /// records balances+PnL of instrument
    /// @dev need to store internal balance that is used to calculate the redemption price 
    function beforeResolve(uint256 marketId) external onlyController{

        Instrument _instrument = Instruments[marketId]; 
        require(isTrusted( _instrument)); 

        // Record profit/loss used for calculation of redemption price 
        harvest(address(_instrument));
        _instrument.store_internal_balance(); 

      }

    /// @notice RESOLVE FUNCTION #3
    function resolveInstrument(
        uint256 marketId
    ) external onlyController
    returns(bool, uint256, uint256) {

        Instrument _instrument = Instruments[marketId];
        require(_instrument.isLocked(), "Not Locked");  
        uint256 instrument_balance = _instrument.getMaturityBalance(); 

        //First burn all in market contracts
        burnAll(controller.getZCB_ad(marketId)); 
        burnAll(controller.getshortZCB_ad(marketId)); 
      
        InstrumentData storage data = getInstrumentData[_instrument];

        bool atLoss = instrument_balance < data.faceValue;

        uint256 total_loss = atLoss ? data.faceValue - instrument_balance : 0;
        uint256 extra_gain = !atLoss ?instrument_balance - data.faceValue : 0;

        withdrawFromInstrument(_instrument, _instrument.balanceOfUnderlying(address(_instrument)));
                
        removeInstrument(data.marketId);

        return(atLoss, extra_gain, total_loss); 
    }

    /**
     called on market denial by controller.
     */
    function denyInstrument(uint256 marketId) external onlyController {
        InstrumentData storage data = getInstrumentData[Instruments[marketId]];

        // Burn all so new can be minted  
        burnAll(controller.getZCB_ad(marketId)); 
        burnAll(controller.getshortZCB_ad(marketId)); 

        require(marketId > 0 && data.Instrument_address != address(0), "invalid instrument");

        require(!data.trusted, "can't deny approved instrument");
        
        removeInstrument(marketId);
    }


    function instrumentApprovalCondition(uint256 marketId) external view returns(bool){
      return Instruments[marketId].instrumentApprovalCondition(); 
    }



    /// TODO 
    function deduct_withdrawal_fees(uint256 amount) internal returns(uint256){
      return amount; 
    }


    /// @notice types of restrictions are: 
    /// a) verified address b) reputation scores 
    function receiver_conditions(address receiver) public view returns(bool){
        return true; 
    }

    /// @notice called when constructed, params set by the creater of the vault 
    function set_minting_conditions(
      bool _onlyVerified, 
      uint256 _r, 
      uint256 _mint_limit,
      uint256 _total_mint_limit) internal{
        onlyVerified = _onlyVerified; 
        r = _r; 
        mint_limit = _mint_limit; 
        total_mint_limit = _total_mint_limit; 
    } 


    function get_vault_params() public view returns(MarketManager.MarketParameters memory){

      return default_params; 
    }


    function beforeWithdraw(uint256 assets, uint256 shares) internal virtual override {
      require(enoughLiqudity(assets), "Not enough liqudity in vault"); 

    }

    /// @notice returns true if the vault has enough balance to withdraw or supply to new instrument
    /// (excluding those supplied to existing instruments)
    /// @dev for now this implies that the vault allows full utilization ratio, but the utilization ratio
    /// should be (soft)maxed and tunable by a parameter 
    function enoughLiqudity(uint256 amounts) public view returns(bool){
        return (UNDERLYING.balanceOf(address(this)) >= amounts); 
    }


    /// @notice function that closes instrument prematurely 
    function closeInstrument(uint256 marketId) external onlyController{
      Instrument instrument = fetchInstrument( marketId); 

      // If instrument has non-underlying tokens, liquidate them first. 
      instrument.liquidateAllPositions(); 


    }


    /// @notice a minting restrictor is set for different vaults 
    function mint(uint256 shares, address receiver) public virtual override returns (uint256 assets) {
        if (!receiver_conditions(receiver)) revert("Minting Restricted"); 
        assets = previewMint(shares); // No need to check for rounding error, previewMint rounds up.

        // Need to transfer before minting or ERC777s could reenter.
        asset.safeTransferFrom(msg.sender, address(this), assets);
   
        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, assets, shares);

        afterDeposit(assets, shares);
    }


    /// @notice apply fee before withdrawing to prevent just minting before maturities and withdrawing after 
     function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public virtual override returns (uint256 assets) {
        if (msg.sender != owner) {
            uint256 allowed = allowance[owner][msg.sender]; // Saves gas for limited approvals.

            if (allowed != type(uint256).max) allowance[owner][msg.sender] = allowed - shares;
        }

        // Check for rounding error since we round down in previewRedeem.
        require((assets = previewRedeem(shares)) != 0, "ZERO_ASSETS");

        beforeWithdraw(assets, shares);

        assets = deduct_withdrawal_fees(assets); 

        _burn(owner, shares);

        emit Withdraw(msg.sender, receiver, owner, assets, shares);

        asset.safeTransfer(receiver, assets);
    }




}