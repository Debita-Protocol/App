pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./owned.sol";

contract DS is ERC20, Owned {

  mapping(address => bool) pools;

  address[] public pools_array;
  address deployer_address; 
  address timelock_address; 

  uint256 genesis_supply = 1000000e18;



  constructor(string memory _name,
        string memory _symbol,
        address _deployer_address,
        address _timelock_address) ERC20(_name, _symbol) Owned(_deployer_address) {

    deployer_address = _deployer_address;
    timelock_address = _timelock_address; 

    _mint(_deployer_address, genesis_supply);



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

  function dss_price() public view returns(uint256){
    return 1e6; 
  }

  function get_collateral_ratio() public view returns(uint256){
    return 1e6;
  }




  function pool_mint(address to, uint256 amount) public onlyPools {
    _mint(to, amount);
  }

  function pool_burn(address account, uint256 amount) public onlyPools {
   _burn(account, amount);
  }


}