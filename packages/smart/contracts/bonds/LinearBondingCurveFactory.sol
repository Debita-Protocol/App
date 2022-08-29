pragma solidity ^0.8.4;
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import {LinearBondingCurve} from "./LinearBondingCurve.sol"; 
import {LinearShortZCB} from "./LinearShortZCB.sol"; 

/// @notice need to separate factories because of contract size error 
contract LinearBondingCurveFactory{

  address controller; 
  constructor(){
    controller = msg.sender; 
  }

  function newLongZCB(
    string memory name, 
    string memory symbol,
    address marketmanager_address,
    address vault_address, 
    uint256 P, 
    uint256 I, 
    uint256 sigma
    ) external returns(OwnedERC20){

    OwnedERC20 zcb = new LinearBondingCurve(
    name,
    symbol,
    marketmanager_address, // owner
    vault_address,  
    P,
    I,
    sigma
  );
    return zcb; 
  }

  function newShortZCB(
    string memory name,
    string memory symbol, 
    address marketmanager_address, 
    address vault_address, 
    address longZCBaddress, 
    uint256 marketId
    ) external returns (OwnedERC20){

    OwnedERC20 shortZCB = new LinearShortZCB(
      name, symbol, marketmanager_address, vault_address, longZCBaddress, marketId); 
    return shortZCB;
  }





}