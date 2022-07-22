pragma solidity ^0.8.4; 

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

//import "../ERC20/IERC20.sol";

import "../turbo/AMMFactory.sol"; 
import "../turbo/OwnedShareToken.sol"; 
import "hardhat/console.sol";

contract IndexCDS is ERC721, ReentrancyGuard{

	//For each lockID
 	struct Index{
 		uint256 value;
 		uint256[] amounts; 
 		address[] tokens; 
 		
 	}

 	struct Index_info{
 		uint256[] token_amounts;
 		uint256[] marketIds; 
 		uint256[] outcomes; 
 		uint256 lockId; 
 	}

 	struct Variable{
 		uint256 amount;
 		uint256 marketId;
 		uint256 outcome;
 	}

 	uint256 public totalNumMints;
 	uint256 num_outcomes = 2; //TODO this is only for binary outcomes 
 	mapping(uint256=> Index_info) index_infos; //lockid to indiexinfo
 	mapping(uint256 => Index) indexes; 
 	mapping(address=>uint256[]) address_to_id;

 	constructor()
        ERC721("IndexCDS", "iCDS"){

        }
  
 	//TODO Call to amm factory
 	function getPrice(address token) internal view returns(uint256){
 		return 1; 
 	}

 	//TODO Returns the maximum return of this nft including and excluding longCDS tokens
 	function getAPR(address holder) public view returns(uint256){
 		return 1; 
 	}

 	// function curValue(address holder) public view returns(uint256){
 	// 	uint256 lockID = address_to_id[holder]; 
 	// 	address[] memory tokens_ = indexes[lockID].tokens; 
 	// 	uint256[] memory amounts = indexes[lockID].amounts; 

 	// 	uint256 num_tokens = tokens_.length;
 	// 	uint256 price; 
 	// 	uint256 value;
 	// //	uint256[] memory prices; 
 	// 	for (uint256 i=0; i< num_tokens; i++){ 
 	// 		price = getPrice(tokens_[i]); 
 	// 		value = value + (price * amounts[i]); 
 	// 	}


 	// }

 	//Mints nft for current price of each cds 
 	//Token addresses are for CDS(sharetokens in marketfactory) tokens 
 	function mintIndex(address recipient,  bool from_recipient, 
 					   uint256[] memory prices,
 					   uint256[] memory amounts, //this is token amount, not collateral
 					   address[] memory tokens_addresses 
 					   ) internal returns(uint256){
 		uint256 lockID = ++totalNumMints; 

 		uint256 num_tokens = prices.length;
 		uint256 value; 
 		for (uint256 i=0; i< num_tokens; i++){ 
 			value = value + (prices[i] * amounts[i]);

 			if (from_recipient){
 				OwnedERC20(tokens_addresses[i]).transferFrom(recipient, address(this), amounts[i]);
 			}//else each sharetokens are already owned by this contract 

 		}

 		Index memory index = Index(value,amounts, tokens_addresses); 
 		indexes[lockID] = index; 
 		address_to_id[recipient].push(lockID); 

		_safeMint(recipient, lockID); 

		return lockID; 


 	}

 	
 	function redeemIndex(address recipient, uint256 lockID, bool from_recipient) internal {
 		
 		Index memory index = indexes[lockID]; 
 		uint256 num_tokens = index.amounts.length;

 		if (from_recipient){
	 		for (uint256 i=0; i< num_tokens; i++){
	 			SafeERC20.safeTransfer(IERC20(index.tokens[i]), recipient, index.amounts[i]); 
	 		}
 		}

 		_burn(lockID); 
 		delete indexes[lockID]; 


 } 	



 	function getVariable(
 		uint256[] memory marketIds, 
 		uint256[] memory outcomes, 
 		uint256[] memory amounts) internal returns(Variable[] memory){

 		Variable[] memory variables = new Variable[](marketIds.length);
 		for (uint256 i=0; i< marketIds.length; i++){
 			variables[i] = Variable(amounts[i], marketIds[i], outcomes[i]); 			
 		}
 		return variables; 
 	}

 	//Public View Functions
 	function getUserLockId(address user) public view returns(uint256[] memory){
 		return address_to_id[user];
 	}

 	// function getUserIndexInfo(address user) public view returns(Index_info memory){
 	// 	uint256[] memory lockId = address_to_id[user]; 
 	// 	return index_infos[lockId];
 	// }

 	// function getUserCDSBalance() public view returns(uint256[] memory){
 	// 	uint256[] memory lockIds = address_to_id[user]; //nfts that this user has 


 	// 	Index memory index = indexes[lockId]; 
 	// 	address[] memory tokens = index.tokens; 
 	// 	uint256[] memory balance; 
 	// 	for (i=0; i< tokens.length; i++){
 	// 		balance[i] = tokens[i].balanceOf(address(this)); 

 	// 	}
 	// 	return balance; 
 	// }

 	function getUserTotalBalance(address user) public view returns(Index_info[] memory){
 		uint256[] memory lockIds = address_to_id[user];
 		Index_info[] memory user_infos = new Index_info[](lockIds.length);
 		for (uint256 i=0; i<lockIds.length; i++){
 			user_infos[i] = index_infos[lockIds[i]]; 
 		}

 		return user_infos; 

 	}



 	//State Changing Functions


 	/* This is the function called by contract calls, it first transfers the DS
 	from the msg.sender to this contract, and this contract will buy all the sharetokens
 	in behalf. It will then mint the nft and give it back to msg.sender
 	does the minting nft as well.
 	User gives collateral to this contract, this contract buys sharetokens + mints nft and gives back
 	*/
 	function buyBulk(address recipient,  
 		address marketFactoryAddress, 
 		address ammFactoryAddress, 
 		uint256[] memory marketIds,
 		uint256[] memory outcomes, 
 		uint256[] memory amounts) external returns(uint256){

 		uint256 num_buys = marketIds.length; 
 		AMMFactory amm = AMMFactory(ammFactoryAddress); 
 		AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);
 		IERC20 collateral = marketFactory.collateral(); //DS

 		uint256[] memory prices = new uint256[](num_buys); 
 		uint256[] memory token_amounts = new uint256[](num_buys); 
 		address[] memory outcometokens = new address[](num_buys); 

 		Variable[] memory variable = getVariable(marketIds, outcomes, amounts);
 		//Iterate over all chosen markets 
 		for (uint256 i=0; i<num_buys; i++){
 			//Should transfer collateral all at once to save gas 
 			//This allows this contract to now have the sharetokens for each outcome 

 			token_amounts[i] = executeBuy(marketFactory,amm,
 			 collateral, msg.sender, variable[i]); 

 			outcometokens[i] = getOutcomeToken(marketFactory,variable[i]);
 			prices[i] = getPrice(outcometokens[i]); //TODO find how to calculate prices 

 		}

 		uint256 lockId = mintIndex(msg.sender,false, prices, token_amounts, outcometokens  );
 		index_infos[lockId] = Index_info(token_amounts, marketIds, outcomes, lockId);
 		
 		return lockId;
 	}

 	function getOutcomeToken(AbstractMarketFactoryV3 marketFactory,
 		Variable memory variable ) internal returns(address){
 		AbstractMarketFactoryV3.Market memory _market =  marketFactory.getMarket(variable.marketId); 

 		return address(_market.shareTokens[variable.outcome]); 
 	}

 	function executeBuy(AbstractMarketFactoryV3 marketFactory, 
 		AMMFactory amm, 
 		IERC20 collateral, 
 		address recipient, 
 		Variable memory variable) internal returns(uint256){


 		collateral.transferFrom(recipient, address(this), variable.amount); 
 		collateral.approve(address(amm), variable.amount); 

 		return amm.buy(marketFactory, variable.marketId,
 			variable.outcome,variable.amount, 0);
 	}


 	//User gives id of its NFT to this contract, it then burns the NFT and sell the underlying tokens, 
 	//and gives the collateral back to the user. For now it will sell all tokens and give the collateral
 	//for all tokens back. Users will have to rebuy if they want to just get rid of one token 
 	function sellBulk(address recipient, 
 		uint256 lockID, 
 		address marketFactoryAddress, 
 		address ammFactoryAddress) external {

 		AMMFactory amm = AMMFactory(ammFactoryAddress); 
 		AbstractMarketFactoryV3 marketFactory = AbstractMarketFactoryV3(marketFactoryAddress);
 		IERC20 collateral = marketFactory.collateral(); 

 		Index_info memory info = index_infos[lockID]; 

 		uint256[] memory shareTokensIn = new uint256[](num_outcomes); 
 		uint256 total_collateral_out = 0; 
 		uint256 num_sells = info.marketIds.length; 


 		for (uint256 i=0; i< num_sells; i++){

 			for(uint256 j=0; j<num_outcomes; j++){
 				//outcome[i] is 0 or 1 (if it is binary)
 				//0 if outcome[i] != j, info.token_amounts[i] otherwise
 				//bool isZero = (info.outcomes[i] != j);
 				//shareTokensIn[j] = isZero ? 0: info.token_amounts[i];
 				shareTokensIn[j] = info.token_amounts[i];
 			}
 			//need to approve amm for the sharetokens; 
 			sell_approve(marketFactory, amm, info.marketIds[i], info.outcomes[i], shareTokensIn); 

 			total_collateral_out = total_collateral_out + amm.sellForCollateral(
 				marketFactory, 
 				info.marketIds[i],
 				info.outcomes[i], 
 				shareTokensIn, 
 				0);
 			//Now this contract holds the collateral, so should give it back to msg.sender
 		}

 		redeemIndex( recipient,  lockID,  false); 
 		collateral.transfer(msg.sender, total_collateral_out ); 



 	}

 	function sell_approve(AbstractMarketFactoryV3 marketFactory, 
 		AMMFactory amm ,
 		uint256 marketId, 
 		uint256 outcome, 
 		uint256[] memory shareTokensIn ) private {
 		require(shareTokensIn[outcome] > 0); 
 		 AbstractMarketFactoryV3.Market memory _market = marketFactory.getMarket(marketId);
 		 _market.shareTokens[outcome].approve(address(amm), shareTokensIn[outcome]); 
 	}


}
