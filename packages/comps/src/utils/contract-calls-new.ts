import { BigNumber as BN } from "bignumber.js";
import {
    CoreMarketInfo, VaultInfos, CoreMarketInfos, InstrumentInfos, VaultInfo, CoreInstrumentData,
    CoreUserState, VaultBalances, ZCBBalances
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
import ERC20ABI from "../data/ERC20.json";
import { BigNumber } from "ethers";
import { getProviderOrSigner } from "../components/ConnectAccount/utils";

import { Contract } from "@ethersproject/contracts";
import {TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { isDataTooOld } from "./date-utils";
import VaultABI from "../data/vault.json";


type NumStrBigNumber = number | BN | string;

function toDisplay(n: NumStrBigNumber, p: NumStrBigNumber = 18, d: number=4) {
    return new BN(n).dividedBy(new BN(10).pow(new BN(p))).decimalPlaces(d).toString();
}

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
        // console.log("i: ", i);
        // console.log("vaultBundle", vaultBundle);
        // console.log("marketBundle", marketBundle);
        // console.log("instrumentBundle", instrumentBundle);
        // console.log("timestamp", timestamp);
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
                default_params[key] = toDisplay(value.toString());
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
            r: toDisplay(vaultBundle.r.toString()),
            asset_limit: toDisplay(vaultBundle.asset_limit.toString()),
            total_asset_limit: toDisplay(vaultBundle.total_asset_limit.toString()),
            totalShares: toDisplay(vaultBundle.totalShares.toString()),
            name: vaultBundle.name
        });

        for (let j = 0; j < marketBundle.length; j++) {
            // add market
            let m = marketBundle[j];
            let parameters = {} as any;
            for (const [key, value] of Object.entries(m.parameters)) {
                if (!isNumeric(key)) {
                    parameters[key] = toDisplay(value.toString());
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
                    approved_principal: toDisplay(m.approved_principal.toString()),
                    approved_yield: toDisplay(m.approved_yield.toString()),
                    longZCBprice: toDisplay(m.longZCBprice.toString()),
                    longZCBsupply: toDisplay(m.longZCBsupply.toString()),
                    redemptionPrice: toDisplay(m.redemptionPrice.toString()),
                    totalCollateral: toDisplay(m.totalCollateral.toString()),
                }
            );

            let instr = instrumentBundle[j];
            let poolData = {} as any;
            for (const [key, value] of Object.entries(instr.poolData)) {
                if (!isNumeric(key)) {
                    poolData[key] = value.toString();
                    if (key !== "inceptionTime") {
                        poolData[key] = toDisplay(poolData[key]);
                    }
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
                    balance: toDisplay(instr.balance.toString()),
                    faceValue: toDisplay(instr.faceValue.toString()),
                    principal: toDisplay(instr.principal.toString()),
                    expectedYield: toDisplay(instr.expectedYield.toString()),
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

export const getRammData = async (
    account: string, 
    provider: Web3Provider,
    vaults: VaultInfos,
    markets: CoreMarketInfos,
    blocknumber: number
): Promise<CoreUserState> => {
    // get reputation score
    // console.log("account", account);
    // console.log("provider", provider);
    // console.log("vaults", vaults);
    const controller = new Contract(controller_address, ControllerABI.abi, provider);
    
    const reputationScore = toDisplay((await controller.trader_scores(account)).toString());
    // console.log("reputationScore", reputationScore);

    // get vault balances
    let vaultBalances: VaultBalances = {};
    for (const [key, value] of Object.entries(vaults)) {
        const vault = new Contract(value.address, VaultABI.abi, getProviderOrSigner(provider, account));
        const balance = await vault.balanceOf(account);
        const base = new Contract(value.want.address, ERC20ABI.abi, getProviderOrSigner(provider, account));
        const baseBalance = await base.balanceOf(account);
        Object.assign(vaultBalances, {
            [key]: {
                shares: toDisplay(balance.toString()),
                base: toDisplay(baseBalance.toString(), value.want.decimals)
            }
        })
    }

    // get zcb balances
    let zcbBalances: ZCBBalances = {};
    for (const [key, market] of Object.entries(markets as CoreMarketInfos)) {
        const { longZCB, shortZCB } = market;
        const longZCBContract = new Contract(longZCB, ERC20ABI.abi, getProviderOrSigner(provider, account));
        const shortZCBContract = new Contract(shortZCB, ERC20ABI.abi, getProviderOrSigner(provider, account));
        const longZCBBalance = await longZCBContract.balanceOf(account);
        const shortZCBBalance = await shortZCBContract.balanceOf(account);

        Object.assign(zcbBalances, {
            [key]: {
                longZCB: toDisplay(longZCBBalance.toString()),
                shortZCB: toDisplay(shortZCBBalance.toString())
            }
        })
    };
    // console.log("reputationScore", reputationScore);
    // console.log("vaultBalances", vaultBalances);
    // console.log("zcbBalances", zcbBalances);
    
    return {
        reputationScore,
        vaultBalances,
        zcbBalances,
    }
}