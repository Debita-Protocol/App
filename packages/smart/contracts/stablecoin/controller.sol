
pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol" as OpenZeppelinOwnable;
import "../turbo/AbstractMarketFactoryV3.sol";
import "../turbo/AMMFactory.sol";

import "../Common/AccessControl.sol";
import "../turbo/AbstractMarketFactoryV3";
import "../rewards/MasterChef";


//Manager contract responsible for providing initial liquidity to the
//borrower cds market, collect winnings when default, and burn the corresponding DS
contract Manager is OpenZeppelinOwnable.Ownable, AccessControl {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct LiquidityInfo {
    	uint256 lptokenamount;
    	uint256 suppliedDS; 
    }

    mapping(address => bool) validators; 
    mapping(address => bool) pools; 

    mapping(address => mapping(uint256=> LiquidityInfo)) lpinfo; 

    address[] validators_array; 
    address[] pools_array;

    address creator_address; 
    address timelock_address;
    address MasterChef_address;

    MasterChef masterchef; 

    /* ========== MODIFIERS ========== */
    modifier onlyValidator() {
        require(validators[msg.sender] == true, "Only Validators can call this function");
        _;
    }

    modifier onlyPools() {
        require(pools[msg.sender] == true, "Only Pools can call this function");
        _;
    }

    constructor (
        address _creator_address,
        address _timelock_address,
        address _MasterChef_address
    )   Ownable(_creator_address)
    {
        creator_address = _creator_address;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        DEFAULT_ADMIN_ADDRESS = _msgSender();
        _grantRole(DEFAULT_ADMIN_ROLE, _creator_address);
        MasterChef_address=_MasterChef_address;

        masterchef = MasterChef(_MasterChef_address);

    } 

    function addPool(address pool_address) public onlyOwner {
        require(pool_address != address(0), "Zero address detected");
        require(pools[pool_address] == false, "Address already exists");

        pools[pool_address] = true; 
        pools_array.push(pool_address);

        //emit PoolAdded(pool_address);
    }


    function addValidator(address validator_address) public onlyPools {
        require(validator_address != address(0), "Zero address detected");
        require(validators[validator_address] == false, "Address already exists");

        validators[validator_address] = true; 
        validators_array.push(validator_address);

        //emit PoolAdded(pool_address);
    }

    function initateMarket() {
    	//provide initial liquidity 

    }

    function resolveMarket(address ammFactoryAddress, 
    	address marketFactoryAddress, uint256 marketID, bool isDefault) public onlyValidator{

    	//Ends market when default occurs OR all loan is payed 
    	//first withdraw all liquidity
    	//Then if default, handle default 
    	//If not default, handle not default-> just burn 
    	
    	AMMFactory amm = AMMFactory(ammFactoryAddress);
    	AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);
    	lptokensIn = lpinfo[marketFactoryAddress][marketID].lptokenamount; 

    	masterchef.removeLiquidity(ammFactory, 
    								marketFactory,
    								marketID, lptokensIn, 0, address(this)
    								 )

    	if (isDefault){
    		return handleDefault(marketFactoryAddress, marketID)
    	}

    	else {
    		return handleNoDefault(markee)
    	}

    }


    //Market needs to be resolved and DS liquidity withdrawn before being called, 
    //withdrawn liquidity will be used to burn 
    function handleDefault(address marketFactoryAddress, uint256 marketID) internal{
    	AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);




    	burn()

    }

    //
    function handleNoDefault(address marketFactoryAddress, uint256 marketID) internal{
    	AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);
    	//supplieedDS-withdrawn liquidity is the impermanent loss, given to the 
    	//short CDS holders in the form of a premium, 


    	burn()

    }    //When default,need to collect longCDS winnings from the market 
    function collectWinnings() internal {


    }

}