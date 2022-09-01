// pragma solidity ^0.8.4;

// import {Controller} from "./controller.sol";
// import {MarketManager} from "./marketmanager.sol";
// import {Vault} from "../vaults/vault.sol";

// contract SuperFactory {

//     address public constant interep = address(0);
//     address public constant repToken = address(0);
    
//     struct mintRules {
//         uint256 min_rep_score;
//         bool verified;
//     }

//     struct VaultData {
//         address marketManager;
//         address controller;
//         address asset;
//         address vault;
//         mintRules restrictions;
//     }

//     mapping(uint256 => VaultData) vaults;
//     uint256 private nonce = 1;

//     event VaultCreated(uint256 indexed id, VaultData data);

//     /**
//      TODO should be onlyVerified
//      */
//     function createVault(address asset, mintRules calldata _restrictions) external {
//         Controller _controller = new Controller(address(this), interep);
//         MarketManager _marketManager = new MarketManager(address(this), repToken, address(_controller));
//         Vault _vault = new Vault(asset, address(_controller));

//         vaults[nonce] = VaultData(
//             address(_marketManager),
//             address(_controller),
//             asset,
//             address(_vault),
//             _restrictions
//         );

//         emit VaultCreated(nonce, vaults[nonce]);

//         nonce++;
//     }
// }