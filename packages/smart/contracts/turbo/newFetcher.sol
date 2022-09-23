// pragma solidity ^0.8.4;

// abstract contract Fetcher {
//     struct CollateralBundle {
//         address addr;
//         string symbol;
//         uint256 decimals;
//     }

//     struct VaultBundle {
        
//     }

//     struct StaticMarketBundle {
//         uint256 marketId;
//         uint256 creationTimestamp;
//         InstrumentBundle instrument;
//     }

//     struct DynamicMarketBundle {

//     }

//     struct StaticInstrumentBundle {

//     }

//     struct DynamicInstrumentBundle {

//     }


//     string public marketType;
//     string public version;

//     constructor(string memory _type, string memory _version) {
//         marketType = _type;
//         version = _version;
//     }

//     function buildCollateralBundle(IERC20Full _collateral) internal view returns (CollateralBundle memory _bundle) {
//         _bundle.addr = address(_collateral);
//         _bundle.symbol = _collateral.symbol();
//         _bundle.decimals = _collateral.decimals();
//     }
// }