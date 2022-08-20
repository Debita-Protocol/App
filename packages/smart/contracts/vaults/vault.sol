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

    /*///////////////////////////////////////////////////////////////
                                 CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 internal BASE_UNIT;
    uint256 totalInstrumentHoldings; //total holdings deposited into all Instruments 
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
    function harvest(Instrument instrument) external requiresAuth {
        require(getInstrumentData[instrument].trusted, "UNTRUSTED_Instrument");
    	uint256 oldTotalInstrumentHoldings = totalInstrumentHoldings; 
        uint256 balanceLastHarvest = getInstrumentData[instrument].balance;
        uint256 balanceThisHarvest = instrument.balanceOfUnderlying(address(instrument));
        
        getInstrumentData[instrument].balance = balanceThisHarvest.safeCastTo248();
        uint256 profit = balanceThisHarvest - balanceLastHarvest; 

        totalInstrumentHoldings = oldTotalInstrumentHoldings + profit; 

    }

    /// @notice Deposit a specific amount of float into a trusted Instrument.
   	/// Called when market is approved. 
   	/// Also has the role of granting a credit line to a credit-based Instrument like uncol.loans 
    function depositIntoInstrument(Instrument instrument, uint256 underlyingAmount) external requiresAuth{
    	require(getInstrumentData[instrument].trusted, "UNTRUSTED Instrument");
    	totalInstrumentHoldings += underlyingAmount; 

        getInstrumentData[instrument].balance += underlyingAmount.safeCastTo248();

        UNDERLYING.transfer(address(instrument), underlyingAmount);
        emit InstrumentDeposit(msg.sender, instrument, underlyingAmount);

    }

    /// @notice Withdraw a specific amount of underlying tokens from a Instrument.
    function withdrawFromInstrument(Instrument instrument, uint256 underlyingAmount) external requiresAuth{
    	require(getInstrumentData[instrument].trusted, "UNTRUSTED Instrument");
        getInstrumentData[instrument].balance -= underlyingAmount.safeCastTo248();
        totalInstrumentHoldings -= underlyingAmount;
        require(instrument.redeemUnderlying(underlyingAmount), "REDEEM_FAILED");
        emit InstrumentWithdrawal(msg.sender, instrument, underlyingAmount);

    }


    /// @notice Withdraws all underyling balance from the Instrument to the vault 
    function withdrawAllFromInstrument(Instrument instrument) external requiresAuth{
    	uint248 total_Instrument_balance = instrument.balanceOfUnderlying(address(instrument)).safeCastTo248();
    	uint248 current_balance =  getInstrumentData[instrument].balance;
    	getInstrumentData[instrument].balance -= Math.min(total_Instrument_balance, current_balance).safeCastTo248();
    	instrument.redeemUnderlying(total_Instrument_balance);

    }

    /// @notice Stores a Instrument as trusted when its approved
    function trustInstrument(Instrument instrument) external requiresAuth{
    	getInstrumentData[instrument].trusted = true;

    }

    /// @notice Stores a Instrument as untrusted
    function distrustInstrument(Instrument instrument) external requiresAuth{
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

    function onMarketApproval(uint256 marketId) external requiresAuth {
        Instruments[marketId].onMarketApproval();
    }

    /// @notice add instrument proposal created by the Utilizer 
    /// @dev Instrument instance should be created before this is called 
    function addProposal(
        InstrumentData memory data
    ) external {
        require(data.principal > 0, "principal must be greater than 0");
        require(data.duration > 0, "duration must be greater than 0");
        require(data.faceValue > 0, "faceValue must be greater than 0");
        require(data.principal >= BASE_UNIT, "Needs to be in decimal format"); // should be collateral address, not DS. Can't be less than 1.0 X?
   

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
                data.instrument_type
            )
        	); 

        Instruments[data.marketId] = Instrument(data.Instrument_address);
    }

    /**
     @notice called by instrument on resolution
     */
    function resolveMarket(
        bool atLoss,
        uint256 extra_gain,
        uint256 total_loss
    ) external {
        require(getInstrumentData[Instrument(msg.sender)].marketId != 0, "caller is not active instrument");
        controller.resolveMarket(getInstrumentData[Instrument(msg.sender)].marketId, atLoss, extra_gain, total_loss);
    }
}