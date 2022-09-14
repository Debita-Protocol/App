pragma solidity ^0.8.4;
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import "hardhat/console.sol";
//import "../prb/PRBMathUD60x18.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {LinearBondingCurve} from "./LinearBondingCurve.sol"; 
import {MarketManager} from "../protocol/marketmanager.sol"; 
import {BondingCurve} from "./bondingcurve.sol"; 
import {config} from "../protocol/helpers.sol"; 

/// @notice this contract allows tokenized short positions at a price 1-zcb
abstract contract ShortBondingCurve is OwnedERC20{
  using FixedPointMathLib for uint256;
  using SafeERC20 for ERC20;

  ERC20 private collateral;
  BondingCurve private LongZCB;

  uint256 math_precision; 
  uint256 collateral_dec; 
  uint256 marketId; 
  uint256 reserves;  

  constructor (
    string memory name,
    string memory symbol,
    address owner, // market manager.
    address _collateral, //vault tokens
    address LongZCB_address, 
    uint256 _marketId
)  OwnedERC20(name, symbol, owner) {
    collateral = ERC20(_collateral); 
    
    math_precision = config.WAD;  
    collateral_dec = collateral.decimals();    
    collateral.approve(owner, 10*(10**8)* collateral_dec);     
    LongZCB = BondingCurve(LongZCB_address);    
    marketId = _marketId; 

  }

  function getPair() public view returns(BondingCurve){
    return LongZCB; 
  }

  function getCollateral() public view returns(address){
    return address(collateral);
  }

  /// @notice maximum possible short amount given current reserves, denominated in collateral 
  /// should be instead maximum possible borrow amount 
  /// @dev area between the curve and 1 at current supply, c - ( 2/a*(c**2) + b*c) 
  function getMaxShortAmount() public view returns(uint256){
    uint256 c = LongZCB.totalSupplyAdjusted(); 
    (uint256 a, uint256 b) = LongZCB.getParams(); 

    return c - (a/2).mulWadDown(c.mulWadDown(c)) - b.mulWadDown(c); 
  }



  /// @notice called from the marketmanager 
  /// 1 shortZCB token is tokenization of borrowing+ selling 1 longZCB  
  /// so when longZCB price is 0.9, shortZCB is 0.1
  /// when price is 0.1, trader transfer collateral_amount to buy 0.1 per shortZCB to this contract 
  /// this contract then borrows longZCB +sell it from marketmanager, collateral from sell sent back here
  /// @dev at maturity funds here will be burned and redeemed amount will be minted just like longZCB 
  /// Function needs to follow the following
  function trustedShort(
    address trader, 
    uint256 collateral_amount,
    uint256 min_amount_out
  ) external onlyOwner returns (uint256 shortTokensToMint, uint256 supply_after_sell) {

    uint256 balance_before = collateral.balanceOf(address(this)); 

    (shortTokensToMint,
     supply_after_sell) = calculateAmountGivenSell(collateral_amount); // already calculated before
    collateral.safeTransferFrom(trader, address(this), collateral_amount); 

    // min_amount_out will automatically take care of slippage
    uint256 amountOut = LongZCB.trustedSell(address(this), shortTokensToMint, 0);
    reserves += (collateral_amount + amountOut); 

    console.log('amountout', amountOut, collateral_amount);
    console.log('supply_after_sell', supply_after_sell, shortTokensToMint);

    // Invariant #1: Value in to this contract after this trade 
    // should equal collateral_amount+amountOut = shortTokensToMint
    assert(collateral.balanceOf(address(this)) - balance_before 
          >= shortTokensToMint-config.roundLimit);  
    assert(amountOut + collateral_amount 
          >= shortTokensToMint-config.roundLimit); 
    require(min_amount_out <= shortTokensToMint, "Slippage Err"); 

    _mint(trader, shortTokensToMint); 
  }


  /// @notice called from marketmanager, function for buying back and repaying debt 
  /// @dev selling one shortZCB is buying back and repaying one longZCB 
  /// 1. burn shortZCB  
  /// 2. buy longZCB 
  /// 3. repay longZCB 
  function trustedClose(
    address trader, 
    uint256 shortZCB_amount, 
    uint256 min_collateral_out
  ) public onlyOwner returns(uint256 returned_collateral, uint256 amountOut){

    uint256 balance_before = collateral.balanceOf(address(this)); 

    /// burn first, should revert if not enough balance 
    _burn(trader, shortZCB_amount); 

    // Area under the curve is the amount of collateral required to pay back debt
    uint256 needed_collateral = LongZCB.calcAreaUnderCurve(shortZCB_amount); 

    // Returned collateral is the area between the curve and 1
    returned_collateral = shortZCB_amount - needed_collateral; 
    reserves -= (needed_collateral + returned_collateral); 

    // Buy from the funds in this contract 
    collateral.approve(address(LongZCB), needed_collateral); 
    amountOut = LongZCB.trustedBuy(address(this), needed_collateral, 0); 

    console.log('needed_collateral', needed_collateral, returned_collateral); 
    console.log('shortZcbamount', shortZCB_amount); 
    
    // Invariant #2: Value out from this contract after this trade 
    // should equal needed_collateral+returned_collateral = shortZCB_amount
    assert(balance_before - collateral.balanceOf(address(this)) 
          <= shortZCB_amount+config.roundLimit); 
    assert(shortZCB_amount <= amountOut + config.roundLimit); 
    require(returned_collateral >= min_collateral_out, "Slippage Err"); 

    collateral.safeTransfer(trader, returned_collateral);

  }





  function calculateAmountGivenSell(uint256 amount) public view  returns (uint256,uint256) {
    return _calculateAmountGivenSell(amount);
   }

  /// @notice returns estimated collateral required to repay debt, used for approvals 
  function getEstimatedCollateralNeeded(uint256 debt) public view returns(uint256){
    return  LongZCB.calcAreaUnderCurve(debt); 
  }

  /// @notice reserves should rougly equal the supply of shortZCB
  function getReserves() public view returns(uint256){
    return reserves; 
  }


  /// @notice amount is in collateral, calculate the average price
  /// of shortZCB when buying with amount 
  function calculateAveragePrice(uint256 amount) public view returns(uint256, uint256){
    (uint256 shortTokenAmount, uint256 k) = calculateAmountGivenSell(amount);
    return (amount.divWadDown(shortTokenAmount), shortTokenAmount); 
  }


  function _calculateAmountGivenSell(uint256 amount) view public virtual returns(uint256 ,uint256);



}



contract LinearShortZCB is ShortBondingCurve{

  using FixedPointMathLib for uint256;
  using SafeERC20 for ERC20;


  constructor (
      string memory name,
      string memory symbol,
      address owner,
      address collateral, 
      address longZCBaddress, 
      uint256 marketId 
 
  ) ShortBondingCurve( name, symbol, owner, collateral, longZCBaddress, marketId) {

  }


  /// @notice calculates amount of ZCB to sell given collateral for shorts
  /// which is finding, given the area between 1 and curve, the change in supply 
  /// @param amount in collateral dec
  /// returns shortZCB amount from collateral and new supply after selling 
  function _calculateAmountGivenSell(uint256 amount) public override view returns(uint256,uint256){
    
    // Get current supply and params, shares the same parameters as longZCB because it is just trading opposite dir
    uint256 c = getPair().totalSupplyAdjusted(); 
    (uint256 a, uint256 b) = getPair().getParams(); 

    // Compute 
    uint256 x = (math_precision-b).mulWadDown(math_precision-b); 
    uint256 q = 2*a.mulWadDown(c);
    uint256 w = (a.mulWadDown(a)).mulWadDown(c.mulWadDown(c)); 
    uint256 e = q.mulWadDown(b);    
    uint256 t = 2*a.mulWadDown(amount);
    uint256 f = x+e+w+t;
    uint256 h = f - q; 
    uint256 rhs = (h*math_precision).sqrt(); 
    console.log('rhs',rhs); 

    // If rhs larger then means not enough total supply to sell 
    uint256 numerator; 
    require(rhs < (math_precision-b), "Not enough liquidity"); 
    unchecked{numerator = (math_precision-b) - rhs;}

    // New supply after sell, so c - cprime is the amount sold in ZCB  
    uint256 cprime = numerator.divWadDown(a);
    
    console.log('cprime', cprime, c); 

    return ((c - cprime), cprime); 
  }




}




  // /// @notice called from marketmanager, function for buying back and repaying debt 
  // /// @dev selling one shortZCB is buying back and repaying one longZCB 
  // /// 1. burn shortZCB  
  // /// 2. buy longZCB 
  // /// 3. repay longZCB 
  // function trustedClose(
  //   address trader, 
  //   uint256 shortZCB_amount, 
  //   uint256 min_collateral_out
  //   ) public onlyOwner returns(uint256 returned_collateral){

  //   /// burn first, should revert if not enough balance 
  //   _burn(trader, shortZCB_amount); 

  //   // Area under the curve is the amount of collateral required to pay back debt
  //   uint256 needed_collateral = LongZCB.calcAreaUnderCurve(shortZCB_amount); 

  //   // Returned collateral is the area between the curve and 1
  //   returned_collateral = (shortZCB_amount/(10**(18-collateral_dec)) - needed_collateral);
  //   require(returned_collateral >= min_collateral_out, "Slippage Err"); 
  //   console.log('needed_collateral', needed_collateral, returned_collateral); 

  //   MarketManager marketmanager = MarketManager(owner); 
  //   collateral.approve(address(LongZCB), needed_collateral); 
  //   uint256 amountOut = marketmanager.buy(marketId, needed_collateral, 0); 
  //   console.log('amountout', amountOut, shortZCB_amount); 

  //   marketmanager.repay_for_shortZCB(marketId, amountOut, trader);

  //   collateral.safeTransfer(trader, returned_collateral); 



  // }
  // /// @notice called from the marketmanager 
  // /// 1 shortZCB token is tokenization of borrowing+ selling 1 longZCB  
  // /// so when longZCB price is 0.9, shortZCB is 0.1
  // /// when price is 0.1, trader transfer collateral_amount to buy 0.1 per shortZCB to this contract 
  // /// this contract then borrows longZCB +sell it from marketmanager, collateral from sell sent back here
  // /// @dev at maturity funds here will be burned and redeemed amount will be minted just like longZCB 
  // function trustedShort(
  //   address trader, 
  //   uint256 collateral_amount,
  //   uint256 min_amount_out
  // ) public onlyOwner returns (uint256 shortTokensToMint, uint256 supply_after_sell) {

  //   (shortTokensToMint,
  //    supply_after_sell) = calculateAmountGivenSell(collateral_amount); 
  //   collateral.safeTransferFrom(trader, address(this), collateral_amount); 

  //   MarketManager marketmanager = MarketManager(owner); 

  //   // mints shortTokensToMint amount of longZCB.
  //   marketmanager.borrow_for_shortZCB(marketId, shortTokensToMint); 

  //   // min_amount_out will automatically take care of slippage
  //   uint256 amountOut = marketmanager.sell(marketId, shortTokensToMint, 0);  

  //   //amountOut + collateral_amount should equal shortTokensToMint, TODO write invariant assertion with rounding
  //   console.log('amountout', amountOut, collateral_amount);
  //   console.log('supply_after_sell', supply_after_sell, shortTokensToMint); 
  //   require(min_amount_out <= shortTokensToMint, "Slippage Err"); 

  //   reserves += (collateral_amount + amountOut); 

  //   _mint(trader, shortTokensToMint); 

  // }

  // /// @notice called from the marketmanager 
  // function trustedShort(
  //  address trader, 
  //  uint256 collateral_amount
  // ) public onlyOwner returns (uint256) {

  //  (uint256 shortTokensToMint, uint256 supply_after_sell)  = calculateAmountGivenSell(collateral_amount); 
  //  collateral.safeTransferFrom(trader, address(this), collateral_amount); 

  //  MarketManager marketmanager = MarketManager(owner); 
  //  marketmanager.borrow_for_shortZCB(marketId, shortTokensToMint); // mints shortTokensToMint amount of longZCB.
  //  uint256 amountOut = marketmanager.sell(marketId, shortTokensToMint); 
  //  console.log('amountout', amountOut, collateral_amount);
  //  console.log('supply_after_sell', supply_after_sell, shortTokensToMint); 

  //  //amountOut + collateral_amount should equal shortTokensToMint 
  //  _mint(trader, shortTokensToMint); 

  //  reserves += (collateral_amount + amountOut); 
  //  return shortTokensToMint;
  // }


  // /// @notice called from marketmanager, function for buying back and repaying debt 
  // /// @dev one shortZCB is tokenized debt+sell of one longZCB 
  // /// 1. burn shortZCB  
  // /// 2. buy longZCB 
  // /// 3. repay longZCB 
  // function trustedClose(
  //  address trader, 
  //  uint256 shortZCB_amount 
  //  ) public onlyOwner returns(uint256){

  //  ///burn first
  //  _burn(trader, shortZCB_amount); 

  //  uint256 needed_collateral = LongZCB._calcAreaUnderCurve(shortZCB_amount); 
  //  uint256 returned_collateral = (shortZCB_amount/(10**(18-collateral_dec)) - needed_collateral);
  //  console.log('needed_collateral', needed_collateral, returned_collateral); 
  //  // collateral.safeTransferFrom(trader, address(this), needed_collateral); 
  //  MarketManager marketmanager = MarketManager(owner); 
  //  collateral.approve(address(LongZCB), needed_collateral); 
  //  uint256 amountOut = marketmanager.buy( marketId, needed_collateral); 
 //     console.log('amountout', amountOut, shortZCB_amount); 

  //  marketmanager.repay_for_shortZCB(marketId, amountOut, trader);

  //  collateral.safeTransfer(trader, returned_collateral); 

  //  return returned_collateral; 
  // }
  //  uint256 numerator; 

    // unchecked {numerator = (math_precision - b) - (((x - q+w+e+t)*math_precision).sqrt()) ;} 
    
    // if (numerator >= 2**255 ) revert('Not enough liquidity'); 
