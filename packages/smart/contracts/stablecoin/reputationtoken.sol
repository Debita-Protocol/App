pragma solidity ^0.8.4; 
//https://github.com/poap-xyz/poap-contracts/tree/master/contracts
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IController.sol";
import "./IReputationNFT.sol";


contract ReputationNFT is IReputationNFT, ERC721, ReentrancyGuard{
    modifier onlyController(){
        require(address(controller) == msg.sender, "is not controller"); 
        _;
    }


    IController controller; 
  	mapping(uint256=>address) idToOwner; 
  	mapping(address=>uint256) OwnerToId;
  	mapping(uint256=>uint256) private reputation; 
 	  uint256 public totalNumMints;
    uint256 total_score; 

  constructor(address controller_address) ERC721("ReputationNFT", "REPU"){
  		controller = IController(controller_address); 
  	}	


  function _transfer(address from, address to, uint256 tokenId) internal virtual override{
  		revert("Can't Transfer");
  	}
	
 
  function mint(address recipient) 
    external 
    override 
    onlyController 
    {
  		uint256 id = ++totalNumMints; 
  		_safeMint(recipient, id); 
  	}

  	//Called by controller when market resolves 
  function add_reputation(address recipient, uint256 score) 
    external 
    override 
    onlyController 
    {
    	uint256 id = OwnerToId[recipient];
      reputation[id] = reputation[id] + score; 
      total_score = total_score + score; 
	 }

	function get_reputation(address recipient) public view override returns(uint256){
		return reputation[OwnerToId[recipient]];
	}

  function get_total_score() public view override returns(uint256){
    return total_score; 
  }


}