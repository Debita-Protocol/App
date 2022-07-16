// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/IERC20Full.sol";
import "../balancer/BPool.sol";
import "./AbstractMarketFactoryV3.sol";
import "./FeePot.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SignedSafeMath.sol";
import "../libraries/Sport.sol";
import "../libraries/HasHeadToHeadMarket.sol";
import "../libraries/ResolveByScore.sol";
import "../libraries/Versioned.sol";

contract MLBMarketFactoryV3 is AbstractMarketFactoryV3, SportView, HasHeadToHeadMarket, ResolvesByScore, Versioned {
    using SafeMath for uint256;
    using SignedSafeMath for int256;

    uint256 constant HeadToHead = 0;
    string constant InvalidName = "No Contest";

    constructor(
        address _owner,
        IERC20Full _collateral,
        uint256 _shareFactor,
        FeePot _feePot,
        uint256[3] memory _fees,
        address _protocol,
        address _linkNode
    )
        AbstractMarketFactoryV3(_owner, _collateral, _shareFactor, _feePot, _fees, _protocol)
        Versioned("v1.4.0")
        ManagedByLink(_linkNode)
        HasHeadToHeadMarket(HeadToHead, InvalidName)
    {}

    function createEvent(
        uint256 _eventId,
        string memory _homeTeamName,
        uint256 _homeTeamId,
        string memory _awayTeamName,
        uint256 _awayTeamId,
        uint256 _startTimestamp,
        int256[2] memory _moneylines // [home,away]
    ) public onlyLinkNode returns (uint256[] memory _marketIds) {
        _marketIds = makeMarkets(_moneylines, _homeTeamName, _awayTeamName);
        makeSportsEvent(
            _eventId,
            _marketIds,
            build1Line(),
            _startTimestamp,
            _homeTeamId,
            _awayTeamId,
            _homeTeamName,
            _awayTeamName
        );
    }

    function makeMarkets(
        int256[2] memory _moneylines,
        string memory _homeTeamName,
        string memory _awayTeamName
    ) internal returns (uint256[] memory _marketIds) {
        _marketIds = new uint256[](1);
        _marketIds[HeadToHead] = makeHeadToHeadMarket(_moneylines, _homeTeamName, _awayTeamName);
    }

    function resolveValidEvent(
        SportsEvent memory _event,
        uint256 _homeScore,
        uint256 _awayScore
    ) internal override {
        resolveHeadToHeadMarket(_event.markets[HeadToHead], _homeScore, _awayScore);
    }
}
