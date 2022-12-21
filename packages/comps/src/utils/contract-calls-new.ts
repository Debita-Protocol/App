import { BigNumber as BN } from "bignumber.js";
import {
    CoreMarketInfo, VaultInfos, CoreMarketInfos, InstrumentInfos, VaultInfo, CoreInstrumentData
} from "../types";

import {
    controller_address,
    market_manager_address,
    vault_factory_address,
    fetcher_address
} from "../data/constants";
import ControllerABI from "../data/controller.json";
import MarketManagerABI from "../data/marketmanager.json";
import VaultFactoryABI from "../data/VaultFactory.json";
import FetcherABI from "../data/Fetcher.json";
import { BigNumber } from "ethers";
import { getProviderOrSigner } from "../components/ConnectAccount/utils";

import { Contract } from "@ethersproject/contracts";
import {TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { isDataTooOld } from "./date-utils";

export const getContractData = async (account: string, provider: Web3Provider): Promise<{
    vaults: VaultInfos, 
    markets: CoreMarketInfos, 
    instruments: InstrumentInfos,
    blocknumber: number
}> => {
    const blocknumber = await provider.getBlockNumber();
    const controller = new Contract(controller_address, ControllerABI.abi, provider);
    const marketManager = new Contract(market_manager_address, MarketManagerABI.abi, provider);
    const vaultFactory = new Contract(vault_factory_address, VaultFactoryABI.abi, provider);
    const fetcher = new Contract(fetcher_address, FetcherABI.abi, getProviderOrSigner(provider, account));

    const numVaults = await vaultFactory.numVaults();
    console.log("numVaults: ", numVaults.toNumber());
    let vaults: VaultInfos = {};
    let markets: CoreMarketInfos = {};
    let instruments: InstrumentInfos = {};

    for (let i = 1; i < numVaults.toNumber()+1; i++) {
        const { vaultBundle, marketBundle, instrumentBundle, timestamp } = await fetcher.fetchInitial(
            controller_address, 
            market_manager_address,
            i
        );
        console.log("i: ", i);
        console.log("vaultBundle", vaultBundle);
        console.log("marketBundle", marketBundle);
        console.log("instrumentBundle", instrumentBundle);
        console.log("timestamp", timestamp);
        if (isDataTooOld(timestamp.toNumber())) {
            console.error(
              "node returned data too old",
              "timestamp",
              new Date(timestamp.toNumber() * 1000).toString(),
              provider.connection.url
            );
            throw new Error("contract data too old");
          }
        
        let default_params = {} as any;
        for (const [key, value] of Object.entries(vaultBundle.default_params)) {
            if (!isNumeric(key)) {
                default_params[key] = value.toString();
            }
            
        }

        //let want = structuredClone(vaultBundle.want);
        let want = {} as any;
        want.address = vaultBundle.want.addr;
        want.symbol = vaultBundle.want.symbol;
        want.decimals = vaultBundle.want.decimals.toNumber();
        want.name = vaultBundle.want.name;
        want.asset = "";
        want.displayDecimals = 6;

        // add vault
        let vault: VaultInfo = Object.assign ({}, {
            address: vaultBundle.vault_address,
            vaultId: vaultBundle.vaultId.toString(),
            marketIds: vaultBundle.marketIds.map((id: BigNumber) => id.toString()),
            onlyVerified: vaultBundle.onlyVerified,
            want: want,
            default_params: default_params,
            r: vaultBundle.r.toString(),
            asset_limit: vaultBundle.asset_limit.toString(),
            total_asset_limit: vaultBundle.total_asset_limit.toString(),
            totalShares: vaultBundle.totalShares.toString(),
            name: vaultBundle.name
        });

        for (let j = 0; j < marketBundle.length; j++) {
            // add market
            let m = marketBundle[j];
            let parameters = {} as any;
            for (const [key, value] of Object.entries(m.parameters)) {
                if (!isNumeric(key)) {
                    parameters[key] = value.toString();
                }
            }

            let market: CoreMarketInfo = Object.assign(
                {},
                {
                    bondPool: m.bondPool,
                    marketId: m.marketId.toString(),
                    vaultId: m.vaultId.toString(),
                    creationTimestamp: m.creationTimestamp.toString(),
                    parameters,
                    phase: m.phase,
                    longZCB: m.longZCB,
                    shortZCB: m.shortZCB,
                    approved_principal: m.approved_principal.toString(),
                    approved_yield: m.approved_yield.toString(),
                    longZCBprice: m.longZCBprice.toString(),
                    longZCBsupply: m.longZCBsupply.toString(),
                    redemptionPrice: m.redemptionPrice.toString(),
                    totalCollateral: m.totalCollateral.toString(),
                }
            );

            let instr = instrumentBundle[j];
            let poolData = {} as any;
            for (const [key, value] of Object.entries(instr.poolData)) {
                if (!isNumeric(key)) {
                    poolData[key] = value.toString();
                }
            }

            let instrument: CoreInstrumentData = Object.assign(
                {},
                {
                    marketId: instr.marketId.toString(),
                    vaultId: instr.vaultId.toString(),
                    utilizer: instr.utilizer,
                    trusted: instr.trusted,
                    isPool: instr.isPool,
                    balance: instr.balance.toString(),
                    faceValue: instr.faceValue.toString(),
                    principal: instr.principal.toString(),
                    expectedYield: instr.expectedYield.toString(),
                    duration: instr.duration.toString(),
                    description: instr.description,
                    address: instr.instrument_address,
                    type: instr.instrument_type,
                    maturityDate: instr.maturityDate.toString(),
                    poolData
                }
            );

            markets[market.marketId] = market;
            instruments[instrument.marketId] = instrument;
        }
        
        vaults[vault.vaultId] = vault;
    }
    // can filter markets here, if dead markets for example.

    return { vaults, markets, instruments, blocknumber };
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !Number.isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !Number.isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }