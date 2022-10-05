pragma solidity ^0.8.4;

import {MarketManager} from "../protocol/marketmanager.sol";
import {Vault} from "../vaults/vault.sol";
import {VaultFactory} from "../protocol/factories.sol";
import {Controller} from "../protocol/controller.sol";
import {ERC20} from "../vaults/tokens/ERC20.sol";

contract Fetcher {
    /**
        static => only called on creation of vault or market.
        dynamic => called continuously.
     */
    struct CollateralBundle {
        address addr;
        string symbol;
        uint256 decimals;
    }

    struct StaticVaultBundle {
        uint256 vaultId;
        uint256[] marketIds;
        MarketManager.MarketParameters default_params;
        bool onlyVerified; 
        uint256 r; //reputation ranking  
        uint256 asset_limit; 
        uint256 total_asset_limit;
        CollateralBundle collateral;
    }

    struct StaticMarketBundle {
        uint256 marketId;
        uint256 creationTimestamp;
        address long;
        address short;
        MarketManager.MarketParameters parameters;
    }

    struct DynamicVaultBundle {
        uint256 vaultId;
        uint256 totalSupply;
    }

    struct DynamicMarketBundle {
        uint256 marketId;
        MarketManager.MarketPhaseData phase;
        uint256 longZCB; //net longs
        uint256 shortZCB; // shorts bought
        Vault.InstrumentData instrument;
        uint256 approved_principal;
        uint256 approved_yield;
    }

    string public marketType;
    string public version;

    constructor(string memory _type, string memory _version) {
        marketType = _type;
        version = _version;
    }

    function buildCollateralBundle(ERC20 _collateral) internal view returns (CollateralBundle memory _bundle) {
        _bundle.addr = address(_collateral);
        _bundle.symbol = _collateral.symbol();
        _bundle.decimals = _collateral.decimals();
    }

    /**
     @dev vaultId retrieved from vaultIds public array in controller.
     @notice retrieves all the static data associated with a vaultId.
     */
    function fetchInitial(
        Controller _controller,
        MarketManager _marketManager,
        uint256 _vaultId,
        uint256 _offset // how many markets to skip from the top.
    ) 
    public 
    view 
    returns (
        StaticVaultBundle memory,
        StaticMarketBundle[] memory,
        uint256
    )
    {
        StaticVaultBundle memory _vaultBundle;
        StaticMarketBundle[] memory _staticMarketBundle;
        uint256 _timestamp = block.timestamp;

        // vault bundle
        _vaultBundle.marketIds = _controller.getMarketIds(_vaultId);

        Vault _vault = _controller.vaults(_vaultId);

        if (address(_vault) == address(0)) {
            return (makeEmptyStaticVaultBundle(), new StaticMarketBundle[](0), _timestamp);
        }

        _vaultBundle.collateral = buildCollateralBundle(_vault.asset());

        _vaultBundle.default_params = _vault.get_vault_params();

        _vaultBundle.onlyVerified = _vault.onlyVerified();
        _vaultBundle.r = _vault.r();
        _vaultBundle.asset_limit = _vault.asset_limit();
        _vaultBundle.total_asset_limit = _vault.total_asset_limit();
        _vaultBundle.vaultId = _vaultId;

        if (_vaultBundle.marketIds.length == 0) {
            return (_vaultBundle, new StaticMarketBundle[](0), _timestamp);
        }

        // market bundles
        (uint256[] memory _marketIds) = listOfInterestingMarkets(_vaultId, _controller, _marketManager, _offset);
        uint256 total = _marketIds.length;

        _staticMarketBundle = new StaticMarketBundle[](total);

        for (uint256 i = 0; i < total; i++) {
            _staticMarketBundle[i] = buildStaticMarketBundle(_marketIds[i], _marketManager);
        }

        return (_vaultBundle, _staticMarketBundle, _timestamp);
    }

    function makeEmptyStaticVaultBundle() pure internal returns (StaticVaultBundle memory) {
        return StaticVaultBundle(
            0,
            new uint256[](0),
            MarketManager.MarketParameters(0,0,0,0,0,0,0),
            false,
            0,
            0,
            0,
            CollateralBundle(address(0), "", 0)
        );
    }

    function buildStaticMarketBundle(
        uint256 _marketId,
        MarketManager _marketManager
    ) internal view returns (StaticMarketBundle memory bundle) {
        MarketManager.CoreMarketData memory m_data = _marketManager.getMarket(_marketId);
        bundle.creationTimestamp = m_data.creationTimestamp;
        bundle.long = address(m_data.long);
        bundle.short = address(m_data.short);
        bundle.parameters = _marketManager.getParameters(_marketId);
        bundle.marketId = _marketId;
    }

    /**
     @param _offset: number of markets to skip from the top of the list of marketIds.
     */
    function listOfInterestingMarkets(
        uint256 _vaultId, 
        Controller _controller, 
        MarketManager _marketManager,
        uint256 _offset
    ) internal view returns (uint256[] memory _interestingMarkets) {
        uint256[] memory markets = _controller.getMarketIds(_vaultId);
        uint256 _total = markets.length;
        
        if (_offset >= _total || _total == 0) {
            return (new uint256[](0));
        }

        uint256 collectedMarkets = 0;
        uint256[] memory tmp = new uint256[](_total);

        for (uint256 i = (_total - _offset - 1);;) {
            if (collectedMarkets >= _total) {
                break;
            }
            
            if (isUnresolvedMarket(markets[i], _marketManager)) {
                tmp[collectedMarkets] = markets[i];      
                collectedMarkets++;
            }

            if (i == 0) {
                break;
            }
            i--;
        }

        _interestingMarkets = new uint256[](collectedMarkets);
        for (uint256 i=0; i<collectedMarkets; i++) {
            _interestingMarkets[i] = tmp[i];
        }
    }

    function isUnresolvedMarket(uint256 marketId, MarketManager _marketManager) public view returns (bool) {
        return true; // TODO
    }

    function fetchDynamic(
        Controller _controller,
        MarketManager _marketManager,
        uint256 _vaultId,
        uint256 _offset
    ) public view returns (
        DynamicVaultBundle memory,
        DynamicMarketBundle[] memory,
        uint256
    ) {
        DynamicVaultBundle memory _vaultBundle;
        DynamicMarketBundle[] memory _dynamicMarketBundles;
        uint256 _timestamp = block.timestamp;
        
        _vaultBundle.vaultId = _vaultId;
        if (address(_controller.vaults(_vaultId)) == address(0)) {
            return (makeEmptyDynamicVaultBundle(), new DynamicMarketBundle[](0), _timestamp);
        }
        _vaultBundle.totalSupply = _controller.vaults(_vaultId).totalSupply();

        if (_controller.getMarketIds(_vaultId).length == 0) {
            return (_vaultBundle, new DynamicMarketBundle[](0), _timestamp);
        }
        
        uint256[] memory _marketIds = listOfInterestingMarkets(_vaultId, _controller, _marketManager, _offset);
        uint256 total = _marketIds.length;
        _dynamicMarketBundles = new DynamicMarketBundle[](total);
        
        for (uint256 i = 0; i < total; i++) {
            _dynamicMarketBundles[i] = buildDynamicMarketBundle(_marketIds[i], _vaultId, _controller, _marketManager);
        }
        return (_vaultBundle, _dynamicMarketBundles, _timestamp);
    }

    function makeEmptyDynamicVaultBundle() internal pure returns (DynamicVaultBundle memory) {
        return DynamicVaultBundle(0,0);
    }

    function buildDynamicMarketBundle(
        uint256 _marketId,
        uint256 _vaultId,
        Controller _controller,
        MarketManager _marketManager
    ) internal view returns (DynamicMarketBundle memory bundle) {
        Vault _vault = _controller.vaults(_vaultId);
        bundle.marketId = _marketId;
        bundle.phase = _marketManager.getPhaseData(_marketId);
        bundle.longZCB = _marketManager.getZCB(_marketId).totalSupply();
        bundle.shortZCB = _marketManager.getShortZCB(_marketId).totalSupply();
        bundle.instrument = _vault.getInstrumentData(_vault.Instruments(_marketId));
        Controller.ApprovalData memory approvalData = _controller.getApprovalData(_marketId);
        bundle.approved_principal = approvalData.approved_principal;
        bundle.approved_yield = approvalData.approved_yield;
    }
}