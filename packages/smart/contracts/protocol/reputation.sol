pragma solidity ^0.8.9;

// contract ReputationSystem {
//     using SafeMath for uint256;
//     mapping(address=>uint256) public trader_scores; // trader address => score
//     mapping(address=>bool) public isRated;
//     address[] public traders;

//   /**
//    @notice calculates whether a trader meets the requirements to trade during the reputation assessment phase.
//    @param percentile: 0-100 w/ WAD.
//    */
//   function isReputable(address trader, uint256 percentile) view external returns (bool) {
//     uint256 k = _findTrader(trader);
//     uint256 n = (traders.length - (k+1))*config.WAD;
//     uint256 N = traders.length*config.WAD;
//     uint256 p = uint256(n).divWadDown(N)*10**2;

//     if (p >= percentile) {
//       return true;
//     } else {
//       return false;
//     }
//   }

//   /**
//    @notice finds the first trader within the percentile
//    @param percentile: 0-100 WAD
//    @dev returns 0 on no minimum threshold
//    */
//   function calculateMinScore(uint256 percentile) view external returns (uint256) {
//     uint256 l = traders.length * config.WAD;
//     if (percentile / 1e2 == 0) {
//       return 0;
//     }
//     uint256 x = l.mulWadDown(percentile / 1e2);
//     x /= config.WAD;
//     return trader_scores[traders[x - 1]];
//   }

//   function setTraderScore(address trader, uint256 score) external {
//     uint256 prev_score = trader_scores[trader];
//     if (score > prev_score) {
//       _incrementScore(trader, score - prev_score);
//     } else if (score < prev_score) {
//       _decrementScore(trader, prev_score - score);
//     }
//   }

//   /**
//    @dev percentile is is wad 0-100
//    @notice returns a list of top X percentile traders excluding the utilizer. 
//    */
//   function _filterTraders(uint256 percentile, address utilizer) view public returns (address[] memory) {
//     uint256 l = traders.length * config.WAD;
    
//     // if below minimum percentile, return all traders excluding the utilizer
//     if (percentile / 1e2 == 0) {
//       console.log("here");
//       if (isRated[utilizer]) {
//         address[] memory result = new address[](traders.length - 1);

//         uint256 j = 0;
//         for (uint256 i=0; i<traders.length; i++) {
//           if (utilizer == traders[i]) {
//             j = 1;
//             continue;
//           }
//           result[i - j] = traders[i];
//         }
//         return result;
//       } else {
//         return traders;
//       }
//     }

//     uint256 x = l.mulWadDown((config.WAD*100 - percentile) / 1e2);
//     x /= config.WAD;

//     address[] memory selected; 
//     if (utilizer == address(0) || !isRated[utilizer]) {
//       selected = new address[](x);
//       for (uint256 i=0; i<x; i++) {
//         selected[i] = traders[i];
//       }
//     } else {
//       selected = new address[](x - 1);
//       uint256 j=0;
//       for (uint256 i = 0; i<x; i++) {
//         if (traders[i] == utilizer) {
//           j = 1;
//           continue;
//         }
//         selected[i - j] = traders[i];
//       }
//     }

//     return selected;
//   }

//   /**
//    @notice retrieves all rated traders
//    */
//   function getTraders() public returns (address[] memory) {
//     return traders;
//   }

//   /**
//    @notice increments trader's score
//    @dev score >= 0, update > 0
//    */
//   function _incrementScore(address trader, uint256 update) public {
//     trader_scores[trader] += update;
//     _updateRanking(trader, true);
//   }

//   /**
//    @notice decrements trader's score
//    @dev score >= 0, update > 0
//    */
//   function _decrementScore(address trader, uint256 update) public {
//     if (update >= trader_scores[trader]) {
//       trader_scores[trader] = 0;
//     } else {
//       trader_scores[trader] -= update;
//     }
//     _updateRanking(trader, false);
//   }

//   /**
//    @notice updates top trader array
//    */
//   function _updateRanking(address trader, bool increase) internal {
//     uint256 score = trader_scores[trader];

//     if (!isRated[trader]) {
//       isRated[trader] = true;
//       if (traders.length == 0) {
//         traders.push(trader);
//         return;
//       }
//       for (uint256 i=0; i<traders.length; i++) {
//         if (score > trader_scores[traders[i]]) {
//           traders.push(address(0));
//           _shiftRight(i, traders.length-1);
//           traders[i] = trader;
//           return;
//         }
//         if (i == traders.length - 1) {
//           traders.push(trader);
//           return;
//         }
//       }
//     } else {
//       uint256 k = _findTrader(trader);
//       //swap places with someone.
//       if ((k == 0 && increase)
//       || (k == traders.length - 1 && !increase)) {
//         return;
//       }

//       if (increase) {
//         for (uint256 i=0; i<k; i++) {
//           if (score > trader_scores[traders[i]]) {
//             _shiftRight(i,k);
//             traders[i] = trader;
//             return;
//           }
//         }
//       } else {
//         for (uint256 i=traders.length - 1; i>k; i--) {
//           if (score < trader_scores[traders[i]]) {
//             _shiftLeft(k, i);
//             traders[i] = trader;
//             return;
//           }
//         }
//       }
//     }
//   }

//   function _findTrader(address trader) internal view returns (uint256) {
//     for (uint256 i=0; i<traders.length; i++) {
//       if (trader == traders[i]) {
//         return i;
//       }
//     }
//   }

//   /**
//    @notice 
//    */
//   function _shiftRight(uint256 pos, uint256 end) internal {
//     for (uint256 i=end; i>pos; i--) {
//       traders[i] = traders[i-1];
//     }
//   }

//   function _shiftLeft(uint256 pos, uint256 end) internal {
//     for (uint256 i=pos; i<end; i++) {
//       traders[i] = traders[i+1];
//     }
//   }
// }