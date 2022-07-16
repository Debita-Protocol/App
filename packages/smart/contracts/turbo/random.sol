// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


import "../libraries/IERC20Full.sol";
import "../balancer/BPool.sol";
import "./AbstractMarketFactoryV3.sol";
import "./FeePot.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SignedSafeMath.sol";
import "./MMAMarketFactoryV3.sol";
import "./AMMFactory.sol";
import "./CryptoMarketFactoryV3.sol";
import "./NBAMarketFactoryV3.sol";
import "../rewards/MasterChef.sol";
import "./CryptoCurrencyMarketFactoryV3.sol";
import "./TrustedMarketFactoryV3.sol";
import "./Fetcher.sol";

contract TrustedFetcher is Fetcher {
    constructor() Fetcher("Trusted", "TBD") {}

    struct SpecificMarketFactoryBundle {
        MarketFactoryBundle _super;
    }

    struct SpecificStaticMarketBundle {
        StaticMarketBundle _super;
        // uint256 coinIndex;
        // uint256 creationValue;
        // uint256 resolutionTime;
        // // Dynamics
        // uint256 resolutionValue;
        string description;
    }

    struct SpecificDynamicMarketBundle {
        DynamicMarketBundle _super;
        //uint256 resolutionValue;
        string description;

    }

    function sayHi() public view returns(uint256){
        return 0; 
    }

    function getMarket( address _marketFactory,
    AMMFactory _ammFactory,
    MasterChef _masterChef,
    uint256 _marketId) public view returns(   SpecificStaticMarketBundle memory _bundle
){
    TrustedMarketFactoryV3.MarketDetails memory _details =
        TrustedMarketFactoryV3(_marketFactory).getMarketDetails(_marketId);
    _bundle._super = buildStaticMarketBundle(
        TrustedMarketFactoryV3(_marketFactory),
        _ammFactory,
        _masterChef,
        _marketId
    );
    _bundle.description = _details.description;
    }


  function fetchInitial(
        address _marketFactory,
        AMMFactory _ammFactory,
        MasterChef _masterChef,
        uint256 _offset,
        uint256 _total
    )
        public
        view
        returns (
            SpecificMarketFactoryBundle memory _marketFactoryBundle,
            SpecificStaticMarketBundle[] memory _marketBundles,
            uint256 _lowestMarketIndex,
            uint256 _timestamp
        )
    {
        _marketFactoryBundle = buildSpecificMarketFactoryBundle(_marketFactory);

        uint256[] memory _marketIds;

       (_marketIds, _lowestMarketIndex) = listOfInterestingMarkets(_marketFactory, _offset, _total);
        // (_marketIds, _lowestMarketIndex) = interestingMarkets(_marketFactory, _offset, _total);

        _total = _marketIds.length;
        _marketBundles = new SpecificStaticMarketBundle[](_total);
        for (uint256 i; i < _total; i++) {
            _marketBundles[i] = buildSpecificStaticMarketBundle(
                _marketFactory,
                _ammFactory,
                _masterChef,
                 _marketIds[i]
                
            );
        }

        _timestamp = block.timestamp;
    }


    function buildSpecificMarketFactoryBundle(address _marketFactory)
        internal
        view
        returns (SpecificMarketFactoryBundle memory _bundle)
    {
        _bundle._super = buildMarketFactoryBundle(TrustedMarketFactoryV3(_marketFactory));
    }


 function buildSpecificStaticMarketBundle(
        address _marketFactory,
        AMMFactory _ammFactory,
        MasterChef _masterChef,
        uint256 _marketId
    ) internal view returns (SpecificStaticMarketBundle memory _bundle) {
        TrustedMarketFactoryV3.MarketDetails memory _details =
            TrustedMarketFactoryV3(_marketFactory).getMarketDetails(_marketId);
        _bundle._super = buildStaticMarketBundle(
            TrustedMarketFactoryV3(_marketFactory),
            _ammFactory,
            _masterChef,
            _marketId+1
        );
        _bundle.description = _details.description;
        // _bundle.creationValue = _details.creationValue;
        // _bundle.coinIndex = _details.coinIndex;
        // _bundle.resolutionValue = _details.resolutionValue;
        // _bundle.resolutionTime = _details.resolutionTime;
    }

function listOfInterestingMarkets(
        address _marketFactory,
        uint256 _offset,
        uint256 _total
    ) internal view returns (uint256[] memory _interestingMarketIds, uint256 _marketId) {
        _interestingMarketIds = new uint256[](_total);
        uint256 _max = AbstractMarketFactoryV3(_marketFactory).marketCount() - 1;

        // No markets so return nothing. (needed to prevent integer underflow below)
        if (_max == 0 || _offset >= _max) {
            return (new uint256[](0), 0);
        }

        // Starts at the end, less offset.
        // Stops before the 0th market since that market is always fake.
        uint256 _collectedMarkets = 0;
        _marketId = _max - _offset-1;

        while (true) {
            if (openOrHasWinningShares(AbstractMarketFactoryV3(_marketFactory), _marketId)) {
                _interestingMarketIds[_collectedMarkets] = _marketId;
                _collectedMarkets++;
            }

            if (_collectedMarkets >= _total) break;
            if (_marketId == 0) break; // skipping 0th market, which is fake
            _marketId--; // starts out oone too high, so this works
        }

        if (_total > _collectedMarkets) {
            assembly {
                // shortens array
                mstore(_interestingMarketIds, _collectedMarkets)
            }
        }
    }

    function fetchDynamic(
        address _marketFactory,
        AMMFactory _ammFactory,
        uint256 _offset,
        uint256 _total
    )
        public
        view
        returns (
            SpecificDynamicMarketBundle[] memory _bundles,
            uint256 _lowestMarketIndex,
            uint256 _timestamp
        )
    {
        uint256[] memory _marketIds;
        (_marketIds, _lowestMarketIndex) = listOfInterestingMarkets(_marketFactory, _offset, _total);

        _total = _marketIds.length;
        _bundles = new SpecificDynamicMarketBundle[](_total);
        for (uint256 i; i < _total; i++) {
            _bundles[i] = buildSpecificDynamicMarketBundle(_marketFactory, _ammFactory, _marketIds[i]);
        }

        _timestamp = block.timestamp;
    }
 


    function buildSpecificDynamicMarketBundle(
        address _marketFactory,
        AMMFactory _ammFactory,
        uint256 _marketId
    ) internal view returns (SpecificDynamicMarketBundle memory _bundle) {
        TrustedMarketFactoryV3.MarketDetails memory _details =
            TrustedMarketFactoryV3(_marketFactory).getMarketDetails(_marketId);
        _bundle._super = buildDynamicMarketBundle(TrustedMarketFactoryV3(_marketFactory), _ammFactory, _marketId+1);
        _bundle.description = _details.description;
    }


    }






// contract TrustedFetcher is Fetcher {
//     constructor() Fetcher("Trusted", "TBD") {}

//     struct SpecificMarketFactoryBundle {
//         MarketFactoryBundle _super;
//     }

//     struct SpecificStaticMarketBundle {
//         StaticMarketBundle _super;
//         // uint256 coinIndex;
//         // uint256 creationValue;
//         // uint256 resolutionTime;
//         // // Dynamics
//         // uint256 resolutionValue;
//         string description;
//     }

//     struct SpecificDynamicMarketBundle {
//         DynamicMarketBundle _super;
//         //uint256 resolutionValue;
//         string description;

//     }

//     function getMarket(    address _marketFactory,
//         AMMFactory _ammFactory,
//         MasterChef _masterChef,
//         uint256 _marketId) public view returns(   SpecificStaticMarketBundle memory _bundle
// ){
//         TrustedMarketFactoryV3.MarketDetails memory _details =
//             TrustedMarketFactoryV3(_marketFactory).getMarketDetails(_marketId);
//         _bundle._super = buildStaticMarketBundle(
//             TrustedMarketFactoryV3(_marketFactory),
//             _ammFactory,
//             _masterChef,
//             _marketId
//         );
//         _bundle.description = _details.description;
//     }

//     function buildSpecificMarketFactoryBundle(address _marketFactory)
//         internal
//         view
//         returns (SpecificMarketFactoryBundle memory _bundle)
//     {
//         _bundle._super = buildMarketFactoryBundle(TrustedMarketFactoryV3(_marketFactory));
//     }

//     function buildSpecificStaticMarketBundle(
//         address _marketFactory,
//         AMMFactory _ammFactory,
//         MasterChef _masterChef,
//         uint256 _marketId
//     ) internal view returns (SpecificStaticMarketBundle memory _bundle) {
//         TrustedMarketFactoryV3.MarketDetails memory _details =
//             TrustedMarketFactoryV3(_marketFactory).getMarketDetails(_marketId);
//         _bundle._super = buildStaticMarketBundle(
//             TrustedMarketFactoryV3(_marketFactory),
//             _ammFactory,
//             _masterChef,
//             _marketId
//         );
//         _bundle.description = _details.description;
//         // _bundle.creationValue = _details.creationValue;
//         // _bundle.coinIndex = _details.coinIndex;
//         // _bundle.resolutionValue = _details.resolutionValue;
//         // _bundle.resolutionTime = _details.resolutionTime;
//     }

//     function buildSpecificDynamicMarketBundle(
//         address _marketFactory,
//         AMMFactory _ammFactory,
//         uint256 _marketId
//     ) internal view returns (SpecificDynamicMarketBundle memory _bundle) {
//         TrustedMarketFactoryV3.MarketDetails memory _details =
//             TrustedMarketFactoryV3(_marketFactory).getMarketDetails(_marketId);
//         _bundle._super = buildDynamicMarketBundle(TrustedMarketFactoryV3(_marketFactory), _ammFactory, _marketId);
//         _bundle.description = _details.description;
//     }

//     function fetchInitial(
//         address _marketFactory,
//         AMMFactory _ammFactory,
//         MasterChef _masterChef,
//         uint256 _offset,
//         uint256 _total
//     )
//         public
//         view
//         returns (
//             SpecificMarketFactoryBundle memory _marketFactoryBundle,
//             SpecificStaticMarketBundle[] memory _marketBundles,
//             uint256 _lowestMarketIndex,
//             uint256 _timestamp
//         )
//     {
//         _marketFactoryBundle = buildSpecificMarketFactoryBundle(_marketFactory);

//         uint256[] memory _marketIds;
//         (_marketIds, _lowestMarketIndex) = listOfInterestingMarkets(_marketFactory, _offset, _total);

//         _total = _marketIds.length;
//         _marketBundles = new SpecificStaticMarketBundle[](_total);
//         for (uint256 i; i < _total; i++) {
//             _marketBundles[i] = buildSpecificStaticMarketBundle(
//                 _marketFactory,
//                 _ammFactory,
//                 _masterChef,
//                 _marketIds[i]
//             );
//         }

//         _timestamp = block.timestamp;
//     }

//     function fetchDynamic(
//         address _marketFactory,
//         AMMFactory _ammFactory,
//         uint256 _offset,
//         uint256 _total
//     )
//         public
//         view
//         returns (
//             SpecificDynamicMarketBundle[] memory _bundles,
//             uint256 _lowestMarketIndex,
//             uint256 _timestamp
//         )
//     {
//         uint256[] memory _marketIds;
//         (_marketIds, _lowestMarketIndex) = listOfInterestingMarkets(_marketFactory, _offset, _total);

//         _total = _marketIds.length;
//         _bundles = new SpecificDynamicMarketBundle[](_total);
//         for (uint256 i; i < _total; i++) {
//             _bundles[i] = buildSpecificDynamicMarketBundle(_marketFactory, _ammFactory, _marketIds[i]);
//         }

//         _timestamp = block.timestamp;
//     }

//     // Starts from the end of the markets list because newer markets are more interesting.
//     // _offset is skipping all markets, not just interesting markets
//     function listOfInterestingMarkets(
//         address _marketFactory,
//         uint256 _offset,
//         uint256 _total
//     ) internal view returns (uint256[] memory _interestingMarketIds, uint256 _marketId) {
//         _interestingMarketIds = new uint256[](_total);
//         uint256 _max = AbstractMarketFactoryV3(_marketFactory).marketCount() - 1;

//         // No markets so return nothing. (needed to prevent integer underflow below)
//         if (_max == 0 || _offset >= _max) {
//             return (new uint256[](0), 0);
//         }

//         // Starts at the end, less offset.
//         // Stops before the 0th market since that market is always fake.
//         uint256 _collectedMarkets = 0;
//         _marketId = _max - _offset;

//         while (true) {
//             if (openOrHasWinningShares(AbstractMarketFactoryV3(_marketFactory), _marketId)) {
//                 _interestingMarketIds[_collectedMarkets] = _marketId;
//                 _collectedMarkets++;
//             }

//             if (_collectedMarkets >= _total) break;
//             if (_marketId == 1) break; // skipping 0th market, which is fake
//             _marketId--; // starts out oone too high, so this works
//         }

//         if (_total > _collectedMarkets) {
//             assembly {
//                 // shortens array
//                 mstore(_interestingMarketIds, _collectedMarkets)
//             }
//         }
//     }