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

  /**
   @notice creates vault
   @param underlying: underlying asset for vault
   @param _controller: protocol controller
   @param _onlyVerified: only verified users can mint shares
   @param _r: minimum reputation score to mint shares
   @param _asset_limit: max number of shares for a single address
   @param _total_asset_limit: max number of shares for entire vault
   @param default_params: default params for markets created by vault
   */
  function newVault(
    address underlying, 
    address _controller,
    bool _onlyVerified, 
    uint256 _r, 
    uint256 _asset_limit,
    uint256 _total_asset_limit,
    MarketManager.MarketParameters memory default_params
  ) external onlyController returns(Vault, uint256) {
    require(default_params.alpha >= 1e16, "Alpha too small"); 
    
    Vault vault = new Vault(
      underlying,
       _controller, 
       owner, 
       //Params 
       _onlyVerified,  _r, _asset_limit, _total_asset_limit,
       default_params 

       ); 
    _isVault[address(vault)] = true; 
    numVaults++; 

    return (vault, numVaults); 

  }
}