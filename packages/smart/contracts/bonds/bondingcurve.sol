pragma solidity ^0.8.4;
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import "hardhat/console.sol";
//import "../prb/PRBMathUD60x18.sol";
import {FixedPointMathLib} from "solmate/src/utils/FixedPointMathLib.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

//TODO need to actually review for security and shit.
abstract contract BondingCurve is OwnedERC20 {
	// ASSUMES 18 TRAILING DECIMALS IN UINT256
	using SafeERC20 for ERC20;
	using FixedPointMathLib for uint256;

	uint256 internal price_upper_bound;
	uint256 internal price_lower_bound;
	uint256 internal reserves;
	uint256 internal max_quantity;
	uint256 internal math_precision; 
	uint256 internal collateral_dec;
	ERC20 collateral; // NEED TO CHANGE ONCE VAULT IS DONE
	address[] private buyers; // keeps track for final reputation.


	constructor (
		string memory name,
		string memory symbol,
			address owner, // market manager.
			address _collateral
			) OwnedERC20(name, symbol, owner) {
		collateral = ERC20(_collateral);
		math_precision = 1e18;
		collateral_dec = collateral.decimals();
	}


	function setUpperBound(uint256 upper_bound) public onlyOwner {
		price_upper_bound = upper_bound;
	}

	function setLowerBound(uint256 lower_bound) public onlyOwner {
		price_lower_bound = lower_bound;
	}

	function setMaxQuantity(uint256 _max_quantity) public onlyOwner {
		max_quantity = _max_quantity;
	}

	/**
	 @notice called by market manager, like trustedMint but returns amount out
	 @param collateral_amount: amount of collateral in. => w/ collateral decimals
	 */
	 function trustedBuy(address trader, uint256 collateral_amount) public onlyOwner returns (uint256) {
		uint256 tokens = _calculatePurchaseReturn(collateral_amount);
		console.log('TOKENS', tokens, collateral_amount); 
		reserves += collateral_amount;

		require(collateral.balanceOf(trader)>= collateral_amount,"not enough balance"); 
		collateral.safeTransferFrom(trader, address(this), collateral_amount);
		_mint(trader, tokens);
		return tokens;
	 }

	/**
	 @param zcb_amount: amount of zcb tokens burned, needs to be in 18 decimals 
	 */
	 function trustedSell(address trader, uint256 zcb_amount) public onlyOwner returns (uint256) {
		uint256 collateral_out = _calculateSaleReturn(zcb_amount);
		console.log("colalteralout", collateral_out); 
		_burn(trader, zcb_amount);
		console.log('here', zcb_amount);

		collateral.safeTransfer(trader, collateral_out);
		console.log('here2', collateral_out);

		reserves -= collateral_out;
		console.log('here3');

		return collateral_out;
	 }

	 function trustedApproveCollateralTransfer(address trader, uint256 amount) public onlyOwner {
		collateral.approve(trader, amount);
	 }

	/**
	 @notice calculates tokens returns from input collateral
	 @dev shouldn't be calling this function, should be calculating amount from frontend.
	 @param amount: input collateral (ds)
	 */
	 function calculatePurchaseReturn(uint256 amount) public view  returns (uint256 result) {
		result = _calculatePurchaseReturn(amount);
	 }


	/// @notice gets required amount of collateral to purchase X amount of tokens
	/// need to get area under the curve from current supply X_  to X_+X 
	function calcAreaUnderCurve(uint256 amount) public view  returns(uint){
		return _calcAreaUnderCurve(amount); 
	}

	/**
	 @notice calculates collateral returns from selling tokens
	 @param amount: amount of tokens selling
	 */
	 function calculateSaleReturn(uint256 amount) public view  returns (uint256 result) {
		result = _calculateSaleReturn(amount);
	 }

	/// @notice calculates score necessary to update reputation score
	function calculateScore(uint256 priceOut, bool atLoss) public view returns(uint){
		return _calculateScore(priceOut, atLoss);
	}



	/// @notice calculates implied probability of the trader 
	/// @param quantity is the ratio amount(in colalteral) / total collateral budget for trader, in 18 decimals 
	function calcImpliedProbability(uint256 collateral_amount, uint256 quantity) public view returns(uint256 prob){
		uint256 zcb_amount = calculatePurchaseReturn(collateral_amount); 
		console.log('zcb_amount', zcb_amount); 
		//uint256 avg_price = collateral_amount/zcb_amount; 
		uint256 avg_price = calcAveragePrice(zcb_amount); //18 decimals 
		console.log('avg_price', avg_price); 
		uint256 b = avg_price.mulWadDown(math_precision - avg_price);
		console.log('b', b);
		uint256 prob = quantity.mulWadDown(b)+ avg_price; 
		return prob; 
	}

	/// @notice caluclates average price for the user to buy amount tokens 
	/// @dev which is average under the curve divided by amount 
	/// amount is the amount of bonds, 18 decimals 
	function calcAveragePrice(uint256 amount) public view returns(uint256){

		uint256 area = calcAreaUnderCurve(amount); //this takes in 18 
		console.log("area", area); 

		//area is in decimal 6, amount is in 18
		uint256 area_in_precision = area*(10**12); 
		uint256 result = area_in_precision.divWadDown(amount); 
		//returns a 18 decimal avg price 
		return result; 
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

	/**
	 @notice buy bond tokens with necessary checks and transfers of collateral.
	 @param amount: amount of collateral/ds paid in exchange for tokens
	 @dev amount has number of collateral decimals
	 */
	 function buy(uint256 amount) public {
		uint256 tokens = _calculatePurchaseReturn(amount);
		console.log("buy:tokens", tokens);
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

	/**
	 @notice used for calculating reputation score on resolved market.
	 */
	function calculateProbability(uint256 amount) view public returns (uint256 score) {
		return _calculateProbability(amount);
	 }

	// function trustedBurn(address trader, uint256 amount) public onlyOwner{
	// 	_burn(trader, amount);
	//  }





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


	 function _beforeTokenTransfer(
		address from,
		address to,
		uint256 amount
		) internal override virtual {
			// on _mint
			if (from == address(0) && price_upper_bound > 0) {
				console.log("beforeTT: price_upper_bound", price_upper_bound);
				require(_calculateExpectedPrice(amount) <= price_upper_bound, "above price upper bound");
				// if (balanceOf(to) == 0 && amount > 0) {
				//     buyers.push(to);
				// }
			}
		// on _burn
		else if (to == address(0) && price_lower_bound > 0) {
			require(_calculateDecreasedPrice(amount) >= price_lower_bound, "below price lower bound");
		}
	}

	/**
	 @dev amount is tokens burned.
	 */
	 function calculateDecreasedPrice(uint256 amount) view internal virtual returns (uint256 result) {
		result = _calculateDecreasedPrice(amount);
	 }

	 function _calcAreaUnderCurve(uint256 amount) internal view  virtual returns(uint256 result); 

	 function _calculateScore(uint256 priceOut, bool atLoss) view internal virtual returns(uint256 score);

	 function _calculatePurchaseReturn(uint256 amount) view internal virtual returns(uint256 result);

	 function _calculateSaleReturn(uint256 amount) view internal virtual returns (uint256 result);

	 function _calculateExpectedPrice(uint256 amount) view internal virtual returns (uint256 result);

	 function _calculateProbability(uint256 amount) view internal virtual returns (uint256 score);

	 function _calculateDecreasedPrice(uint256 amount) view internal virtual returns (uint256 result);
	}