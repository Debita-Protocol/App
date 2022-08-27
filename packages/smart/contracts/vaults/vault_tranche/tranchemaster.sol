pragma solidity ^0.8.4;


import {Auth} from "../auth/Auth.sol";
import {ERC4626} from "../mixins/ERC4626.sol";

import {SafeCastLib} from "../utils/SafeCastLib.sol";
import {SafeTransferLib} from "../utils/SafeTransferLib.sol";
import {FixedPointMathLib} from "../utils/FixedPointMathLib.sol";

import {ERC20} from "../tokens/ERC20.sol";
import {Splitter} from "./splitter.sol";
import {tVault} from "./tVault.sol";
import {StableSwap} from "./stableswap.sol"; 
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice have to separate factories because of code size limit 
contract TrancheAMMFactory{

	address base_factory;
	mapping(address=>bool) _isPool; 
	constructor(){
		base_factory = msg.sender; 
	}
	function newPool(address token1, address token2) external returns(StableSwap){
		StableSwap amm = new StableSwap(token1, token2); 
		_isPool[address(amm)] = true; 
		return amm; 
	}
	function isPool(address pooladd) public view returns(bool){
		return _isPool[pooladd]; 
	}
} 


/// @notice contract that stores the contracts and liquidity for each tranches 
contract TrancheFactory{

	uint256 numVaults; 
  address owner; 

  TrancheAMMFactory ammFactory; 

	/// @notice initialization parameters for the vault
	struct InitParams{
		address _want; 
    	address[]  _instruments;
    	uint256[]  _ratios;
    	uint256 _junior_weight; 
    	uint256 _promisedReturn; 
    	uint256 _time_to_maturity;
    	uint256 vaultId; 
	}

	struct Contracts{
		address vault; 
		address splitter; 
		address amm; 
		InitParams param; 
	}

	mapping(uint256=>Contracts) vaultContracts;
	mapping(uint256=>mapping(address=>uint256)) lp_holdings;  //vaultId-> LP holdings for providrers

    constructor(
        address _owner, 
        address ammFactory_address
    ) public {
        owner = _owner;
        ammFactory = TrancheAMMFactory(ammFactory_address); 

    }



	/// @notice adds vaults, spllitters, and amms when tranche bids are filled 
	/// Bidders have to specify the 
	/// param want: underlying token for all the vaults e.g(usdc,eth)
	/// param instruments: addresses of all vaults for the want they want exposure to
	/// param ratios: how much they want to split between the instruments 
	/// param junior weight: how much the juniors are allocated; lower means higher leverage for juniors but lower safety for seniors
	/// param promisedReturn: how much fixed income seniors are getting paid primarily, 
	/// param timetomaturity: when the tVault matures and tranche token holders can redeem their tranche for tVault 
	/// @dev a bid is filled when liquidity provider agrees to provide initial liq for senior/junior or vice versa.  
	/// so initial liq should be provided nonetheless 
	function createVault(InitParams memory param) public {

		tVault newvault = new tVault(param); 
		Splitter splitter = new Splitter(newvault);
		address[] memory tokens = splitter.getTrancheTokens(); 
		StableSwap amm = ammFactory.newPool(tokens[0], tokens[1]); 

		uint vaultId = param.vaultId; 
		Contracts storage contracts = vaultContracts[vaultId]; 
		contracts.vault = address(newvault); 
		contracts.splitter = address(splitter);
		contracts.amm = address(amm); 
		contracts.param = param;

		numVaults++; 
	}	


	/// @notice lp token balance is stored in this contract
	function increaseLPTokenBalance(address to, uint vaultId, uint lpshares) external{
		lp_holdings[vaultId][to] += lpshares; 
	}
	function decreaseLPTokenBalance(address to, uint vaultId, uint lpshares) external{
		lp_holdings[vaultId][to] -= lpshares; 
	}

	function getContracts(uint vaultId) external view returns(Contracts memory){
		return vaultContracts[vaultId]; 
	}

	function getLPTokenBalance(address to, uint vaultId) external view returns(uint256){
		return lp_holdings[vaultId][to]; 
	}

	function getSuperVault(uint vaultId) external view returns(tVault){
		return tVault(vaultContracts[vaultId].vault); 
	}
	function getSplitter(uint vaultId) external view returns(Splitter){
		return Splitter(vaultContracts[vaultId].splitter); 
	}
	function getAmm(uint vaultId) external view returns(StableSwap){
		return StableSwap(vaultContracts[vaultId].amm); 
	}
	//function getNumVaults
	// function getVaultId(InitParams memory param) external view returns(uint){
	// 	return vaultIdMapping[param]; 
	// }


}

/// @notice handles all trading related stuff 
contract TrancheMaster{

	TrancheFactory tFactory;

	constructor(TrancheFactory _tFactory){
		tFactory = _tFactory; 
	}


	/// @notice adds liquidity to pool with vaultId
	/// @dev amount is denominated in want of the tVault, so want-> mint tVault-> split -> provide 
	function addLiquidity(
		address provider,
		 uint amount, 
		 uint vaultId) external 
	{	

		TrancheFactory.Contracts memory contracts = tFactory.getContracts(vaultId); 
		ERC20 want = ERC20(contracts.param._want); 
		tVault vault = tVault(contracts.vault); 
		StableSwap amm = StableSwap(contracts.amm); 
		Splitter splitter = Splitter(contracts.splitter); 

		//Mint tVault
		want.transferFrom(provider, address(this), amount); 
		want.approve(address(vault), amount ); 
		uint shares = vault.convertToShares(amount);
		vault.mint(shares, address(this)); 

		//Split 
		vault.approve(address(splitter), shares);
		(uint ja, uint sa) = splitter.split(vault, shares); 

		//provide(same amount to get a balanced pool)
		uint[2] memory amounts; 
		amounts[0] = ja; 
		amounts[1] = ja; 
		address[] memory tranches = splitter.getTrancheTokens(); 
		ERC20(tranches[0]).approve(address(amm), ja); 
		ERC20(tranches[1]).approve(address(amm), ja); 
		uint lpshares = amm.addLiquidity(amounts, 0); 

		//Transfer
		tFactory.increaseLPTokenBalance(provider, vaultId, lpshares);

	}

	/// @notice remove liquidity from the pool, and gives back merged token
	function removeLiquidity(
		address taker, 
		uint shares, 
		uint vaultId) external 
	{
		TrancheFactory.Contracts memory contracts = tFactory.getContracts(vaultId); 
		ERC20 want = ERC20(contracts.param._want); 
		tVault vault = tVault(contracts.vault); 
		StableSwap amm = StableSwap(contracts.amm); 
		Splitter splitter = Splitter(contracts.splitter); 

		//Transfer
		tFactory.decreaseLPTokenBalance(taker, vaultId, shares); 

		//Remove
		uint[2] memory minAmounts;
		minAmounts[0] =0;
		minAmounts[1] =0;
		uint[2] memory amountsOut = amm.removeLiquidity(shares,minAmounts);
		uint junioramount = amountsOut[1]; 

		//Merge-> junior and senior in, tVault out to this address
		uint merged_token_amount = splitter.merge(vault, junioramount); 

		//Redeem vault 
		vault.redeem(merged_token_amount, taker, address(this)); 


	}



	/// @notice buy tranche token in one tx from underlying tVault collatera; 
	/// @param amount is collateral in 
	/// @dev 1.Mints vault token
	/// 2. Splits Vault token from splitter 
	/// 3. Swap unwanted tToken to wanted tToken
	/// 4. Transfer wanted tToken to user 
	function buy_tranche(
		uint vaultId, 
		uint amount, 
		bool wantSenior
		) external 
	{
		TrancheFactory.Contracts memory contracts = tFactory.getContracts(vaultId); 
		ERC20 want = ERC20(contracts.param._want); 
		tVault vault = tVault(contracts.vault); 
		StableSwap amm = StableSwap(contracts.amm); 
		Splitter splitter = Splitter(contracts.splitter); 

		//1.Mint
		want.transferFrom(msg.sender, address(this), amount); 
		want.approve(address(vault), amount); 
		uint shares = vault.convertToShares(amount); 
		vault.mint(shares, address(this));

		//2. Split
		vault.approve(address(splitter), shares); 
		(uint ja, uint sa) = splitter.split(vault, shares); //junior and senior now minted to this address 

		//Senior tokens are indexed at 0 in each amm 
		uint tokenIn = wantSenior? 1 : 0;
		uint tokenOut = 1-tokenIn; 
		uint tokenInAmount = wantSenior? ja: sa; 
		address[] memory tranches = splitter.getTrancheTokens(); 

		//3. Swap 
		ERC20(tranches[tokenIn]).approve(address(amm), tokenInAmount); 
		uint tokenOutAmount = amm.swap(tokenIn, tokenOut, tokenInAmount, 0); //this will give this contract tokenOut

		//4. Transfer 
		uint transferamount = wantSenior? sa: ja; 
		ERC20(tranches[tokenOut]).transfer(msg.sender, transferamount + tokenOutAmount); 

	}

	/// @notice sell tranche token for collateral in one tx
	/// 1. Transfer tToken 
	/// 2. Swap tTokens to get in correct ratio
	function sell_tranche(
		uint vaultId, 
		uint amount, 
		bool isSenior 
		) external 
	{
		TrancheFactory.Contracts memory contracts = tFactory.getContracts(vaultId); 
		ERC20 want = ERC20(contracts.param._want); 
		tVault vault = tVault(contracts.vault); 
		StableSwap amm = StableSwap(contracts.amm); 
		Splitter splitter = Splitter(contracts.splitter); 

		//1. Transfer tToken to this contract
		address[] memory tranches = splitter.getTrancheTokens(); 
		uint tokenIn = isSenior? 0:1; 
		ERC20(tranches[tokenIn]).transfer(msg.sender, amount); 

		//2. Swap to get correct ratio, if intoken is senior then need junior, 
		(uint pairTokenAmount, uint swappedTokenAmount) = swapToRatio(amount, !isSenior, tranches, vault, amm); 
		uint amountAfterSwap =  amount - swappedTokenAmount; 
		//amountAfterSwap, pairTokenAmount should be the amount of tranche tokens in ratio 

		//3.Merge the tokens (merged tVault token will be directed to this contract)
		uint junior_amount = isSenior? pairTokenAmount: swappedTokenAmount;  
		uint totalAmountMerged = splitter.merge(vault, junior_amount); 

		//4.Redeem merged token in tVault  
		vault.redeem(totalAmountMerged, msg.sender, address(this)); 


	}

	/// @notice swap portion of tToken to another to get the correct ratio
	/// e.x 100 junior-> 30 senior, 70 junior, when ratio is 3:7
	function swapToRatio(
		uint tokenInAmount, 
		bool needSenior,
		address[] memory tranches,
		tVault vault, 
		StableSwap amm) internal returns(uint, uint){
	
		//get swapping Token index; if senior is needed swap junior
		uint tokenInIndex = needSenior? 1:0;
		uint tokenOutIndex = 1- tokenInIndex; 
		address neededToken = tranches[tokenOutIndex]; 
		address swappingToken = tranches[tokenInIndex]; 
		uint junior_weight = vault.getJuniorWeight();
		uint PRICE_PRECISION = vault.PRICE_PRECISION();   
		
		//ex. 100j -> 30j, 70s (determined by ratio)
		// need x amount of juniors for 70s 
		uint neededTokenOutAmount; 
		if (needSenior)  neededTokenOutAmount = (PRICE_PRECISION - junior_weight) * tokenInAmount; 
		else  neededTokenOutAmount = junior_weight * tokenInAmount; 

		//Get how much tokenInAmount I need to get needed tokenoutAmount 
		uint neededTokenInAmount = amm.getDx(neededTokenOutAmount, tokenInIndex); 
		uint TokenOutAmount = amm.swap(tokenInIndex, tokenOutIndex, neededTokenInAmount,0 ); 
		//Now this contract has the neededTokenAmountOut tokens

		return (TokenOutAmount, neededTokenInAmount);
	}



}