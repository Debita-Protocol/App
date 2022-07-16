// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "../ERC20/ERC20Custom.sol";
import "../Common/AccessControl.sol";
import "../Common/Ownable.sol";

contract DSS is ERC20Custom, AccessControl, Ownable {
    /* ========== STATE VARIABLES ========== */
    
    address[] public pools_array;
    mapping(address => bool) pools;
    
    address public creator_address;
    address timelock_address;
    address public DEFAULT_ADMIN_ADDRESS;
    uint256 constant genesis_supply = 1000000e18;

    
    /* ========== MODIFIERS ========== */
    modifier onlyPools() {
        require(pools[msg.sender] == true, "Only pools can call this function");
        _;
    }

    constructor (
        address _creator_address,
        address _timelock_address
    )  ERC20Custom("Debita Stablecoin Share","DSS") Ownable(_creator_address)
    {
        _mint(_creator_address, genesis_supply);
        creator_address = _creator_address;
        timelock_address = _timelock_address;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        DEFAULT_ADMIN_ADDRESS = _msgSender();
        _grantRole(DEFAULT_ADMIN_ROLE, _creator_address);
    }

    function addPool(address pool_address) public onlyOwner {
        require(pool_address != address(0), "Zero address detected");

        require(pools[pool_address] == false, "Address already exists");
        pools[pool_address] = true; 
        pools_array.push(pool_address);

        //emit PoolAdded(pool_address);
    }
    
    // Used by pools when user redeems
    function pool_burn(address b_address, uint256 b_amount) public onlyPools {
        super._burn(b_address, b_amount);
    }

    function pool_mint(address m_address, uint256 m_amount) public onlyPools {
        super._mint(m_address, m_amount);
    }

    function dss_price() public view returns(uint256){
        return 1e6; 
    }

    function get_collateral_ratio() public view returns(uint256){
        return 1e6;
    }
}