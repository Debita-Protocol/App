// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {VRFConsumerBaseV2} from "../chainlink/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "../chainlink/VRFCoordinatorV2Interface.sol";

contract ChainlinkClient is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;

    // Your subscription ID.
    uint64 private immutable s_subscriptionId;

    // Goerli coordinator. For other networks,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations


    // The gas lane to use, which specifies the maximum gas price to bump to.
    // For a list of available gas lanes on each network,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    bytes32 private keyHash;

    // Depends on the number of requested values that you want sent to the
    // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
    // so 100,000 is a safe default for this example contract. Test and adjust
    // this limit based on the network that you select, the size of the request,
    // and the processing of the callback request in the fulfillRandomWords()
    // function.
    uint32 private callbackGasLimit = 100000;

    // The default is 3, but you can set this higher.
    uint16 private requestConfirmations = 3;

    uint256[] public s_randomWords;
    uint256 public s_requestId;
    address s_owner;

    mapping(uint256 => bool) used; // marketId => whether vrf has been called for a specific market
    mapping(uint256 => address[]) candidates; // marketId => possible validators.

    constructor(
        bytes32 _keyHash,
        address _vrfCoordinator,
        uint64 subscriptionId
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        s_owner = msg.sender;
        s_subscriptionId = subscriptionId;
        keyHash = _keyHash;
    }

    modifier onlyOwner() {
        require(msg.sender == s_owner);
        _;
    }

    /**
     @notice called by oracle on completion
     */
    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        s_randomWords = randomWords;
    }

    function requestRandomWords(
        uint32 numWords,
        uint256 marketId,
        address[] memory _candidates
    ) external onlyOwner {
        require(!used[marketId], "random words already requested for this marketId");
        used[marketId] = true;
        candidates[marketId] = _candidates;

        // Will revert if subscription is not set and funded.
        s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
    }

    /**
     @dev should only be called by marketManager.
     */
    function deleteWords() external {
        delete s_randomWords;
    }

    function wordLength() external returns (uint256) {
        return s_randomWords.length;
    }

    function getNums() external returns (uint256[] memory) {
        return s_randomWords;
    }
}
