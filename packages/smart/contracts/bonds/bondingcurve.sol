pragma solidity ^0.8.4;
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import "hardhat/console.sol";
//import "../prb/PRBMathUD60x18.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {config} from "../protocol/helpers.sol"; 


abstract contract BondingCurve is OwnedERC20 {
  // ASSUMES 18 TRAILING DECIMALS IN UINT256
  using SafeERC20 for ERC20;
  using FixedPointMathLib for uint256;

  uint256 internal price_upper_bound;
  uint256 internal price_lower_bound;
  uint256 internal reserves; //in collateral_dec 
  uint256 internal max_quantity;
  uint256 internal math_precision; 
  uint256 public collateral_dec;
  ERC20 collateral; // NEED TO CHANGE ONCE VAULT IS DONE
  address[] private buyers; // keeps track for final reputation.
  uint256 discounted_supply; 

  address shortZCB; 
  constructor (
    string memory name,
    string memory symbol,
    address owner, // market manager.
    address _collateral
    ) OwnedERC20(name, symbol, owner) {
    collateral = ERC20(_collateral);

    math_precision = config.WAD;
    collateral_dec = collateral.decimals();

  }

  /// @notice account for discounted/shorted supply 
  function totalSupplyAdjusted() public view returns(uint256) {
    return totalSupply() - discounted_supply; 
  }

  /// @notice priceupperbound/lowerbound are not price, but instead percentage of max reserves(principal) like alpha 
  function setUpperBound(uint256 upper_bound) public onlyOwner {
    price_upper_bound = upper_bound;
  }

  function setLowerBound(uint256 lower_bound) public onlyOwner {
    price_lower_bound = lower_bound;
  }

  function setMaxQuantity(uint256 _max_quantity) public onlyOwner {
    max_quantity = _max_quantity;
  }

  function setShortZCB(address shortZCB_ad) public onlyOwner{
    shortZCB = shortZCB_ad; 
  }



  /**
   @notice called by market manager, like trustedMint but returns amount out
   @param collateral_amount: amount of collateral in. => w/ collateral decimals
   @param min_amount_out: reverts if actual tokens returned less
   */
  function trustedBuy(
    address trader, 
    uint256 collateral_amount,
    uint256 min_amount_out
    ) public returns (uint256 tokensOut) {
    require(msg.sender == owner || msg.sender == shortZCB); 
    require(collateral.balanceOf(trader)>= collateral_amount,"not enough balance"); 
    require(reserves+collateral_amount <=  price_upper_bound, "exceeds trade boundary"); 

    tokensOut = calculatePurchaseReturn(collateral_amount);
    require(tokensOut >= min_amount_out, "Slippage err"); 
    unchecked{reserves += collateral_amount;}

    collateral.safeTransferFrom(trader, address(this), collateral_amount);
    _mint(trader, tokensOut);

   }

   /**
   @param zcb_amount: amount of zcb tokens burned, needs to be in WAD 
   */
  function trustedSell(
    address trader, 
    uint256 zcb_amount, 
    uint256 min_collateral_out
    ) public returns (uint256 collateral_out) {
    require(msg.sender == owner || msg.sender == shortZCB); 

    // in collateral_dec rounded down to nearest int
    collateral_out = calculateSaleReturn(zcb_amount);
    require(reserves-collateral_out >= price_lower_bound, "exceeds trade boundary"); 
    require(collateral_out>=min_collateral_out, "Slippage Err"); 

    unchecked{reserves -= collateral_out;}

    _burn(trader, zcb_amount);

    collateral.safeTransfer(trader, collateral_out);

   }

   /// @notice only called for selling discounted supplies or short supplies 
  function trustedDiscountedMint(address receiver, uint256 zcb_amount) external virtual  onlyOwner {
    discounted_supply += zcb_amount; 
    _mint(receiver, zcb_amount); 
   }

  function trustedDiscountedBurn(address receiver, uint256 zcb_amount) external virtual onlyOwner{
    discounted_supply -= zcb_amount; 
    _burn(receiver, zcb_amount); 

  }

  function trustedApproveCollateralTransfer(address trader, uint256 amount) public onlyOwner {
    collateral.approve(trader, amount);
   }


  /**
   @notice calculates tokens returns from input collateral
   @dev shouldn't be calling this function, should be calculating amount from frontend.
   @param amount: input collateral (ds)
   */
  function calculatePurchaseReturn(uint256 amount) public view  returns (uint256) {
    return _calculatePurchaseReturn(amount);
   }

  /**
   @notice calculates collateral returns from selling tokens
   @param amount: amount of tokens selling
   returns in collateral dec 
   */
  function calculateSaleReturn(uint256 amount) public view  returns (uint256) {
    return _calculateSaleReturn(amount);
   }


  /// @notice gets required amount of collateral to purchase X amount of tokens
  /// need to get area under the curve from current supply X_  to X_+X 
  function calcAreaUnderCurve(uint256 amount) public view  returns(uint){
    return _calcAreaUnderCurve(amount); 
  }




  /**
   @notice calculates expected price given user buys X tokens
   @param amount: hypothetical amount of tokens bought
   */ 
  function calculateExpectedPrice(uint256 amount) public view  returns (uint256 result) {
    result = _calculateExpectedPrice(amount);
   }

  function getTotalCollateral() public view returns (uint256 result) {
    result = collateral.balanceOf(address(this));
   }

  function getCollateral() public view returns (address) {
    return address(collateral);
   } 

  function getTotalZCB() public view returns (uint256 result) {
    result = totalSupply();
   }

  function getMaxQuantity() public view returns (uint256 result) {
    result = max_quantity;
   }

  function getUpperBound() public view returns (uint256 result) {
    result = price_upper_bound;
   }

  function getLowerBound() public view returns (uint256 result) {
    result = price_lower_bound;
   }

  function getReserves() public view returns(uint256){
    return reserves; 
   }

  function get_discount_cap() public view returns(uint256){
    return _get_discount_cap();  
  }

  function getParams() public view returns(uint,uint){
    return _getParams(); 
  }

  /**
   @dev amount is tokens burned.
   */
  function calculateDecreasedPrice(uint256 amount) public view  virtual returns (uint256) {
    return _calculateDecreasedPrice(amount);
  }

  /**
   @dev doesn't perform any checks, checks performed by caller
   */
  function incrementReserves(uint256 amount) public onlyOwner{
    reserves += amount;
   }

  /**
   @dev doesn't perform any checks, checks performed by caller
   */
  function decrementReserves(uint256 amount) public onlyOwner {
    reserves -= amount;
   }





  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override virtual {
    // on _mint
    if (from == address(0) && price_upper_bound > 0) {
      console.log("beforeTT: price_upper_bound", price_upper_bound);
      // require(_calculateExpectedPrice(amount) <= price_upper_bound, "above price upper bound");
    }
    // on _burn
    else if (to == address(0) && price_lower_bound > 0) {
      // require(_calculateDecreasedPrice(amount) >= price_lower_bound, "below price lower bound");
    }
  }


  /// @notice calculates implied probability of the trader 
  /// @param budget of trader in collateral decimals 
  function calcImpliedProbability(uint256 collateral_amount, uint256 budget) public view returns(uint256 prob){

    uint256 zcb_amount = calculatePurchaseReturn(collateral_amount); 
    uint256 avg_price = calcAveragePrice(zcb_amount); //18 decimals 
    uint256 b = avg_price.mulWadDown(math_precision - avg_price);
    uint256 ratio = zcb_amount.divWadDown(budget); 

    return ratio.mulWadDown(b)+ avg_price;
  }

  /// @notice caluclates average price for the user to buy amount tokens 
  /// @dev which is average under the curve divided by amount 
  /// amount is the amount of bonds, 18 decimals 
  function calcAveragePrice(uint256 amount) public view returns(uint256){

    uint256 area = calcAreaUnderCurve(amount); //this takes in 18 

    //area is in decimal 6, amount is in 18
    // uint256 area_in_precision = area*(10**12); 
    uint256 result = area.divWadDown(amount); 
    //returns a 18 decimal avg price 
    return result; 
  }

  function _get_discount_cap() internal view virtual returns(uint256); 

  function _calcAreaUnderCurve(uint256 amount) internal view  virtual returns(uint256 result); 

  function _calculatePurchaseReturn(uint256 amount)  internal view virtual returns(uint256 result);

  function _calculateSaleReturn(uint256 amount) internal view  virtual returns (uint256 result);

  function _calculateExpectedPrice(uint256 amount) internal view  virtual returns (uint256 result);

  function _calculateDecreasedPrice(uint256 amount) internal view  virtual returns (uint256 result);

  function _getParams() public view virtual returns(uint,uint); 







///DEPRECATED
  /**
   @notice used for calculating reputation score on resolved market.
   */


  function redeem(
    address receiver, 
    uint256 zcb_redeem_amount, 
    uint256 collateral_redeem_amount
    ) external  onlyOwner {
    _burn(receiver, zcb_redeem_amount);
    collateral.safeTransfer(receiver, collateral_redeem_amount); 
    reserves -= collateral_redeem_amount;
   }

  function redeemPostAssessment(
    address redeemer,
    uint256 collateral_amount
    ) external  onlyOwner{
    uint256 redeem_amount = balanceOf(redeemer);
    _burn(redeemer, redeem_amount); 
    collateral.safeTransfer(redeemer, collateral_amount); 
    reserves -= collateral_amount;
   }

  function burnFirstLoss(
    uint256 burn_collateral_amount
    ) external onlyOwner{
    collateral.safeTransfer(owner, burn_collateral_amount); 
    reserves -= burn_collateral_amount;
   }

  /**
   @notice buy bond tokens with necessary checks and transfers of collateral.
   @param amount: amount of collateral/ds paid in exchange for tokens
   @dev amount has number of collateral decimals
   */
  function buy(uint256 amount) public {
    uint256 tokens = _calculatePurchaseReturn(amount);
    reserves += amount; // CAN REPLACE WITH collateral.balanceOf(this)
    _mint(msg.sender, tokens);
    collateral.safeTransferFrom(msg.sender, address(this), amount);
  }

  /**
   @notice sell bond tokens with necessary checks and transfers of collateral
   @param amount: amount of tokens selling. 60.18.
   */
  function sell(uint256 amount) public {
    uint256 sale = _calculateSaleReturn(amount);
    _burn(msg.sender, amount);
    collateral.safeTransfer(msg.sender, sale);
    reserves -= sale;
   }
  /// @notice calculates score necessary to update reputation score
  function calculateScore(uint256 priceOut, bool atLoss) public view returns(uint){
    return _calculateScore(priceOut, atLoss);
  }

  function _calculateScore(uint256 priceOut, bool atLoss) view internal virtual returns(uint256 score);

  }