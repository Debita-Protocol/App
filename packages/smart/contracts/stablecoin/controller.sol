pragma solidity ^0.7.6;
pragma abicoder v2;
import "../rewards/MasterChef.sol";
import "./ILendingPool.sol";
import "./IController.sol";
import "../turbo/TrustedMarketFactoryV3.sol";
import "hardhat/console.sol";
//Controller contract responsible for providing initial liquidity to the
//borrower cds market, collect winnings when default, and burn the corresponding DS
contract Controller is IController {
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

        masterchef = MasterChef(_MasterChef_address);
        lendingpool = ILendingPool(_LendingPool_address); 
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
    //allow lendingpool to mint DS to controller address, 
    //liquidityAmountUSD determines how much IL loss Debita is willing to take,
    //which depends on interest rate proposed + principal value of borrowers 
    //It will be computed offchain for now
    function initiateMarket(address ammFactoryAddress,
             address marketFactoryAddress, uint256 liquidityAmountUSD,
             string calldata description, string[] calldata names, 
             uint256[] calldata odds ) external override onlyValidator {

        AMMFactory amm = AMMFactory(ammFactoryAddress);
        TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketFactoryAddress);

        //TODO change create market modifier to including validators 
        uint256 marketID = marketFactory.createMarket(msg.sender, description, names, odds);

        //Minting DS
        lendingpool.controllerMintDS(liquidityAmountUSD); 
        marketFactory.collateral().approve(address(masterchef), liquidityAmountUSD);

        //Creating pool and adding minted DS as liquidity to the created market 
        masterchef.createPool(amm, marketFactory, marketID, liquidityAmountUSD, address(this));
        uint256 pooltokenamount = masterchef.getPoolTokenBalance(amm, marketFactory, marketID,
        address(this) );
       
        LiquidityInfo memory info = LiquidityInfo({
            lptokenamount: pooltokenamount, 
            suppliedDS: liquidityAmountUSD
            }); 

        lpinfo[marketFactoryAddress][marketID] = info; 


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
    	TrustedMarketFactoryV3 marketFactory = TrustedMarketFactoryV3(marketFactoryAddress);
    	uint256 lptokensIn = lpinfo[marketFactoryAddress][marketID].lptokenamount; 

        uint256 winning_outcome = isDefault? 0: 1; 
        marketFactory.trustedResolveMarket( marketID, winning_outcome); 
        //require(marketFactory.isMarketResolved(marketID), "Market is not resolved"); 

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
        lendingpool.controllerBurnDS(_collateralOut); 


        console.log(initialSuppliedDS, _collateralOut); 



    }


    //Market needs to be resolved and DS liquidity withdrawn before being called, 
    //withdrawn liquidity should be GREATER than initially supplied liquidity, 
    //which will be burnt from circulation
    // function handleDefault(address marketFactoryAddress, uint256 marketID, uint256 payout) internal{
    // 	AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);

        
    //     uint256 initialSuppliedDS = lpinfo[marketFactoryAddress][marketID].liquidityAmountUSD; 
    //     require(payout > initialSuppliedDS, "Payout not sufficient"); 

    //     lendingpool.controllerBurnDS(payout); 




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