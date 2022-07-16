pragma solidity ^0.8.4;

//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../ERC20/ERC20.sol";
import "../stablecoin/owned.sol";
import "../stablecoin/TransferHelper.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
//import "../stablecoin/safemath.sol";


contract sDS is ERC20, Owned {

  mapping(address => bool) pools;
   using SafeMath for uint256;

  address[] public pools_array;
  address deployer_address; 
  address timelock_address; 
  address ds_address; 


  constructor(string memory _name,
        string memory _symbol,
        address _deployer_address,
        address _timelock_address,
        address _ds_address) ERC20(_name, _symbol) Owned(_deployer_address) {

    deployer_address = _deployer_address;
    timelock_address = _timelock_address; 
    ds_address = _ds_address; 

  }

  modifier onlyByOwner() {
        require(msg.sender == owner , "Not the owner, controller, or the governance timelock");
        _;
    }
  
  modifier onlyPools() {
     require(pools[msg.sender] == true, "Only pools can call this function");
      _;
  } 

  function addPool(address pool_address) public onlyByOwner {
      require(pool_address != address(0), "Zero address detected");

      require(pools[pool_address] == false, "Address already exists");
      pools[pool_address] = true; 
      pools_array.push(pool_address);

      //emit PoolAdded(pool_address);
  }


  function mint(address to, uint256 amount, uint256 exchange_rate) public onlyPools {
  	uint256 amountScaled = amount.mul(uint(1e6)).div(exchange_rate); //exchange_rate >=1

    _mint(to, amountScaled);
  }

  function burn(address account, uint256 amount, uint256 exchange_rate) public onlyPools {
  	uint256 amountScaled =amount.mul(uint(1e6)).div(exchange_rate);
   _burn(account, amount);
	TransferHelper.safeTransfer(ds_address, account ,amountScaled); 

  }


}