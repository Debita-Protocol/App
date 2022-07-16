pragma solidity ^0.8.4;

import "../stablecoin/DS.sol"; 
import "../stablecoin/owned.sol";
import "../stablecoin/TransferHelper.sol";

import "./stakedDS.sol";
import "../ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract StakingPool is Owned{


    using SafeMath for uint256;

    address ds_address; 
    address collateral_address; 
    address creator_address; 

    ERC20 private collateral_token;
    DS private DScontract;
    sDS private sDScontract;

    uint256 missing_decimals; 

   mapping(address=>bool)  userStaked; 
   constructor (
        address _ds_address,
        address _collateral_address,
        address _creator_address,

        address _sDS_address
        
    ) public Owned(_creator_address){
        require(
            (_ds_address != address(0))
            && (_collateral_address != address(0))
            && (_creator_address != address(0))
        , "Zero address detected"); 
        DScontract = DS(_ds_address);
        sDScontract = sDS(_sDS_address);
        collateral_token = ERC20(_collateral_address); 

        ds_address = _ds_address; 
        collateral_address = _collateral_address; 
        creator_address = _creator_address; 

    
        missing_decimals = uint(18).sub(collateral_token.decimals());
        
        
    }
	function stake(uint256 amount) public virtual{
		uint256 exchange_rate = get_exchange_rate();
        TransferHelper.safeTransferFrom(address(ds_address), msg.sender, address(sDScontract), amount);
        sDScontract.mint(msg.sender, amount, exchange_rate); 

        userStaked[msg.sender] = true; 


	}

	function withdraw(uint256 amount) public virtual{
		uint256 exchange_rate = get_exchange_rate();

		sDScontract.burn(msg.sender, amount, exchange_rate);

		if (sDScontract.balanceOf(msg.sender) == 0){
		userStaked[msg.sender] = false; 
		}


	}
	function get_exchange_rate() private returns(uint256){
		return 1e6; 
	}
}