import { BigNumber as BN } from "bignumber.js";
import {
    CoreMarketInfo, VaultInfos, CoreMarketInfos, InstrumentInfos, VaultInfo, CoreInstrumentData,
    CoreUserState, VaultBalances, ZCBBalances
} from "../types";

import {
    controller_address,
    market_manager_address,
    vault_factory_address,
    fetcher_address,
    reputation_manager_address,
    pool_factory_address,
    usdc,
    creditLine_address
} from "../data/constants";
import ReputationManagerData from "../data/ReputationManager.json";
import ControllerData from "../data/controller.json";
import MarketManagerData from "../data/marketmanager.json";
import VaultFactoryData from "../data/VaultFactory.json";
import FetcherData from "../data/Fetcher.json";
import ERC20Data from "../data/ERC20.json";
import CreditlineData from "../data/CreditLine.json";
import { BigNumber, Transaction, constants, utils } from "ethers";
import { getProviderOrSigner, getSigner } from "../components/ConnectAccount/utils";

import { Contract, ContractFactory } from "@ethersproject/contracts";
import {TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { isDataTooOld } from "./date-utils";
import VaultData from "../data/vault.json";
import { EthersFastSubmitWallet } from "@augurproject/smart";

type NumStrBigNumber = number | BN | string;

// from wad to display string
function toDisplay(n: NumStrBigNumber, p: NumStrBigNumber = 18, d: number=4) {
    return new BN(n).dividedBy(new BN(10).pow(new BN(p))).decimalPlaces(d).toString();
}
const pp = BigNumber.from(10).pow(18);
export const ContractSetup = async (account: string, provider: Web3Provider) => {
    console.log("ContractSetup");
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    const marketManager = new Contract(market_manager_address, MarketManagerData.abi, signer);
    const vaultFactory = new Contract(vault_factory_address, VaultFactoryData.abi, signer);
    const fetcher = new Contract(fetcher_address, FetcherData.abi, signer);
    const reputationManager = new Contract(reputation_manager_address, ReputationManagerData.abi, signer);
    const cash = new Contract(usdc, ERC20Data.abi, signer);
    let tx;
    tx = await controller.initiateMarket(
        "0x26373F36f72B6e16F5A7860f957262677B9CB076",
        {
            name: utils.formatBytes32String("instrument 1"),
            isPool: false,
            trusted: false,
            balance: 0,
            faceValue: pp.add(pp.mul(5).div(100)),
            marketId: 0,
            principal: pp,
            expectedYield: pp.mul(5).div(100),
            duration: 100,
            description: "description",
            instrument_address: creditLine_address,
            instrument_type: 0,
            maturityDate: 0,
            poolData: {
                saleAmount: 0,
                initPrice: 0,
                promisedReturn: 0,
                inceptionTime: 0,
                inceptionPrice: 0,
                leverageFactor: 0,
                managementFee: 0,
            }
        },
        1
    )
    tx.wait();
    console.log("tx");
    // vault: PromiseOrValue<string>,
    // _borrower: PromiseOrValue<string>,
    // _principal: PromiseOrValue<BigNumberish>,
    // _notionalInterest: PromiseOrValue<BigNumberish>,
    // _duration: PromiseOrValue<BigNumberish>,
    // _faceValue: PromiseOrValue<BigNumberish>,
    // _collateral: PromiseOrValue<string>,
    // _oracle: PromiseOrValue<string>,
    // _collateral_balance: PromiseOrValue<BigNumberish>,
    // _collateral_type: PromiseOrValue<BigNumberish>,
    // console.log("initiateMarket");

    // tx = await reputationManager.incrementScore("0x6756506A5c263710E5CDb392140DF1f958835e38",pp);
    // tx.wait();
    // tx = await reputationManager.incrementScore("0xfcDD4744d386F705cc1Fa45643535d0d649D5da2", 10);
    // tx.wait();

    // console.log("validators: ", await reputationManager.getTraders());


    // tx = await controller.setMarketManager(marketManager.address);
    // await tx.wait();
    // console.log("B")
    // tx = await controller.setVaultFactory(vaultFactory.address);
    // await tx.wait();
    // console.log("C")
    // tx = await controller.setPoolFactory(pool_factory_address);
    // await tx.wait();
    // console.log("D")
    // tx = await controller.setReputationManager(reputation_manager_address);
    // await tx.wait();

    // console.log("E")
    

    // tx = await controller.createVault(
    //     cash.address,
    //     false,
    //     0,
    //     0,
    //     0,
    //     {
    //         N: 1,
    //         sigma: pp.mul(5).div(100),
    //         alpha: pp.mul(4).div(10),
    //         omega: pp.mul(2).div(10),
    //         delta: pp.mul(2).div(10),
    //         r:"0",
    //         s: pp.mul(2),
    //         steak: pp.div(4)
    //     }
    // );
    // await tx.wait(2);
    console.log("F");
}

export const getContractData = async (account: string, provider: Web3Provider): Promise<{
    vaults: VaultInfos, 
    markets: CoreMarketInfos, 
    instruments: InstrumentInfos,
    blocknumber: number
}> => {
    const blocknumber = await provider.getBlockNumber();
    const controller = new Contract(controller_address, ControllerData.abi, provider);
    const marketManager = new Contract(market_manager_address, MarketManagerData.abi, provider);
    const vaultFactory = new Contract(vault_factory_address, VaultFactoryData.abi, provider);
    const fetcher = new Contract(fetcher_address, FetcherData.abi, getProviderOrSigner(provider, account));

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
        
        let default_params = {
            N: vaultBundle.default_params.N.toString(),
            sigma: toDisplay(vaultBundle.default_params.sigma.toString()),
            alpha: toDisplay(vaultBundle.default_params.alpha.toString()),
            omega: toDisplay(vaultBundle.default_params.omega.toString()),
            delta: toDisplay(vaultBundle.default_params.delta.toString()),
            r: toDisplay(vaultBundle.default_params.r.toString()),
            s: toDisplay(vaultBundle.default_params.s.toString()),
            steak: toDisplay(vaultBundle.default_params.steak.toString()),
        };

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
            name: vaultBundle.name,
            exchangeRate: toDisplay(vaultBundle.exchangeRate.toString()),
            utilizationRate: toDisplay(vaultBundle.utilizationRate.toString()),
            totalAssets: toDisplay(vaultBundle.totalAssets.toString()),
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

            let validatorData = {
                validators: m.validatorData.validators,
                val_cap: toDisplay(m.validatorData.val_cap.toString()),
                avg_price: toDisplay(m.validatorData.avg_price.toString()),
                totalSales: toDisplay(m.validatorData.totalSales.toString()),
                totalStaked: toDisplay(m.validatorData.totalStaked.toString()),
                numApproved: m.validatorData.numApproved.toString(),
                initialStake: toDisplay(m.validatorData.initialStake.toString()),
                finalStake: toDisplay(m.validatorData.finalStake.toString()),
                numResolved: m.validatorData.numResolved.toString(),
            }

            let market: CoreMarketInfo = Object.assign(
                {},
                {
                    name: m.name,
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
                    validatorData
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
                    poolData,
                    name: instr.name,
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
    const controller = new Contract(controller_address, ControllerData.abi, provider);
    
    const reputationScore = toDisplay((await controller.trader_scores(account)).toString());
    // console.log("reputationScore", reputationScore);

    // get vault balances
    let vaultBalances: VaultBalances = {};
    for (const [key, value] of Object.entries(vaults)) {
        const vault = new Contract(value.address, VaultData.abi, getProviderOrSigner(provider, account));
        const balance = await vault.balanceOf(account);
        const base = new Contract(value.want.address, ERC20Data.abi, getProviderOrSigner(provider, account));
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
        const longZCBContract = new Contract(longZCB, ERC20Data.abi, getProviderOrSigner(provider, account));
        const shortZCBContract = new Contract(shortZCB, ERC20Data.abi, getProviderOrSigner(provider, account));
        const longZCBBalance = await longZCBContract.balanceOf(account);
        const shortZCBBalance = await shortZCBContract.balanceOf(account);

        Object.assign(zcbBalances, {
            [key]: {
                longZCB: toDisplay(longZCBBalance.toString()),
                shortZCB: toDisplay(shortZCBBalance.toString())
            }
        })
    };
    
    return {
        reputationScore,
        vaultBalances,
        zcbBalances,
    }
}

// called to create the instrument.
export const createCreditLineInstrument = async (
    account: string, 
    provider: Web3Provider  
): Promise<string> => {
    const creditlineFactory = new ContractFactory(CreditlineData.abi, CreditlineData.bytecode, getSigner(provider, account));
    const creditline = await creditlineFactory.deploy();
    await creditline.deployed();
    const { address: instrument_address} = creditline;
    return instrument_address;
}

// must verify that account is owner of instrument_address?
// assume direct input from user, so will process data accordingly.
export const createCreditlineMarket = async (
    account: string,
    provider: Web3Provider,
    name: string,
    want_address: string,
    instrument_address: string, 
    vaultId: string,
    principal: string, // user input, capped at however many decimals places of the underlying.
    expectedYield: string,
    description: string,
    duration: string
): Promise<TransactionResponse>  => {
    const want = new Contract(want_address, ERC20Data.abi, getProviderOrSigner(provider, account));
    const controller = new Contract(controller_address, ControllerData.abi, getSigner(provider, account));
    
    const dec = await want.decimals();

    const faceValue = new BN(principal).plus(new BN(expectedYield)).toString();

    principal =  new BN(principal).decimalPlaces(dec).toString();
    expectedYield = new BN(expectedYield).decimalPlaces(dec).toString();
    
    const tx: TransactionResponse = await controller.initiateMarket(
        account,
        {
            name,
            isPool: false,
            trusted: false,
            balance: 0,
            faceValue,
            principal,
            expectedYield,
            duration,
            description,
            instrument_address,
            instrument_type: 0,
            maturityDate: 0,
            vaultId,
            marketId: 0,
        }
    );

    return tx;
}