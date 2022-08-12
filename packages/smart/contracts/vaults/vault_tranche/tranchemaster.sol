// pragma solidity ^0.8.4;


// import {Auth} from "../auth/Auth.sol";
// import {ERC4626} from "../mixins/ERC4626.sol";

// import {SafeCastLib} from "../utils/SafeCastLib.sol";
// import {SafeTransferLib} from "../utils/SafeTransferLib.sol";
// import {FixedPointMathLib} from "../utils/FixedPointMathLib.sol";

// import {ERC20} from "../tokens/ERC20.sol";
// import {Splitter} from "./splitter.sol";
// import {tVault} from "./tVault.sol";
// import {StableSwap} from "./stableswap.sol"; 
// import "@openzeppelin/contracts/utils/math/Math.sol";


// /// @notice contract that governs most the tranching logic, including trading
// contract TrancheMaster {

// 	mapping(uint256=>tVault) vaults; //vaultId-> vault
// 	mapping(uint256=>Splitter) splitters; //vaultId->splitter
// 	mapping(uint256=>StableSwap) amms; 

// 	/// @notice adds vault, splitter, and amm when initiated 
// 	/// When created, msg sender should also add initial liquidity 
// 	function addVault(
// 		uint vaultId, 
// 		tVault vault, 
// 		Splitter splitter, 
// 		StableSwap amm) external 
// 	{
// 		vaults[vaultId] = vault; 
// 		splitters[vaultId] = splitter; 
// 		amms[amm] = amm; 
// 	}


// 	/// @notice adds vaults, spllitters, and amms 
// 	function createVault(uint vaultId){

// 	}	

// 	/// @notice buy tranche token in one go 
// 	/// @param amount is collateral in 
// 	/// @dev 1.Mints vault token
// 	/// 2. Splits Vault token from splitter 
// 	/// 3. Swap unwanted tToken to wanted tToken
// 	/// 4. Transfer wanted tToken to user 
// 	function buy_tranche(
// 		uint256 vaultId, 
// 		uint256 amount, 
// 		bool isSenior
// 		){
// 		tVault vault = vaults[vaultId]; 
// 		Splitter splitter = splitter[vaultId]; 
// 		amm = amms[vaultId]; 

// 		ERC20 collateral = ERC20(vault.getUnderlying); 

// 		//1
// 		collateral.safeTransferFrom(msg.sender, address(this), amount); 
// 		uint shares = vault.convertToShares(amount); 
// 		vault.mint(shares, address(this));

// 		//2
// 		vault.approve(address(splitter), shares); 
// 		(uint ja, uint sa) seniosplitter.split(vault, shares); //junior and senior now minted to this address 

// 		//Senior tokens are indexed at 0 in each amm 
// 		uint tokenIn = isSenior? 0 : 1;
// 		uint tokenOut = 1-tokenIn; 
// 		uint tokenInAmount = isSenior? sa: ja; 
// 		address[] memory tranches = splitter.getTrancheTokens(); 
// 		ERC20(tranches[tokenIn]).approve(tokenInAmount); 

// 		//3
// 		uint tokenOutAmount = amm.swap(tokenIn, tokenOut, tokenInAmount, 0); //this will give this contract tokenOut

// 		//4
// 		ERC20(tranches[tokenOut]).safeTransfer(msg.sender, tokenOutAmount); 
		

// 	}

// 	function sell_tranche(
// 		uint256 vaultId, 
// 		uint256 amount
// 		){}

// }