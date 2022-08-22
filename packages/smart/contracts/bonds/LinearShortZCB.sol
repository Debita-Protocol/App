pragma solidity ^0.8.4;
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import "hardhat/console.sol";
//import "../prb/PRBMathUD60x18.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {LinearBondingCurve} from "./LinearBondingCurve.sol"; 
import {MarketManager} from "../stablecoin/marketmanager.sol"; 

/// @notice this contract allows tokenized short positions at a price 1-zcb
/// 1 shortZCB is a representation of borrowing+ selling 1 longZCB  
/// ex. when longZCB price is 0.9, shortZCB is 0.1
/// 1. trader transfer total x amount, 0.1 per shortZCB to this contract 
/// 2. this contract borrow+sell from marketmanager, y amount of collateral sent back here
/// 3. x+y should equal (supply - sold supply), 
/// at maturity funds here will be burned and redeemed amount will be minted just like longZCB 
contract LinearShortZCB is OwnedERC20{

	using FixedPointMathLib for uint256;
 	using SafeERC20 for ERC20;

	ERC20 collateral;

	uint256 math_precision; 
	uint256 collateral_dec; 
	uint256 marketId; 
	uint256 reserves;  
	LinearBondingCurve LongZCB;



  constructor (
    string memory name,
    string memory symbol,
    address owner, // market manager.
    address _collateral, //vault tokens ,

    address LongZCB_address, 
    uint256 _marketId
)  OwnedERC20(name, symbol, owner) {
    collateral = ERC20(_collateral); 
    math_precision = 1e18;
    collateral_dec = collateral.decimals();
    collateral.approve(owner, 10*(10**8)* collateral_dec); 
    LongZCB = LinearBondingCurve(LongZCB_address); 
    marketId = _marketId; 

  }

  function getCollateral() public view returns(address){
  	return address(collateral);
  }

  /// @notice maximum possiblesell amount given current reserves
  /// should be instead maximum possible borrow amount 
  function getMaxShortAmount() public view returns(uint256){
  	uint256 c = LongZCB.getTotalZCB(); 
   	(uint256 a, uint256 b) = LongZCB.getParams(); 

  	return c - (a/2).mulWadDown(c.mulWadDown(c)) - b.mulWadDown(c); 

  }

  /// @notice calculates amount of ZCB to sell given collateral for shorts
  /// @param amount in collateral dec
  /// returns in 18 dec shortZCB amount 
  function calculateAmountGivenSell(uint256 amount) public view returns(uint256,uint256){
  	uint256 amount_ = amount * 10**(18-collateral_dec); 
  	uint256 c = LongZCB.getTotalZCB(); 

  	console.log('c', c);

  	(uint256 a, uint256 b) = LongZCB.getParams(); 
  	uint256 x = (math_precision-b).mulWadDown(math_precision-b); 	

  	uint256 q = 2*a.mulWadDown(c);
  	uint256 w = (a.mulWadDown(a)).mulWadDown(c.mulWadDown(c)); 
  	uint256 e = q.mulWadDown(b); 
  	uint256 t = 2*a.mulWadDown(amount_);
  	// uint256 rhs = ((x - q+w+e+t)*math_precision).sqrt(); 

  	// console.log('rhs', rhs); 
  	uint256 numerator; 
  	unchecked {numerator = (math_precision - b) - (((x - q+w+e+t)*math_precision).sqrt()) ;} 
   	if (numerator >= 2**255 ) revert('Not enough liquidity'); 

   	uint256 cprime = numerator.divWadDown(a);
   	console.log('cprime', cprime, c); 

   	return ((c -cprime), cprime); 


  }

	/// @notice called from the marketmanager 
	function trustedShort(
		address trader, 
		uint256 collateral_amount) public onlyOwner returns (uint256) {

		(uint256 shortTokensToMint, uint256 supply_after_sell)  = calculateAmountGivenSell(collateral_amount); 
		collateral.safeTransferFrom(trader, address(this), collateral_amount); 

		MarketManager marketmanager = MarketManager(owner); 
		marketmanager.borrow_for_shortZCB(marketId, shortTokensToMint);  
		uint256 amountOut = marketmanager.sell(marketId, shortTokensToMint); 
		console.log('amountout', amountOut, collateral_amount);
		console.log('supply_after_sell', supply_after_sell); 

    //amountOut + collateral_amount should equal shortTokensToMint 
    _mint(trader, shortTokensToMint); 

    reserves += (collateral_amount + amountOut); 
    return shortTokensToMint; 

	}


 	/// @notice amount is in collateral 
	function calculateAveragePrice(uint256 amount) public view returns(uint256, uint256){
		(uint256 shortTokenAmount, uint256 k) = calculateAmountGivenSell(amount); 
		return ((amount * 10**(18-collateral_dec)).divWadDown(shortTokenAmount),shortTokenAmount) ; 
	}


 

}