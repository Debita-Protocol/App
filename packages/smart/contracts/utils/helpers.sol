pragma solidity ^0.8.4;


library config{

  uint256 public constant WAD_PRECISION = 18; 
  uint256 public constant WAD = 1e18; 
  uint256 public constant USDC_dec = 1e6; 
  uint256 public constant roundLimit = 1e14; //0.0001 

  //Max amount in one transaction 
  uint256 private constant max_amount = 1e8 * WAD; 

  //Min amount in one transaction 
  uint256 private constant min_amount = WAD/1e4; 

  function convertToWad(uint256 number, uint256 dec) internal pure returns(uint256 new_number){
    //number should not be 18 dec, but in collateral_dec
    new_number = number * (10 ** (WAD_PRECISION - dec));
    assert(new_number <= max_amount); 
  }

  function wadToDec(uint256 number, uint256 dec) internal pure returns(uint256 new_number){
    // number should be 18 dec 
    assert(isInWad(number)); 
    new_number = number/(10 ** (WAD_PRECISION - dec)); 

  }

  function isInWad(uint256 number) internal pure returns(bool){
    return (number >= min_amount); 
  }




}