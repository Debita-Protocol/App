import { BigNumber, BigNumberish } from "ethers";
import { Fetcher, Controller, MarketManager, VaultFactory} from "../../typechain-types";

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

export interface StaticSuperBundle {
    vault: StaticVaultBundle;
    markets: StaticMarketBundle[]
}

interface MarketPhaseData {
    duringAssessment: boolean;
    onlyReputable: boolean;
    resolved: boolean;
    min_rep_score: BigNumberish;
    alive: boolean;
    atLoss: boolean;
    base_budget: BigNumberish;
}

export interface DynamicVaultBundle {
    vaultId: BigNumberish;
    totalSupply:BigNumberish
}

export interface InstrumentData {
    trusted: boolean;
    balance: BigNumberish;
    faceValue: BigNumberish;
    marketId: BigNumberish;
    principal: BigNumberish;
    expectedYield: BigNumberish;
    duration: BigNumberish;
    description: string;
    Instrument_address: string;
    instrument_type: BigNumberish;
    maturityDate:BigNumberish;
}

export interface DynamicMarketBundle {
    marketId: BigNumberish;
    phase: MarketPhaseData;
    longZCB: BigNumberish;
    shortZCB: BigNumberish;
    instrument: InstrumentData;
    approved_principal: BigNumberish;
    approved_yield: BigNumberish;
}

export interface DynamicSuperBundle {
    vault: DynamicVaultBundle;
    markets: DynamicMarketBundle[];
}

const EmptySuperBundle: StaticSuperBundle = {
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
): Promise<{bundles: StaticSuperBundle[], timestamp: BigNumberish | null}> { // timestamp is the timestamp of the final contract call.
    const vaultCount = await vaultFactory.numVaults();

    console.log("vaultCount: ", vaultCount);

    if (vaultCount.isZero()) {
        return {
            bundles: [],
            timestamp: null
        }
    }

    let bundles: StaticSuperBundle[] = [];
    let timestamp: BigNumberish | null = null;

    for (let i = 1; i < vaultCount.toNumber() + 1; i ++ ) {
        console.log("calling fetchInitial")
        let sub_bundle: StaticSuperBundle;
        
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

export async function fetchDynamicData(
    fetcher: Fetcher,
    controller: Controller,
    vaultFactory: VaultFactory,
    marketManager: MarketManager
): Promise<{bundles: DynamicSuperBundle[], timestamp: BigNumberish | null}> { // timestamp is the timestamp of the final contract call.
    const vaultCount = await vaultFactory.numVaults();

    console.log("vaultCount: ", vaultCount);

    if (vaultCount.isZero()) {
        return {
            bundles: [],
            timestamp: null
        }
    }

    let bundles: DynamicSuperBundle[] = [];
    let timestamp: BigNumberish | null = null;

    for (let i = 1; i < vaultCount.toNumber() + 1; i ++ ) {
        console.log("calling fetchInitial")
        
        const [rawVaultBundle, rawMarketBundles, _timestamp] = await fetcher.fetchDynamic(controller.address, marketManager.address, i, 0); // offset is zero, retrieving all markets
        
        bundles.push({vault: rawVaultBundle, markets: rawMarketBundles});

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