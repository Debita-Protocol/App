pragma solidity ^0.8.4;

import "../stablecoin/DSS.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

//Code borrowed and adapted from Tokemak 

/// @notice Vote payload to be submitted to Vote Tracker
struct UserVotePayload {
    address account;
    bytes32 voteSessionKey;
    uint256 nonce;
    uint256 chainId;
    uint256 totalVotes;
    UserVoteAllocationItem[] allocations;
}

/// @notice Individual allocation to an asset, exchange, or asset-pair
struct UserVoteAllocationItem {
    bytes32 reactorKey;
    uint256 amount; //18 Decimals
}


struct UserVoteDetails {
    uint256 totalUsedVotes;
    uint256 totalAvailableVotes;
}
contract VoteTracker {
    using SafeMath for uint256;

	DSS public dss;


	mapping(address => UserVoteDetails) userVoteDetails;
    mapping(address => bytes32[]) public userVoteKeys;
    mapping(address => mapping(bytes32 => uint256)) public userVoteItems;
    mapping(bytes32 => uint256) public systemAggregations;

    /// @dev Stores the users next valid vote nonce
    EnumerableSet.Bytes32Set private allowedreactorKeys;
	mapping(address => uint256) public  userNonces; 

	constructor (address dss_address) public{
		dss = DSS(dss_address);
	}



    //single user will call this vote function from UI, vote allocation for 
    //each potential borrowers 
	function vote(bytes32 _voteSessionKey, uint256 _nonce, uint256 _totalVotes,
        bytes32[] memory reactorKeys, uint256[] memory amounts)
	external  {
        uint256 key_lengths = reactorKeys.length; 
        UserVoteAllocationItem[] memory _allocations = new UserVoteAllocationItem[](key_lengths); 


        for (uint256 i=0; i < key_lengths; i++){
            _allocations[i] = UserVoteAllocationItem({
                reactorKey : reactorKeys[i], 
                amount: amounts[i]
                });

        }


        UserVotePayload memory payload  = UserVotePayload({
            account : msg.sender, 
            voteSessionKey : _voteSessionKey, 
            nonce: _nonce, 
            chainId : 0, 
            totalVotes: _totalVotes, 
            allocations: _allocations
            }); 

        _vote(payload);

	}


    function _removeUserVoteKey(address account, bytes32 reactorKey) internal  {
        for (uint256 i = 0; i < userVoteKeys[account].length; i++) {
            if (userVoteKeys[account][i] == reactorKey) {
                userVoteKeys[account][i] = userVoteKeys[account][userVoteKeys[account].length - 1];
                userVoteKeys[account].pop();
                break;
            }
        }
    }

    

	function _vote(UserVotePayload memory userVotePayload) internal  {
		address account = userVotePayload.account; 
		uint256 totalUsedVotes = userVoteDetails[account].totalUsedVotes;

        console.log('nonce', userNonces[account]);
		require(userNonces[account] == userVotePayload.nonce, "INVALID_NONCE");

		// Ensure the message cannot be replayed
        userNonces[account] = userNonces[account].add(1);

		for (uint256 i = 0; i < userVotePayload.allocations.length; i++) {
			bytes32 reactorKey = userVotePayload.allocations[i].reactorKey;
			uint256 amount = userVotePayload.allocations[i].amount; 

            //Ensure where they are voting is allowed
			//require(allowedreactorKeys.contains(reactorKey),  "PLACEMENT_NOT_ALLOWED"); 

            // check if user has already voted for this reactor
			if (userVoteItems[account][reactorKey]>0){
				if (amount ==0){
					_removeUserVoteKey(account, reactorKey);
				}

				uint256 currentAmount = userVoteItems[account][reactorKey];

            }

            else{
                
				if(amount>0){
					userVoteKeys[account].push(reactorKey);
					userVoteItems[account][reactorKey] = amount; 
					systemAggregations[reactorKey] = systemAggregations[reactorKey].add(amount);
					totalUsedVotes = totalUsedVotes.add(amount);
				}

            }

			
		}

        console.log('totalusedvotes',totalUsedVotes,  userVotePayload.totalVotes);
		require(totalUsedVotes == userVotePayload.totalVotes, "VOTE_TOTAL_MISMATCH");

        uint256 totalAvailableVotes = getMaxVoteBalance(account);
     //   require(totalUsedVotes <= totalAvailableVotes, "NOT_ENOUGH_VOTES");

        userVoteDetails[account] = UserVoteDetails({
        	totalUsedVotes: totalUsedVotes,
            totalAvailableVotes: totalAvailableVotes
        	}); 



	}



    function getMaxVoteBalance(address account) public view returns (uint256) {
    	uint256 dssbalance = dss.balanceOf(account); 

        return _getVotingPower(dssbalance);
    }

    function _getVotingPower(uint256 balance) private view returns (uint256) {
		return balance; 
    }


    //get vote for one borrower 
    function getVotes(bytes32 reactorKey) public view returns (uint256){
        return systemAggregations[reactorKey]; 
    }


}