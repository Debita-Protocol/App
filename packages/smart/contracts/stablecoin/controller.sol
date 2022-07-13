pragma solidity ^0.7.6;
pragma abicoder v2;
import "../rewards/MasterChef.sol";
import "./ILendingPool.sol";
import "./IManager.sol";
//Manager contract responsible for providing initial liquidity to the
//borrower cds market, collect winnings when default, and burn the corresponding DS
contract Manager is IManager {
    using SafeMath for uint256;

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
    ILendingPool lendingpool; 

    /* ========== MODIFIERS ========== */
    modifier onlyValidator() {
        require(validators[msg.sender] == true, "Only Validators can call this function");
        _;
    }

    modifier onlyPools() {
        require(pools[msg.sender] == true, "Only Pools can call this function");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == creator_address, "Only Pools can call this function");
        _;
    }
    constructor (
        address _creator_address,
        address _timelock_address,
        address _MasterChef_address, 
        address _LendingPool_address, 
        address _DS_address
    )   
    {   // _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        // DEFAULT_ADMIN_ADDRESS = _msgSender();
        // _grantRole(DEFAULT_ADMIN_ROLE, _creator_address);
        creator_address = _creator_address;
        MasterChef_address=_MasterChef_address;

        MasterChef masterchef = MasterChef(_MasterChef_address);
        ILendingPool lendingpool = ILendingPool(_LendingPool_address); 
        // IERC20Full DScontract = DS(_DS_address);

    } 

    //Pool added when contract is deployed 
    function addPool(address pool_address) external override onlyOwner {
        require(pool_address != address(0), "Zero address detected");
        require(pools[pool_address] == false, "Address already exists");

        pools[pool_address] = true; 
        pools_array.push(pool_address);

    }

    //Validator should be added for each borrower
    function addValidator(address validator_address) external override onlyPools {
        require(validator_address != address(0), "Zero address detected");
        require(validators[validator_address] == false, "Address already exists");

        validators[validator_address] = true; 
        validators_array.push(validator_address);

    }

    //provide initial liquidity when market is created
    //allow lendingpool to mint DS to manager address, 
    //liquidityAmountUSD determines how much IL loss Debita is willing to take,
    //which depends on interest rate proposed + principal value of borrowers 
    //It will be computed offchain for now
    function initiateMarket(address ammFactoryAddress,
             address marketFactoryAddress, uint256 marketID,
               uint256 liquidityAmountUSD ) external override onlyValidator {

        AMMFactory amm = AMMFactory(ammFactoryAddress);
        AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);

        LiquidityInfo memory info = LiquidityInfo({
            lptokenamount: 100, 
            suppliedDS: liquidityAmountUSD
            }); 

        lpinfo[marketFactoryAddress][marketID] = info; 

        //Minting DS
        lendingpool.managerMintDS(liquidityAmountUSD); 
        AbstractMarketFactoryV3(marketFactoryAddress).collateral().approve(address(masterchef), liquidityAmountUSD);

        //Adding minted DS as liquidity to the created market 
        masterchef.addLiquidity(amm, marketFactory, marketID, 
            liquidityAmountUSD, 0, address(this));


    }


    //Ends market when default occurs OR all loan is payed 
    //first withdraw all liquidity
    //Then if default, handle default 
    //If not default, handle not default-> just burn 
    //Market is first resolved, and winning outcome is determined before this funciton is called 
    function resolveMarket(address ammFactoryAddress, 
    	address marketFactoryAddress, uint256 marketID, bool isDefault) external override onlyValidator{
        uint256 _collateralOut;
        uint256[] memory _balances; 
    	
    	AMMFactory amm = AMMFactory(ammFactoryAddress);
    	AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);
    	uint256 lptokensIn = lpinfo[marketFactoryAddress][marketID].lptokenamount; 

        require(marketFactory.isMarketResolved(marketID), "Market is not resolved"); 

    	(_collateralOut, _balances) = masterchef.removeLiquidity(amm, 
    								marketFactory,
    								marketID, lptokensIn, 0, address(this)
    								 );

        uint256 initialSuppliedDS = lpinfo[marketFactoryAddress][marketID].suppliedDS; 

        if (isDefault){
            require(_collateralOut > initialSuppliedDS, "Payout not sufficient"); 
        }

        //Whether initial supplied DS is greater or less than payout, they need to be all burned
        //if greater, IL loss is transferred to shortCDS buyers, 
        //if less, then short cds buyer's collateral is used as payout
        lendingpool.managerBurnDS(_collateralOut); 

    	// if (isDefault){
    	// 	return handleDefault(marketFactoryAddress, marketID, _collateralOut);
    	// }

    	// else {
    	// 	return handleNoDefault(markee);
    	// }

    }


    //Market needs to be resolved and DS liquidity withdrawn before being called, 
    //withdrawn liquidity should be GREATER than initially supplied liquidity, 
    //which will be burnt from circulation
    // function handleDefault(address marketFactoryAddress, uint256 marketID, uint256 payout) internal{
    // 	AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);

        
    //     uint256 initialSuppliedDS = lpinfo[marketFactoryAddress][marketID].liquidityAmountUSD; 
    //     require(payout > initialSuppliedDS, "Payout not sufficient"); 

    //     lendingpool.managerBurnDS(payout); 




    // }

    //
    // function handleNoDefault(address marketFactoryAddress, uint256 marketID) internal{
    // 	AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);
    // 	//supplieedDS-withdrawn liquidity is the impermanent loss, given to the 
    // 	//short CDS holders in the form of a premium, 


    // 	burn()

    // }    //When default,need to collect longCDS winnings from the market 
    // function collectWinnings() internal {


    // }

}