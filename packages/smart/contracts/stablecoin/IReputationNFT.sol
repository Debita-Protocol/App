pragma solidity ^0.8.4; 


interface IReputationNFT {



 
  function mint(address recipient) external;  
    
  function add_reputation(address recipient, uint256 score) external; 
     
	function get_reputation(address recipient) external view returns(uint256); 
  function get_total_score() external view returns(uint256); 


}