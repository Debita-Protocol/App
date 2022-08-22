pragma solidity ^0.8.4;

import {Auth} from "./auth/Auth.sol";
import {ERC4626} from "./mixins/ERC4626.sol";

import {SafeCastLib} from "./utils/SafeCastLib.sol";
import {SafeTransferLib} from "./utils/SafeTransferLib.sol";
import {FixedPointMathLib} from "./utils/FixedPointMathLib.sol";

import {ERC20} from "./tokens/ERC20.sol";
import {Instrument} from "./instrument.sol";
import {Controller} from "../stablecoin/controller.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";


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
        address _controller
    )
        ERC4626(
            ERC20(_UNDERLYING),
            string(abi.encodePacked("debita ", ERC20(_UNDERLYING).name(), " Vault")),
            string(abi.encodePacked("db", ERC20(_UNDERLYING).symbol()))
        )  Auth(msg.sender)

    {
        UNDERLYING = ERC20(_UNDERLYING);
        BASE_UNIT = 10**ERC20(_UNDERLYING).decimals();
        controller = Controller(_controller);

        //totalSupply = type(uint256).max;
    }
    
    modifier onlyController(){
        require(address(controller) == msg.sender || msg.sender == owner ,  "is not controller"); 
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
    function depositIntoInstrument(Instrument instrument, uint256 underlyingAmount) external onlyController{
    	require(getInstrumentData[instrument].trusted, "UNTRUSTED Instrument");
    	totalInstrumentHoldings += underlyingAmount; 

        getInstrumentData[instrument].balance += underlyingAmount.safeCastTo248();

        UNDERLYING.transfer(address(instrument), underlyingAmount);

        emit InstrumentDeposit(msg.sender, instrument, underlyingAmount);
    }

    /// @notice Withdraw a specific amount of underlying tokens from a Instrument.
    function withdrawFromInstrument(Instrument instrument, uint256 underlyingAmount) external onlyController{
    	require(getInstrumentData[instrument].trusted, "UNTRUSTED Instrument");
        
        getInstrumentData[instrument].balance -= underlyingAmount.safeCastTo248();
        
        totalInstrumentHoldings -= underlyingAmount;
        
        require(instrument.redeemUnderlying(underlyingAmount), "REDEEM_FAILED");
        
        emit InstrumentWithdrawal(msg.sender, instrument, underlyingAmount);

    }



    /// @notice Withdraws all underyling balance from the Instrument to the vault 
    function withdrawAllFromInstrument(Instrument instrument) internal {
      uint248 total_Instrument_balance = instrument.balanceOfUnderlying(address(instrument)).safeCastTo248();
      
        uint248 current_balance =  getInstrumentData[instrument].balance;
      
        getInstrumentData[instrument].balance -= Math.min(total_Instrument_balance, current_balance).safeCastTo248();
      
        instrument.redeemUnderlying(total_Instrument_balance);
    }
    /// @notice Stores a Instrument as trusted when its approved
    function trustInstrument(Instrument instrument) external onlyController{
    	getInstrumentData[instrument].trusted = true;

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


    function onMarketApproval(uint256 marketId) external onlyController {
        Instruments[marketId].onMarketApproval();
    }

    /// @notice add instrument proposal created by the Utilizer 
    /// @dev Instrument instance should be created before this is called
    /// need to add authorization
    function addProposal(
        InstrumentData memory data
    ) external {
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
    }

    /**
     @notice checks status of instrument
     returns true if resolution, false if not.
     */
    function checkInstrument(
        uint256 marketId
    ) external returns (bool) {
        InstrumentData storage data = getInstrumentData[Instruments[marketId]];
        
        require(data.marketId > 0 && data.trusted, "instrument must be active");
        require(data.maturityDate > 0, "instrument hasn't been approved yet" );

        if (block.timestamp >= data.maturityDate) {
            resolveInstrument(Instruments[marketId]);
            return true;
        }
        return false;
    }

    /**
     @notice called by controller on approveMarket.
     */
    function setMaturityDate(Instrument _instrument) external onlyController {
        getInstrumentData[_instrument].maturityDate = getInstrumentData[_instrument].duration + block.timestamp;
    }

    /**
     @notice called on resolution => checkInstrument => called by anyone, withdraws all funds to vault, triggers resolveMarket for controller.
     @dev no checks, checks performed by checkInstrument()
     */
    function resolveInstrument(
        Instrument _instrument
    ) internal {
        harvest(address(_instrument));

        InstrumentData storage data = getInstrumentData[_instrument];

        bool atLoss = data.balance < data.faceValue;

        uint256 total_loss = atLoss ? data.faceValue - data.balance : 0;
        uint256 extra_gain = !atLoss ? data.balance - data.faceValue : 0;

        withdrawAllFromInstrument(_instrument);
        controller.resolveMarket(data.marketId, atLoss, extra_gain, total_loss);
        removeInstrument(data.marketId);
    }

    /**
     called on market denial by controller.
     */
    function denyInstrument(uint256 marketId) external onlyController {
        InstrumentData storage data = getInstrumentData[Instruments[marketId]];
        
        require(marketId > 0 && data.Instrument_address != address(0), "invalid instrument");

        require(!data.trusted, "can't deny approved instrument");
        
        removeInstrument(marketId);
    }
}