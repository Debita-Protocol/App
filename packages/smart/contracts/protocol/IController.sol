pragma solidity ^0.8.4;
import {Vault} from "../vaults/vault.sol";

interface IController  {
    function verifyAddress(
        uint256 nullifier_hash, 
        uint256 external_nullifier,
        uint256[8] calldata proof
    ) external;

    function mintRepNFT(
        address NFT_address,
        address trader
    ) external;

    function addValidator(
        address validator_address
    ) external;

    function initiateMarket(
        address recipient,
        Vault.InstrumentData memory instrumentData // marketId should be set to zero, no way of knowing.
    ) external;

    function resolveMarket(
        uint256 marketId,
        bool atLoss,
        uint256 extra_gain,
        uint256 principal_loss
    ) external;

    function approveMarket(
      uint256 marketId
    ) external;

    function denyMarket(
        uint256 marketId
    ) external;

    function getZCB(
        uint256 marketId
    ) external view;
}