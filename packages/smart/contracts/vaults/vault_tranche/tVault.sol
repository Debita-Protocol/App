pragma solidity ^0.8.4;


import {Auth} from "../auth/Auth.sol";
import {ERC4626} from "../mixins/ERC4626.sol";

import {SafeCastLib} from "../utils/SafeCastLib.sol";
import {SafeTransferLib} from "../utils/SafeTransferLib.sol";
import {FixedPointMathLib} from "../utils/FixedPointMathLib.sol";

import {ERC20} from "../tokens/ERC20.sol";
import {Instrument} from "../instrument.sol";
import {Vault} from "../vault.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {TrancheFactory} from "./tranchemaster.sol"; 
import "hardhat/console.sol";

/// @notice super vault that accepts any combinations of ERC4626 instruments at initialization, and will
/// automatically invest/divest when minting/redeeming 
/// @dev instance is generated for every splitter
contract tVault is ERC4626{
	using SafeCastLib for uint256; 
  using SafeTransferLib for ERC20;
  using FixedPointMathLib for uint256;

  uint256 num_instrument; 
  uint256[] ratios; 
  address[] instruments; 
  uint256 init_time; 
  uint256 junior_weight; 
  uint256 promisedReturn; 
  uint256 time_to_maturity; 
  ERC20 want; 

  mapping(address=>uint256) addressToIndex; 

  uint256[] initial_exchange_rates; 

  uint256 public PRICE_PRECISION; 

  /// @notice when intialized, will take in a few ERC4626 instruments (address) as base instruments
  /// param _want is the base assets for all the instruments e.g usdc
  /// param _instruments are ERC4626 addresses that will comprise this super vault
  /// param _ratios are the weight of value invested for each instruments, should sum to 1 
  /// param _junior_weight is the allocation between junior/senior tranche (senior is 1-junior)
  /// param _time_to_maturity is time until the tranche tokens redemption price will be determined
  /// and tranche tokens can be redeemed separately 
  /// param _promisedReturn is the promised senior return gauranteed by junior holders 
  constructor(
    TrancheFactory.InitParams memory param)
    ERC4626(
        ERC20(param._want),
        string(abi.encodePacked("super ", ERC20(param._want).name(), " Vault")),
        string(abi.encodePacked("t", ERC20(param._want).symbol()))
    )  
	//Vault(address(_want))
{
    want = ERC20(param._want); 
    instruments = param._instruments; 
    num_instrument = param._instruments.length; 
    ratios = param._ratios; 
    junior_weight = param._junior_weight; 
    promisedReturn = param._promisedReturn; 
    time_to_maturity = param._time_to_maturity; 
    init_time = block.timestamp; 

    initial_exchange_rates = new uint[](num_instrument); 
    PRICE_PRECISION = 10**want.decimals(); 

    //need to get initial exchange rate between the instruments and want 
    for (uint i=0; i< num_instrument; i++){
        addressToIndex[instruments[i]] = i; 
        initial_exchange_rates[i] = get_exchange_rate(instruments[i]); 
    }
  }


  /// @notice get the amount of shares for the instrument one would obtain
  /// by depositing one want token 
  function get_exchange_rate(address instrument) internal view returns(uint256){
  	return ERC4626(instrument).previewDeposit(PRICE_PRECISION); 
  }

  /// @notice will automatically invest into the ERC4626 instruments and give out 
  /// vault tokens as share
  function mint(uint256 shares, address receiver) public override returns(uint assets)  {
    assets = previewMint(shares); // No need to check for rounding error, previewMint rounds up.
    console.log('here', msg.sender);

    asset.safeTransferFrom(msg.sender, address(this), assets);
    console.log('assets', assets, shares); 
    invest(shares); 

    _mint(receiver, shares);
    emit Deposit(msg.sender, receiver, assets, shares);
    afterDeposit(assets, shares);

  }


  /// @notice will automatically divest from the instruments
  function redeem(
    uint256 shares,
    address receiver,
    address owner
) public override returns(uint assets){
    if (msg.sender != owner) {
        uint256 allowed = allowance[owner][msg.sender]; // Saves gas for limited approvals.

        if (allowed != type(uint256).max) allowance[owner][msg.sender] = allowed - shares;
    }

    // Check for rounding error since we round down in previewRedeem.
    require((assets = previewRedeem(shares)) != 0, "ZERO_ASSETS");
    divest(assets); 

    beforeWithdraw(assets, shares);
    _burn(owner, shares);
    emit Withdraw(msg.sender, receiver, owner, assets, shares);
    asset.safeTransfer(receiver, assets);

  }

  /// @notice will invest into the current instruments, which is equivalent to minting erc4626
  /// @param shares are denominated in vault token, in PRICE_PRECISION
  function invest(uint256 shares) internal {
  	
  	uint num_asset_for_this; 
  	for (uint i=0; i< num_instrument; i++){
  		num_asset_for_this = ERC4626(instruments[i]).convertToAssets((shares*ratios[i])/PRICE_PRECISION);  
      asset.safeApprove(instruments[i], num_asset_for_this); 
      uint a = asset.balanceOf(address(this));
      console.log('balance',a, ratios[0]); 
      console.log('shares', num_asset_for_this, shares); 
  		uint receivedShares = ERC4626(instruments[i]).deposit(num_asset_for_this, address(this)); //will mint the instrument to this contract
  	}
  }

  /// @notice will divest from current instruments, which is equivalent to redeeming erc4626
  /// @param assets are denominated in underlying token
  function divest(uint256 assets) internal{
  	uint num_assets_for_this; 
  	for (uint i=0; i< num_instrument; i++){
  		num_assets_for_this = (assets* ratios[i]/PRICE_PRECISION); 
  		ERC4626(instruments[i]).withdraw(num_assets_for_this, address(this), address(this)); 
  	}

  }


  function isMatured() public view returns(bool){
    return true; 
  	//return (block.timestamp - init_time) > time_to_maturity; 
  }

  function getUnderlying() public view returns(address){
  	return address(want); 
  }

  function getJuniorWeight() public view returns(uint256){
  	return junior_weight; 
  }

  function getPromisedReturn() public view returns(uint256){
  	return promisedReturn; 
  }
  function getInitialExchangeRates() public view returns(uint[] memory){
      return initial_exchange_rates; 
  }

  /// @notice get average real returns collected by the vault in this supervault until now  
  /// real return is computed by (final_value_of_vault/initial_value_of_vault) - 1
  function getCurrentRealReturn() public view returns(uint256){
  	uint256[] memory real_returns = new uint256[](num_instrument); 
  	uint256 sum_return; 
  	for (uint i=0; i< num_instrument; i++){
  		real_returns[i] = (get_exchange_rate(instruments[i])/initial_exchange_rates[i])*PRICE_PRECISION;
  		sum_return += real_returns[i] - PRICE_PRECISION; 
	}

	return (sum_return/num_instrument); 
	
  }

  /// @notice sums over all assets in want tokens 
  function totalAssets() public view override returns (uint256){
    uint sumAssets; 
    for (uint i=0; i< num_instrument; i++){
        sumAssets += ERC4626(instruments[i]).totalAssets(); 
    }
    return sumAssets; 

  }


 

}
