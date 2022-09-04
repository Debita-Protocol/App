pragma solidity ^0.8.4;

import {Vault} from "../vaults/vault.sol";
import {MarketManager} from "./marketmanager.sol";
import {Controller} from "./controller.sol";


/// @notice Anyone can create a vault. These can be users who  
/// a) want exposure to specific instrument types(vault that focuses on uncollateralized RWA loans)
/// b) are DAOs that want risk assessment/structuring for their treasuries that need management.(i.e almost all stablecoin issuers)
/// c) a vault for any long-tailed assets 
/// d) managers who wants leverage for yield opportunities on a specific asset 
/// e) uncollateralized lending platforms that wants to delegate the risk underwriting 
/// etc
/// They need to specify 
/// 1. Vault mint conditions-> such as verified LPs(managers) only, 
/// 2. default parameters of the market(like alpha, which determines level of risk&profit separation between vault/managers)
/// 3. Vault underlying 
/// @dev only need a vault factory since marketId can be global, and all marketId will have a vaultId as it's parent

contract VaultFactory{

  address owner; 
  mapping(address=>bool) private _isVault; 

  uint256 public numVaults; 
  Controller controller; 

  constructor(address _controller){
    owner = msg.sender; 
    controller = Controller(_controller); 
  }

  function isVault(address v) external view returns(bool){
    return _isVault[v]; 
  }

  modifier onlyController(){
      require(address(controller) == msg.sender || msg.sender == owner || msg.sender == address(this), "is not controller"); 
      _;
  }

  function newVault(
    address underlying, 
    address controller, 

    //Vault mint conditions
    bool _onlyVerified, 
    uint256 _r, 
    uint256 _mint_limit,
    uint256 _total_mint_limit, 

    //Default Market Parameters
    MarketManager.MarketParameters memory default_params

    ) external onlyController returns(Vault, uint256){
    Vault vault = new Vault(
      underlying,
       controller, 
       owner, 
       //Params 
       _onlyVerified,  _r, _mint_limit, _total_mint_limit,
       default_params 

       ); 
    _isVault[address(vault)] = true; 
    numVaults++; 

    return (vault, numVaults); 

  }




}