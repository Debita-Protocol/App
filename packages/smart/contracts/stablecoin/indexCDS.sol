pragma solidity ^0.8.4; 

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../ERC20/IERC20.sol";


 contract IndexCDS is ERC721, ReentrancyGuard{


 	struct Index{
 		uint256 value;
 		uint256[] amounts; 
 		address[] tokens; 
 	}

 	uint256 public totalNumMints;
 	mapping(uint256 => Index) indexes; 
 	mapping(address=>uint256) address_to_id;
 	//

 	//Call to amm factory
 	function getPrice(address token) internal view returns(uint256){
 		return 1; 
 	}

 	//Returns the maximum return of this nft including and excluding longCDS tokens
 	function getAPR(address holder) public view returns(uint256){

 	}

 	function curValue(address holder) view returns(uint256){
 		uint256 memory lockID = address_to_id[holder]; 
 		address[] memory tokens_ = indexes[lockID].tokens; 
 		uint256[] memory amounts = indexes[lockID].amounts; 

 		uint256 num_tokens = prices.length;
 		uint256 price; 
 		uint256 value;
 	//	uint256[] memory prices; 
 		for (uint256 i=0; i< num_tokens; i++){ 
 			price = getPrice(tokens_[i]); 
 			value = value + (price * amounts[i]); 
 		};

 		

 	}

 	//Mints nft for current price of each cds 
 	function mintIndex(address recipient, 
 					   uint256[] calldata prices,
 					   uint256[] calldata amounts, 
 					   address[] calldata tokens_addresses) external returns(uint256){
 		lockID = ++totalNumMints; 

 		uint256 num_tokens = prices.length;
 		uint256 value; 
 		for (uint256 i=0; i< num_tokens; i++){ 
 			value = value + (prices[i] * amounts[i]);
 			SafeERC20.safeTransferFrom(IERC20(tokens_addresses[i]), recipient, address(this), amounts[i]); 

 		};

 		Index memory index = Index(value,amounts, tokens_addresses); 
 		indexes[lockID] = index; 
 		address_to_id[recipient] = lockID; 

		_safeMint(recipient, lockID); 

		return lockID; 


 	}

 	//Redeems all possible 
 	function redeemIndex(address recipient, uint256 lockID) external {
 		
 		Index memory index = indexs[lockID]; 
 		uint256 num_tokens = index.amounts.length;

 		for (uint256 i=0; i< num_tokens, i++){
 			SafeERC20.safeTransfer(IERC20(index.tokens[i]), recipient, index.amounts[i]); 
 		}

 		_burn(lockID); 
 		delete indexes[lockID]; 


 } 	


}
