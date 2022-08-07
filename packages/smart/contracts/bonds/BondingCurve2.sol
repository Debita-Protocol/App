pragma solidity ^0.8.4;
import {OwnedERC20} from "../turbo/OwnedShareToken.sol";
import {DS} from "../stablecoin/DS.sol";
import "@prb/math/contracts/PRBMathUD60x18.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

//TODO need to actually review for security and shit.
abstract contract BondingCurve2 is OwnedERC20 {
    // ASSUMES 18 TRAILING DECIMALS IN UINT256
    using PRBMathUD60x18 for uint256;
    using SafeERC20 for ERC20;

    uint256 internal price_upper_bound;
    uint256 internal price_lower_bound;
    uint256 internal reserves;
    ERC20 collateral; // NEED TO CHANGE ONCE VAULT IS DONE

    constructor (
        string memory name,
        string memory symbol,
        address owner,
        address _collateral
    ) OwnedERC20(name, symbol, owner) {
        collateral = ERC20(_collateral);
    }

    function setUpperBound(uint256 upper_bound) public onlyOwner {
        price_upper_bound = upper_bound;
    }

    function setLowerBound(uint256 lower_bound) public onlyOwner {
        price_lower_bound = lower_bound;
    }

    /**
     @notice calculates tokens returns from input collateral
     @dev shouldn't be calling this function, should be calculating amount from frontend.
     @param amount: input collateral (ds)
     */
    function calculatePurchaseReturn (uint256 amount) public view onlyOwner returns (uint256 result) {
        result = _calculatePurchaseReturn(amount);
    }
 
    /**
     @notice calculates collateral returns from selling tokens
     @param amount: amount of tokens selling
     */
    function calculateSaleReturn (uint256 amount) public view onlyOwner returns (uint256 result) {
        result = _calculateSaleReturn(amount);
    }

    /**
     @notice calculates expected price given user buys X tokens
     @param amount: hypothetical amount of tokens bought
     */
    function calculateExpectedPrice (uint256 amount) public view onlyOwner returns (uint256 result) {
        result = _calculateExpectedPrice(amount);
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
    function incrementReserves (uint256 amount) public onlyOwner{
        reserves += amount;
    }
    
    /**
     @dev doesn't perform any checks, checks performed by caller
     */
    function decrementReserves (uint256 amount) public onlyOwner {
        reserves -= amount;
    }

    /**
     @notice performs checks for price threshold.
     */
    function _mint(address account, uint256 amount) internal override virtual {
        if (price_upper_bound > 0) {
            require(_calculateExpectedPrice(amount) < price_upper_bound, "price threshold exceeded");
        }
        super._mint(account, amount);
    }

    function _calculatePurchaseReturn(uint256 amount) view internal virtual returns(uint256 result);

    function _calculateSaleReturn(uint256 amount) view internal virtual returns (uint256 result);

    function _calculateExpectedPrice(uint256 amount) view internal virtual returns (uint256 result);
}