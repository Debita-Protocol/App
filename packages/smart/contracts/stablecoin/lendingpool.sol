pragma solidity 0.7.6;

import "./owned.sol";
import "./DS.sol"; 
import "./DSS.sol"; 
import "./TransferHelper.sol";

//import "hardhat/console.sol";


contract LendingPool is Owned{

    using SafeMath for uint256;

    address ds_address; 
    address dss_address; 
    address collateral_address; 
    address creator_address; 
    address timelock_address; 


    uint256 pool_ceiling;
    uint256 bonus_rate;
    uint256 redemption_delay;
    uint256 minting_fee;
    uint256 redemption_fee;
    uint256 buyback_fee;
    uint256 recollat_fee;
    uint256 missing_decimals; 

    uint256 private constant PRICE_PRECISION = 1e6;

    ERC20 private collateral_token;

    DS private DScontract;
    DSS private DSScontract;

    mapping (address => uint256) public redeemDSSBalances;
    mapping (address => uint256) public redeemCollateralBalances;
    uint256 public unclaimedPoolCollateral;
    uint256 public unclaimedPoolDSS;
    mapping (address => uint256) public lastRedeemed;


    modifier onlyByOwnGov() {
        require(msg.sender == timelock_address || msg.sender == owner, "Not owner or timelock");
        _;
    }

    constructor (
        address _ds_address,
        address _dss_address,
        address _collateral_address,
        address _creator_address,
        address _timelock_address
       // uint256 _pool_ceiling
        
    ) public Owned(_creator_address){
        require(
            (_ds_address != address(0))
            && (_dss_address != address(0))
            && (_collateral_address != address(0))
            && (_creator_address != address(0))
            && (_timelock_address != address(0))
        , "Zero address detected"); 
        DScontract = DS(_ds_address);
        DSScontract = DSS(_dss_address); 
        ds_address = _ds_address; 
        dss_address = _dss_address; 
        collateral_address = _collateral_address; 
        creator_address = _creator_address; 
        timelock_address = _timelock_address; 
        collateral_address = _collateral_address; 
        collateral_token = ERC20(_collateral_address); 
        
        missing_decimals = uint(18).sub(collateral_token.decimals());
        
        
    }

    function mintDS(uint256 collateral_amount, uint256 DS_out_min) external  {
        uint256 collateral_amount_d18 = collateral_amount * (10 ** missing_decimals);
      
        uint256 DS_amount_18 = collateral_amount_d18; //1to1
        DS_amount_18 = (DS_amount_18.mul(uint(1e6).sub(minting_fee))).div(uint(1e6));
        require(DS_out_min <= DS_amount_18); 

        TransferHelper.safeTransferFrom(address(collateral_token), msg.sender, address(this), collateral_amount);
        DScontract.pool_mint(msg.sender, DS_amount_18);
        
    }


    function redeemDS(uint256 DS_amount, uint256 DSS_out_min, uint256 COLLATERAL_out_min) external {
        uint256 dss_price = DScontract.dss_price();
        uint256 collateral_ratio = DScontract.get_collateral_ratio(); 
        uint256 DS_amount_18 = DS_amount.mul(10**missing_decimals);

        uint256 DS_amount_post_fee = (DS_amount.mul(uint(1e6).sub(redemption_fee))).div(uint(1e6)); 
        uint256 dss_dollar_value = DS_amount_post_fee.sub(DS_amount_post_fee.mul(collateral_ratio).div(PRICE_PRECISION)); 
        uint256 dss_amount = dss_dollar_value.mul(PRICE_PRECISION).div(dss_price); 

        uint256 DS_amount_precision = DS_amount_post_fee;
        uint256 collateral_dollar_value = DS_amount_precision.mul(collateral_ratio).div(PRICE_PRECISION);
        uint256 collateral_amount = collateral_dollar_value;//.mul(10**missing_decimals); //for now assume collateral is stable 

        redeemCollateralBalances[msg.sender] = redeemCollateralBalances[msg.sender].add(collateral_amount);
        unclaimedPoolCollateral = unclaimedPoolCollateral.add(collateral_amount);

        redeemDSSBalances[msg.sender] = redeemDSSBalances[msg.sender].add(dss_amount);
        unclaimedPoolDSS = unclaimedPoolDSS.add(dss_amount);

        lastRedeemed[msg.sender] = block.number; 
        DScontract.pool_burn(msg.sender, DS_amount_18);
        DSScontract.pool_mint(address(this), dss_amount);



    }

    function collectRedemption(uint256 col_idx) external returns (uint256 dss_amount, uint256 collateral_amount) {
        // require(redeemPaused[col_idx] == false, "Redeeming is paused");
        // require((lastRedeemed[msg.sender].add(redemption_delay)) <= block.number, "Too soon");
        bool sendDSS = false; 
        bool sendCollateral = false; 

        if (redeemDSSBalances[msg.sender]>0){
            dss_amount = redeemDSSBalances[msg.sender]; 
            redeemDSSBalances[msg.sender] = 0; 
            unclaimedPoolDSS = unclaimedPoolDSS.sub(dss_amount); 
            sendDSS = true;
        }

        if (redeemCollateralBalances[msg.sender]>0){
            collateral_amount = redeemCollateralBalances[msg.sender]; 
            redeemCollateralBalances[msg.sender] = 0; 
            unclaimedPoolCollateral = unclaimedPoolCollateral.sub(collateral_amount);
            sendCollateral = true;
        }

        if (sendDSS){
            TransferHelper.safeTransfer(address(DSScontract), msg.sender, dss_amount);
        }

        if (sendCollateral){
            TransferHelper.safeTransfer(collateral_address, msg.sender, collateral_amount);

        }

    }
    function setPoolParameters(uint256 new_ceiling, uint256 new_bonus_rate, uint256 new_redemption_delay, uint256 new_mint_fee, uint256 new_redeem_fee, uint256 new_buyback_fee, uint256 new_recollat_fee) external onlyByOwnGov {
        pool_ceiling = new_ceiling;
        bonus_rate = new_bonus_rate;
        redemption_delay = new_redemption_delay;
        minting_fee = new_mint_fee;
        redemption_fee = new_redeem_fee;
        buyback_fee = new_buyback_fee;
        recollat_fee = new_recollat_fee;

        //emit PoolParametersSet(new_ceiling, new_bonus_rate, new_redemption_delay, new_mint_fee, new_redeem_fee, new_buyback_fee, new_recollat_fee);
    }

}