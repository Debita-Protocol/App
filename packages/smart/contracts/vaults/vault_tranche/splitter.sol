pragma solidity ^0.8.4;


import {Auth} from "../auth/Auth.sol";
import {ERC4626} from "../mixins/ERC4626.sol";

import {SafeCastLib} from "../utils/SafeCastLib.sol";
import {SafeTransferLib} from "../utils/SafeTransferLib.sol";
import {FixedPointMathLib} from "../utils/FixedPointMathLib.sol";

import {ERC20} from "../tokens/ERC20.sol";
import {Instrument} from "../instrument.sol";
import {tVault} from "./tVault.sol"; 
import "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";





/// @notice tokens for junior/senior tranches 
contract tToken is ERC20{

	modifier onlySplitter() {
    require(msg.sender == splitter, "!Splitter");
     _;
  }

  address splitter; 
  ERC20 asset; 

  /// @notice asset is the tVault  
  constructor(
      ERC20 _asset, 
      string memory _name,
      string memory _symbol, 
      address _splitter
  ) ERC20(_name, _symbol, _asset.decimals()) {
      asset = _asset;
      splitter = _splitter; 
  }

  function mint(address to, uint256 amount) external onlySplitter{
  	_mint(to, amount); 
  }

  function burn(address from, uint256 amount) external onlySplitter{
  	_burn(from, amount);
  }


}

/// @notice Accepts ERC20 and splits them into senior/junior tokens
/// Will hold the ERC20 token in this contract
/// Before maturity, redemption only allowed for a pair, 
/// After maturity, redemption allowed for individual tranche tokens, with the determined conversion rate
/// @dev new instance is generated for each vault
contract Splitter{
	using SafeCastLib for uint256; 
  using SafeTransferLib for ERC20;
  using FixedPointMathLib for uint256;

  tVault underlying; 
  tToken senior;
  tToken junior;  

  //weight is in PRICE_PRECISION 6, i.e 5e5 = 0.5
  uint256 junior_weight; 
  uint256 PRICE_PRECISION; 
  uint promised_return; 


  //Redemption Prices 
  uint256 s_r; 
  uint256 j_r; 

  constructor(
  	tVault _underlying //underlying vault token to split 
  	){
  	underlying = _underlying; 
  	senior = new tToken(_underlying, "senior", string(abi.encodePacked("se_", _underlying.symbol())), address(this));
  	junior = new tToken(_underlying, "junior", string(abi.encodePacked("ju_", _underlying.symbol())), address(this));

  	junior_weight = underlying.getJuniorWeight(); 
  	promised_return = underlying.getPromisedReturn(); 
  	PRICE_PRECISION = underlying.PRICE_PRECISION(); 
  }

	/// @notice accepts token_to_split and mints s,j tokens
	/// ex. 1 vault token-> 0.3 junior and 0.7 senior for weight of 0.3, 0.7
	function split(ERC20 token_to_split, uint256 amount) external returns(uint, uint) {
		require(token_to_split == underlying, "Wrong Splitter");

		token_to_split.safeTransferFrom(msg.sender, address(this), amount); 

		uint junior_token_mint_amount = (amount * junior_weight)/PRICE_PRECISION;  
		uint senior_token_mint_amount = amount - junior_token_mint_amount; 

		junior.mint(msg.sender, junior_token_mint_amount); 
		senior.mint(msg.sender, senior_token_mint_amount);

		return (junior_token_mint_amount, senior_token_mint_amount); 

	}

	/// @notice aceepts junior and senior token and gives back token_to_merge(tVault tokens)
	/// Function to call when redeeming before maturity
	/// @param token_to_merge is the valut token
	/// @param junior_amount is amount of junior tokens user want to redeem
	/// @dev senior amount is automiatically computed when given junior amount 
	function merge(ERC20 token_to_merge, uint256 junior_amount) external returns(uint){
		require(token_to_merge == underlying, "Wrong Splitter");
		uint senior_multiplier = (PRICE_PRECISION *(PRICE_PRECISION - junior_weight))/junior_weight; //ex 2.3e6
		uint senior_amount = (senior_multiplier * junior_amount)/PRICE_PRECISION; 
		require(senior.balanceOf(msg.sender) >= senior_amount, "Not enough senior tokens"); 

		junior.burn(msg.sender, junior_amount);
		senior.burn(msg.sender, senior_amount);
		underlying.transfer(msg.sender, junior_amount+senior_amount); 
		return junior_amount + senior_amount; 
	}


	/// @notice only can called after set maturity by tranche token holders
	function redeem_after_maturity(tToken _tToken, uint256 amount) external {
		require(underlying.isMatured(), "Vault not matured");
		require(address(_tToken) == address(senior) || address(_tToken) == address(junior), "Wrong Tranche Token");
		require( (s_r>=0 || j_r>=0), "redemption price not set"); 

		bool isSenior = (address(_tToken) == address(senior)) ? true : false; 
		uint redemption_price = isSenior? s_r: j_r; 
		uint token_redeem_amount = (redemption_price * amount)/PRICE_PRECISION; 

		_tToken.burn(msg.sender, amount); 
		underlying.transfer(msg.sender, token_redeem_amount); 
		
	}


	/// @notice calculate and store redemption Price for post maturity 
	/// @dev should be only called once right after tToken matures, as totalSupply changes when redeeming 
	/// also should be called by a keeper bot at maturity 
	function calcRedemptionPrice() public {
		require(underlying.isMatured(), "Vault not matured"); 

		uint promised_return = underlying.getPromisedReturn(); //in 1e6 decimals i.e 5000 is 0.05
		console.log('promised_return', promised_return); 
		uint real_return = underlying.getCurrentRealReturn(); 
		console.log('real_return', real_return); 
		uint _s_r = ((PRICE_PRECISION + promised_return)* PRICE_PRECISION/(PRICE_PRECISION+real_return)); 
		console.log('_sr', _s_r);
		uint max_s_r = (PRICE_PRECISION*PRICE_PRECISION/(PRICE_PRECISION - junior_weight));  
		console.log('maxsr', max_s_r);

		s_r = min(_s_r, max_s_r);
		console.log('sr', s_r);

		//total supply right after tVault matures 
		console.log('underlyingsupply', underlying.totalSupply()); 
		console.log('serniorsupply', senior.totalSupply()); 
		console.log('juniorsupply', junior.totalSupply()); 
		uint num = underlying.totalSupply() - senior.totalSupply().mulDivDown(s_r, PRICE_PRECISION); 
		console.log('num', num); 
		j_r = num.mulDivDown(PRICE_PRECISION, junior.totalSupply()); 
		console.log('jr', j_r); 
	}

	/// @dev need to return in list format to index it easily 
	/// 0 is always senior 
	function getTrancheTokens() public view returns(address[] memory){
 		address[] memory addresses = new address[](2);
 		addresses[0] =  address(senior); 
 		addresses[1] =  address(junior); 
		return addresses; 
	}

	function getRedemptionPrices() public view returns(uint, uint){
		return (s_r, j_r); 
	}

	function max(uint256 a, uint256 b) internal pure returns (uint256) {
    	return a >= b ? a : b;
	}

	function min(uint256 a, uint256 b) internal pure returns (uint256) {
    	return a <= b ? a : b;
	}
}