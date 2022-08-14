pragma solidity ^0.8.4;
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import {DS} from "../stablecoin/DS.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

//TODO need to actually review for security and shit.
abstract contract BondingCurve is OwnedERC20 {
    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;
    using SafeERC20 for ERC20;

    uint256 internal price_upper_bound;
    uint256 internal price_lower_bound;
    uint256 internal reserves;
    uint256 internal max_quantity;
    uint256 internal math_precision; 
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
     @param amount: amount of collateral in.
     */
    function trustedBuy(address trader, uint256 amount) public onlyOwner returns (uint256) {
        uint256 tokens = _calculatePurchaseReturn(amount);
        collateral.safeTransferFrom(trader, address(this), amount);
        _mint(trader, tokens);
        return tokens;
    }

    /**
     @param amount: amount of zcb tokens burned
     */
    function trustedSell(address trader, uint256 amount) public onlyOwner returns (uint256) {
        uint256 collateral_out = _calculateSaleReturn(amount);
        _burn(trader, amount);
        collateral.safeTransfer(trader, collateral_out);
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
     */
    function buy(uint256 amount) public {
        uint256 tokens = _calculatePurchaseReturn(amount);
        reserves += amount; // CAN REPLACE WITH collateral.balanceOf(this)
        _mint(msg.sender, tokens);
        collateral.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     @notice sell bond tokens with necessary checks and transfers of collateral
     @param amount: amount of tokens selling.
     */
    function sell(uint256 amount) public {
        uint256 sale = _calculateSaleReturn(amount);
        _burn(msg.sender, amount);
        collateral.safeTransfer(msg.sender, sale);
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

    function redeem(
		address receiver, 
		uint256 zcb_redeem_amount, 
		uint256 collateral_redeem_amount
	) external  onlyOwner {
        _burn(receiver, zcb_redeem_amount);
		collateral.safeTransfer(receiver, collateral_redeem_amount); 
	}

    function redeemPostAssessment(
		address redeemer,
		uint256 collateral_amount
	) external  onlyOwner{
        uint256 redeem_amount = balanceOf(redeemer);
		_burn(redeemer, redeem_amount); 
		collateral.safeTransfer(redeemer, collateral_amount); 
	}

    function burnFirstLoss(
		uint256 burn_collateral_amount
	) external onlyOwner{
		collateral.safeTransfer(owner, burn_collateral_amount); 
	}


    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override virtual {
        // on _mint
        if (from == address(0) && price_upper_bound > 0) {
            require(_calculateExpectedPrice(amount) <= price_upper_bound, "above price upper bound");
            if (balanceOf(to) == 0 && amount > 0) {
                buyers.push(to);
            }
        }
        // on _burn
        else if (to == address(0) && price_lower_bound > 0) {
            require(_calculateExpectedPrice(amount) >= price_lower_bound, "below price lower bound");
        }
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (to == address(0) && balanceOf(from) == 0) {
            uint256 length = buyers.length;
            for (uint256 i = 0; i <length; i ++) {
                if (buyers[i] == from) {
                    buyers[i] = buyers[length - 1];
                    buyers.pop();
                }
            }
        }
    }

    function getBuyers() external view returns (address[] memory) {
        return buyers;
    }
    function _calcAreaUnderCurve(uint256 amount) internal view  virtual returns(uint256 result); 

    function _calculateScore(uint256 priceOut, bool atLoss) view internal virtual returns(uint256 score);

    function _calculatePurchaseReturn(uint256 amount) view internal virtual returns(uint256 result);

    function _calculateSaleReturn(uint256 amount) view internal virtual returns (uint256 result);

    function _calculateExpectedPrice(uint256 amount) view internal virtual returns (uint256 result);

    function _calculateProbability(uint256 amount) view internal virtual returns (uint256 score);
}