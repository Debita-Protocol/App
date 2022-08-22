// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AbstractMarketFactoryV3.sol";
import "../libraries/CalculateLinesToBPoolOdds.sol";
import "../libraries/Versioned.sol";

contract TrustedMarketFactoryV3 is AbstractMarketFactoryV3, CalculateLinesToBPoolOdds, Versioned {

    struct MarketDetails {
        string description;
    }
    MarketDetails[] internal marketDetails;
    // mapping(uint256=> mapping(uint256=>uint256)) TradeDetails; //marketid -> (outcome->amount)

    modifier onlyOwnerManager() {
        require(msg.sender == owner || managers[msg.sender] , "Only Validators can call this function");
        _;
    }

    mapping(address=>bool) managers; 

    constructor(
        address _owner,
        IERC20Full _collateral,
        uint256 _shareFactor,
        FeePot _feePot,
        uint256[3] memory _fees,
        address _protocol
    ) AbstractMarketFactoryV3(_owner, _collateral, _shareFactor, _feePot, _fees, _protocol) Versioned("v1.1.0") {}

    //TODO add managers 
    function createMarket(
        address _creator,
        string calldata _description,
        string[] calldata _names,
        uint256[] calldata _odds
    ) public  returns (uint256) {
        marketDetails.push(MarketDetails(_description));
        return startMarket(_creator, _names, _odds, true);
    }

    //TODO add managers 
    function trustedResolveMarket(uint256 _id, uint256 _winningOutcome) public {
        endMarket(_id, _winningOutcome);
    }

    function getMarketDetails(uint256 _id) public view returns (MarketDetails memory) {
        return marketDetails[_id];
    }

    function getRewardEndTime(uint256 _marketId) public view override returns (uint256) {
        return 0;
    }
    

    //ZCB markets
      function createZCBMarket(
        address _creator,
        string calldata _description,
        OwnedERC20[] memory zcb
    ) public  returns (uint256) {
        uint256[] memory odds = new uint256[](2); //TODO get rid of this 
        odds[0] = 0;
        odds[1] = 0; 

        marketDetails.push(MarketDetails(_description));
        return startZCBMarket(_creator, odds, true, zcb);
    }
}