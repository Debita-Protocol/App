import { BigNumber, BigNumberish } from "ethers";
import { Fetcher, Controller, MarketManager, VaultFactory} from "../../typechain";

export interface MarketParameters {
    N: BigNumberish;
    sigma: BigNumberish;
    omega: BigNumberish;
    delta: BigNumberish;
    r: BigNumberish;
    s: BigNumberish;
}

export interface CollateralBundle {
    addr: string;
    symbol: string;
    decimals: BigNumberish
}

export interface StaticVaultBundle {
    vaultId: BigNumberish;
    marketIds: BigNumberish[];
    onlyVerified: boolean;
    default_params: MarketParameters;
    r: BigNumberish;
    asset_limit: BigNumberish;
    total_asset_limit: BigNumberish;
    collateral: CollateralBundle;
}

export interface StaticMarketBundle {
    marketId: BigNumberish;
    creationTimestamp: BigNumberish;
    long: string;
    short: string;
    parameters: MarketParameters;
}

export interface SuperBundle {
    vault: StaticVaultBundle;
    markets: StaticMarketBundle[]
}

const EmptySuperBundle: SuperBundle = {
    vault: {
        vaultId: 0,
        marketIds: [],
        onlyVerified: false,
        default_params: {
            N: 0,
            sigma: 0,
            omega: 0,
            delta: 0,
            r: 0,
            s: 0
        },
        r: 0,
        asset_limit: 0,
        total_asset_limit: 0,
        collateral: {
            addr: "",
            symbol: "",
            decimals: 0
        }
    },
    markets: [],

}

export async function fetchInitialData(
    fetcher: Fetcher,
    controller: Controller,
    vaultFactory: VaultFactory,
    marketManager: MarketManager
): Promise<{bundles: SuperBundle[], timestamp: BigNumberish | null}> { // timestamp is the timestamp of the final contract call.
    const vaultCount = await vaultFactory.numVaults();

    console.log("vaultCount: ", vaultCount);

    if (vaultCount.isZero()) {
        return {
            bundles: [],
            timestamp: null
        }
    }

    let bundles: SuperBundle[] = [];
    let timestamp: BigNumberish | null = null;

    for (let i = 1; i < vaultCount.toNumber() + 1; i ++ ) {
        console.log("calling fetchInitial")
        let sub_bundle: SuperBundle;
        
        const [rawVaultBundle, rawMarketBundles, _timestamp] = await fetcher.fetchInitial(controller.address, marketManager.address, i, 0); // offset is zero, retrieving all markets

        console.log("rawVaultBundle: ", rawVaultBundle);
        console.log("rawMarketBundles: ", rawMarketBundles);
        console.log("timestamp: ", _timestamp);
        sub_bundle = createSuperBundle(rawVaultBundle, rawMarketBundles);
        console.log("sub bundle: ", sub_bundle);
        
        bundles.push(sub_bundle);

        if (i == vaultCount.toNumber()) {
            timestamp = _timestamp;
        }
    }

    return {
        bundles,
        timestamp
    };
}

const createSuperBundle = (vaultBundle: StaticVaultBundle, marketBundles: StaticMarketBundle[]) => {
    return {
        vault: vaultBundle,
        markets: marketBundles
    }
}