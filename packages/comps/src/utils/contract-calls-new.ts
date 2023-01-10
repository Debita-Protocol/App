import { BigNumber as BN } from "bignumber.js";
import {
    CoreMarketInfo, VaultInfos, CoreMarketInfos, InstrumentInfos, VaultInfo, CoreInstrumentData,
    CoreUserState, VaultBalances, ZCBBalances, Instrument, UserPoolInfos, Collateral, UserPoolInfo
} from "../types";
import {useMemo} from "react";
import {
    controller_address,
    market_manager_address,
    vault_factory_address,
    fetcher_address,
    reputation_manager_address,
    pool_factory_address,
    cash_address,
    creditLine_address,
    variable_interest_rate_address,
    validator_manager_address
} from "../data/constants";
import ReputationManagerData from "../data/ReputationManager.json";
import ControllerData from "../data/controller.json";
import MarketManagerData from "../data/marketmanager.json";
import VaultFactoryData from "../data/VaultFactory.json";
import FetcherData from "../data/Fetcher.json";
import ERC20Data from "../data/ERC20.json";
import ERC721Data from "../data/ERC721.json";
import CreditlineData from "../data/CreditLine.json";
import PoolInstrumentData from "../data/poolInstrument.json";
import VariableInterestRateData from "../data/VariableInterestRate.json";
import PRBTestData from "../data/PRBTest.json";
import VaultData from "../data/vault.json";
import CashData from "../data/cash.json";
import TestNFTData from "../data/TestNFT.json";
import SyntheticZCBPoolData from "../data/SyntheticZCBPool.json";


import { BigNumber, Transaction, constants, utils } from "ethers";
import { getProviderOrSigner, getSigner } from "../components/ConnectAccount/utils";

import { Contract, ContractFactory } from "@ethersproject/contracts";
import {TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { isDataTooOld } from "./date-utils";
import { EthersFastSubmitWallet } from "@augurproject/smart";
import { useActiveWeb3React } from "../components/ConnectAccount/hooks";
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { ContractCallContext, ContractCallResults, ContractCallReturnContext, Multicall } from "@augurproject/ethereum-multicall";
import { rammClient } from "../apollo-ramm/client";
import { GET_VAULTS, GET_INSTRUMENTS, GET_MARKETS } from "../apollo-ramm/queries";

import _ from "lodash"


type NumStrBigNumber = number | BN | string;

// from wad to display string
function toDisplay(n: NumStrBigNumber, p: NumStrBigNumber = 18, d: number=4) {
    return new BN(n).dividedBy(new BN(10).pow(new BN(p))).decimalPlaces(d).toString();
}
const pp = BigNumber.from(10).pow(18);

export const fetchRammGraphData = async (provider: Web3Provider): Promise<{
    vaults: VaultInfos, 
    markets: CoreMarketInfos, 
    instruments: InstrumentInfos,
    blocknumber: number
}> => {
    const blocknumber = await provider.getBlockNumber();
    let vaults: VaultInfos = {};
    let markets: CoreMarketInfos = {};
    let instruments: InstrumentInfos = {};
    try {
        const vaultResponse = await rammClient.query({
            query: GET_VAULTS
        });
        console.log("vaultResponse", vaultResponse)
        _.forEach(vaultResponse.data.vaults, (vault) => {
            let marketIds = _.map(vault.marketIds, (market) => market.id);
            let _vault = _.assign(vault, {marketIds});
            vaults[vault.vaultId] = _vault;
        })

        const marketResponse = await rammClient.query({
            query: GET_MARKETS
        });
        console.log("marketResponse", marketResponse)
        _.forEach(marketResponse.data.markets, (market) => {
            let validators = _.map(market.validators, (validator) => validator.address);
            let parameters = {
                N: market.N,
                sigma: market.sigma,
                alpha: market.alpha,
                omega: market.omega,
                delta: market.delta,
                r: market.rMarket,
                s: market.s,
                steak: market.steak,
           }
           let _market = _.assign(market, {vaultId: market.vaultId.vaultId}, {validators, parameters});
           
            markets[market.marketId] = _market;
        })

        const instrumentResponse = await rammClient.query({
            query: GET_INSTRUMENTS
        });

        _.forEach(instrumentResponse.data.poolInstruments, (instrument) => {
            instruments[instrument.marketId.id] = _.assign(instrument, {
                vaultId: instrument.vaultId.vaultId,
                marketId: instrument.marketId.id,
                isPool: true
            })
        })
        _.forEach(instrumentResponse.data.generalInstruments, (instrument) => {
            instruments[instrument.marketId.id] = _.assign(instrument, {
                vaultId: instrument.vaultId.vaultId,
                marketId: instrument.marketId.id,
                isPool: false
            })
        })
        _.forEach(instrumentResponse.data.creditlineInstruments, (instrument) => {
            instruments[instrument.marketId.id] = _.assign(instrument, {
                vaultId: instrument.vaultId.vaultId,
                marketId: instrument.marketId.id,
                isPool: false
            })
        })

        return { vaults, markets, instruments, blocknumber}

    } catch(err) {
        console.log(err);
        return { vaults, markets, instruments, blocknumber}
    }
}

// pool instrument functions
export const createPoolMarket = async (
    account: string,
    provider: Web3Provider,
    vaultId: string,
    name: string,
    description: string,
    saleAmount: string,
    initPrice: string,
    promisedReturn: string,
    inceptionPrice: string,
    leverageFactor: string,
    instrumentAddress: string
): Promise<string> => {
    // get controller contract
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    // get market manager contract
    const marketManager = new Contract(market_manager_address, MarketManagerData.abi, signer);

    // create instrument data object that will be passed to the controller initiateMarket function
    const instrumentData = {
        name: formatBytes32String(name),
        isPool: true,
        trusted: false,
        balance: 0,
        faceValue: 0,
        marketId: 0,
        principal: 0,
        expectedYield: 0,
        duration: 0,
        description: description,
        instrument_address: instrumentAddress,
        instrument_type: 2,
        maturityDate: 0,
        poolData: {
            saleAmount: saleAmount,
            initPrice: initPrice,
            promisedReturn: promisedReturn,
            inceptionTime: 0,
            inceptionPrice: inceptionPrice,
            leverageFactor: leverageFactor,
            managementFee: 0,
        }
    }

    console.log("instrumentData: ", instrumentData);
    console.log("vaultId: ", vaultId);

    const tx = await controller.initiateMarket(
        account,
        instrumentData,
        vaultId
    );
    await tx.wait(1);
    const marketCount = await marketManager.marketCount();
    const marketId = new BN(marketCount.toString()).minus(1).toString();

    
    return marketId;
}

interface PoolCollateralItem {
    tokenAddress: string;
    tokenId: string;
    borrowAmount: string;
    maxAmount: string;
    isERC20: boolean;
}

export const createPoolInstrument = async (
    account: string, 
    provider: Web3Provider, 
    vault: string,
    asset: string,
    name: string,
    symbol: string,
    collateralInfos: PoolCollateralItem[]
): Promise<string> => {
    // console.log("poolInstrumentABI: ", PoolInstrumentData.abi);
    const poolInstrumentFactory = new ContractFactory(PoolInstrumentData.abi, PoolInstrumentData.bytecode, provider.getSigner(account));
    // console.log("vault: ", vault);
    // console.log("controller_address: ", controller_address);
    // console.log("account: ", account);
    // console.log("asset: ", asset);
    // console.log("name: ", name);
    // console.log("symbol: ", symbol);
    // console.log("variable_interest_rate_address: ", variable_interest_rate_address);

    let collateralLabels = [];
    let collateralDatas = [];
    _.forEach(collateralInfos, (collateralInfo) => {
        collateralLabels = _.concat(collateralLabels, {
            tokenAddress: collateralInfo.tokenAddress,
            tokenId: collateralInfo.isERC20 ? "0" : collateralInfo.tokenId
        });

        collateralDatas = _.concat(collateralDatas, {
            totalCollateral: 0,
            maxBorrowAmount: new BN(collateralInfo.borrowAmount).shiftedBy(18).toFixed(0),
            maxAmount: new BN(collateralInfo.maxAmount).shiftedBy(18).toFixed(0),
            isERC20: collateralInfo.isERC20,
        });
    })

    // console.log("collateral labels: ",collateralLabels)
    // console.log("collateral datas: ",collateralDatas)

    const poolInstrument = await poolInstrumentFactory.deploy(  
        vault,
        controller_address,
        account,
        asset,
        name,
        symbol,
        variable_interest_rate_address,
        [],
        collateralLabels,
        collateralDatas
    );
    await poolInstrument.deployed();
    console.log("poolInstrument deployed to:", poolInstrument.address);
    return poolInstrument.address;
}

// export const addAcceptedCollaterals = async (
//     account: string,
//     provider: Web3Provider,
//     marketId: string,
//     collateralItems: PoolCollateralItem[] // not in wad format yet
// ) => {
//     const signer = getSigner(provider, account);
//     const controller = new Contract(controller_address, ControllerData.abi, signer);
    
//     const multicall = new Multicall({ ethersProvider: provider });

//     // for each collateralInfo item, call controller.addAcceptedCollateral
//     collateralItems.forEach(async (collateralInfo) => {
//         const tx = await controller.addAcceptedCollateral(
//             marketId,
//             collateralInfo.tokenAddress,
//             collateralInfo.isERC20 ? "0" : collateralInfo.tokenId,
//             new BN(collateralInfo.maxAmount).shiftedBy(18).toFixed(0),
//             new BN(collateralInfo.borrowAmount).shiftedBy(18).toFixed(0),
//             collateralInfo.isERC20
//         )
//         await tx.wait(1);
//     });
// }

export const borrowCreditlineInstrument = async (
    account: string, 
    provider: Web3Provider, 
    instrument_address: string
) => {
    const signer = getSigner(provider, account);
    const creditline = new Contract(instrument_address, CreditlineData.abi, signer);
    const tx = await creditline.drawdown();
    return tx;
}


export const repayCreditlineInstrument = async (
    account: string,
    provider: Web3Provider,
    instrument_address: string,
    underlying_address: string,
    amount: string
) => {
    const signer = getSigner(provider, account);
    const approved = await useIsERC20ApprovedSpender(account, provider, underlying_address, instrument_address, amount);

    if (!approved) {
        await approveERC20(account, provider, underlying_address, amount, instrument_address);
    }

    const creditline = new Contract(instrument_address, CreditlineData.abi, signer);
    const tx = await creditline.repay(
        new BN(amount).shiftedBy(18).toFixed(0)
    );
    return tx;
}

/// CALL AS VALIDATOR
export const approveMarket = async (account: string, provider: Web3Provider, marketId: string) => {
    const signer = getSigner(provider, account);
    const marketManager = new Contract(market_manager_address, MarketManagerData.abi, signer);
    const controller = new Contract(controller_address, ControllerData.abi, signer);

    // get validator
    // const validators = await controller.viewValidators(marketId);
    // const validator = validators[0];

    const initialStake = (await controller.getInitialStake(marketId)).toString();
    const requiredCollateral = (await controller.getValidatorRequiredCollateral(marketId)).toString();


    // need to make sure the validator has enough funds to stake.
    const vault_id = (await controller.id_parent(marketId)).toString();
    const vault_address = await controller.vaults(vault_id);
    const vault = new Contract(vault_address, VaultData.abi, signer);
    const underlying = await vault.UNDERLYING(); 
    const assetToMint = (await vault.convertToAsset(initialStake)).toString();
    const cash = new Contract(underlying.toString(), ERC20Data.abi, signer);

    cash.faucet(assetToMint);
    cash.approve(vault.address, assetToMint);
    let tx = await vault.mint(initialStake);
    tx.wait();
    tx = await vault.approve(controller.address, initialStake);
    tx.wait();

    tx = await cash.approve(marketManager.address, requiredCollateral);
    tx.wait();

    tx = await controller.approveMarket(marketId);
    await tx.wait();
}

/// TEST FUNCTIONS
export const testApproveMarket = async (account: string, provider: Web3Provider, marketId: string) => {
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    let tx = await controller.testApproveMarket(marketId);
    await tx.wait();
    console.log("market approved");
}

export const testResolveMarket = async (account: string, provider: Web3Provider, marketId: string) => {
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    let tx = await controller.testResolveMarket(marketId);
    await tx.wait(1);
}

// assumes that market has no other invests + just created.
// any account
// vault underlying must be cash.
export const testFullApprove = async (account: string, provider: Web3Provider, marketId: string) => {
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    const vault_address = await controller.getVault(marketId);
    const marketManager = new Contract(market_manager_address, MarketManagerData.abi, signer);
    // get reputation manager and call testIncrementScore for the account
    const reputationManager = new Contract(reputation_manager_address, ReputationManagerData.abi, signer);
    let tx;
    // tx = await reputationManager.testIncrementScore(10);
    // await tx.wait(1);



    console.log("A");
    const vault = new Contract(vault_address, VaultData.abi, signer);
    const underlying = await vault.UNDERLYING();

    //get sale amount
    const { poolData } = (await vault.fetchInstrumentData(marketId));
    const bondPoolAddress = await marketManager.getPool(marketId);

    // create bond pool
    // const bondPool = new Contract(bondPoolAddress, SyntheticZCBPoolData.abi, signer);


    // console.log("longZCB: ",await marketManager.getZCB(marketId));

    // console.log("saleAmount: ", poolData.saleAmount);
    // mint sale amount of underlying to the account
    // const cash = new Contract(underlying, CashData.abi, signer);
    // const amount = new BN("10000").shiftedBy(18).toFixed();
    // console.log("amount: ", amount);
    // tx = await cash.faucet(amount);
    // await tx.wait(1);
    // console.log("C");

    // tx = await cash.approve(marketManager.address, amount);
    // await tx.wait(1);
    // console.log("D");
    // console.log("reputable: ", await controller.isReputable(account, "0"));

    // tx = await marketManager.callStatic.buyBond(marketId, new BN(saleAmount.toString()).negated().toFixed(), new BN(100).shiftedBy(18).toString(), []);
    // console.log("tx: ", tx);
    // tx.wait(1);

    console.log("market condition", await controller.marketCondition(marketId));

    await testApproveMarket(account, provider, marketId);
    console.log("E");

}

export const ContractSetup = async (account: string, provider: Web3Provider) => {
    console.log("ContractSetup");
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    const marketManager = new Contract(market_manager_address, MarketManagerData.abi, signer);
    const vaultFactory = new Contract(vault_factory_address, VaultFactoryData.abi, signer);
    const fetcher = new Contract(fetcher_address, FetcherData.abi, signer);
    const reputationManager = new Contract(reputation_manager_address, ReputationManagerData.abi, signer);
    const cash = new Contract(cash_address, ERC20Data.abi, signer);
    const cashFactory = new ContractFactory(CashData.abi, CashData.bytecode, provider.getSigner(account));
    const nftFactroy = new ContractFactory(TestNFTData.abi, TestNFTData.bytecode, provider.getSigner(account));
    let tx;

    // const poolInstrument = new Contract("0x433a61f5a4b35e9113c47fe3f897ef54b2ea8025", PoolInstrumentData.abi, signer);
    // console.log("poolInstrument: ", await poolInstrument.getAcceptedCollaterals());
    // let tx = await controller.testVerifyAddress();
    // await tx.wait(1);

    // await mintTestNFT(account, provider, "1", "0x8b8f72a08780CB4deA2179d049472d57eB3Fe9e6");
    // await mintTestNFT(account, provider, "2", "0x8b8f72a08780CB4deA2179d049472d57eB3Fe9e6");

    // const cash1 = await cashFactory.deploy(
    //     "Cash1",
    //     "CASH1",
    //     18
    // );
    // await cash1.deployed();
    // console.log("cash1 deployed to:", cash1.address);
    // const cash2 = await cashFactory.deploy(
    //     "Cash2",
    //     "CASH2",
    //     18
    // );
    // await cash2.deployed();
    // console.log("cash2 deployed to:", cash2.address);
    // const nft1 = await nftFactroy.deploy(
    //     "NFT1",
    //     "NFT1"
    // );
    // await nft1.deployed();
    // console.log("nft1 deployed to:", nft1.address);
    // const nft2 = await nftFactroy.deploy(
    //     "NFT2",
    //     "NFT2"
    // );
    // await nft2.deployed();
    // console.log("nft2 deployed to:", nft2.address);

    // const pool1 = new Contract("0x55e08cff64B0659E5bBd5645D24f591446316c2e", PoolInstrumentData.abi, signer);
    // console.log((await pool1.getAcceptedCollaterals()));
    // const vault1 = new Contract("0xEbd3bc7CD466c262Dfe4fFA7b4Fc25fC8719Beb2", VaultData.abi, signer)
    // console.log(await fetcher.fetchInitial(controller_address, market_manager_address, 1));
    // const variableInterestRateFactory = new ContractFactory(VariableInterestRateData.abi, VariableInterestRateData.bytecode, provider.getSigner(account));
    // const variableInterestRate = await variableInterestRateFactory.deploy();
    // console.log("variableInterestRate", variableInterestRate.address);

    // tx = await reputationManager.incrementScore("0x0902B27060FB9acfb8C97688DA60D79D2EdD656e",pp); // validator
    // tx.wait();

    // tx = await reputationManager.incrementScore(account,pp); // validator
    // tx.wait();

    // console.log("A1")

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
    // console.log("E");
    // tx = await controller.setValidatorManager(validator_manager_address);
    // tx = await controller.testVerifyAddress(); 
    // tx.wait();
    // tx = await reputationManager.setTraderScore(account, pp); 
    // tx.wait();
    // let tx = await controller.initiateMarket(
    //     "0x26373F36f72B6e16F5A7860f957262677B9CB076",
    //     {
    //         name: utils.formatBytes32String("instrument 1"),
    //         isPool: false,
    //         trusted: false,
    //         balance: 0,
    //         faceValue: pp.add(pp.mul(5).div(100)),
    //         marketId: 0,
    //         principal: pp,
    //         expectedYield: pp.mul(5).div(100),
    //         duration: 100,
    //         description: "description",
    //         instrument_address: creditLine_address,
    //         instrument_type: 0,
    //         maturityDate: 0,
    //         poolData: {
    //             saleAmount: 0,
    //             initPrice:0,
    //             promisedReturn: 0,
    //             inceptionTime: 0,
    //             inceptionPrice: 0,
    //             leverageFactor: 0,
    //             managementFee: 0,
    //         }
    //     },
    //     1
    // )
    // tx.wait();
    // console.log("tx");
    // console.log("initiateMarket");

    // console.log("E")
    

    // tx = await controller.createVault(
    //     "0xF44d295fC46cc72f8A2b7d91F57e32949dD6B249",
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

// export const getContractData = async (account: string, provider: Web3Provider): Promise<{
//     vaults: VaultInfos, 
//     markets: CoreMarketInfos, 
//     instruments: InstrumentInfos,
//     blocknumber: number
// }> => {
//     const blocknumber = await provider.getBlockNumber();
//     const controller = new Contract(controller_address, ControllerData.abi, provider);
//     const marketManager = new Contract(market_manager_address, MarketManagerData.abi, provider);
//     const vaultFactory = new Contract(vault_factory_address, VaultFactoryData.abi, provider);
//     const fetcher = new Contract(fetcher_address, FetcherData.abi, getProviderOrSigner(provider, account));


//     const numVaults = await vaultFactory.numVaults();
//     let vaults: VaultInfos = {};
//     let markets: CoreMarketInfos = {};
//     let instruments: InstrumentInfos = {};

//     for (let i = 1; i < numVaults.toNumber()+1; i++) {

//         const { vaultBundle, marketBundle, instrumentBundle, timestamp } = await fetcher.fetchInitial(
//             controller_address, 
//             market_manager_address,
//             i
//         );
//         console.log("vaultBundle", vaultBundle);
//         if (isDataTooOld(timestamp.toNumber())) {
//             console.error(
//               "node returned data too old",
//               "timestamp",
//               new Date(timestamp.toNumber() * 1000).toString(),
//               provider.connection.url
//             );
//             throw new Error("contract data too old");
//           }
        
//         let default_params = {
//             N: vaultBundle.default_params.N.toString(),
//             sigma: toDisplay(vaultBundle.default_params.sigma.toString()),
//             alpha: toDisplay(vaultBundle.default_params.alpha.toString()),
//             omega: toDisplay(vaultBundle.default_params.omega.toString()),
//             delta: toDisplay(vaultBundle.default_params.delta.toString()),
//             r: toDisplay(vaultBundle.default_params.r.toString()),
//             s: toDisplay(vaultBundle.default_params.s.toString()),
//             steak: toDisplay(vaultBundle.default_params.steak.toString()),
//         };

//         //let want = structuredClone(vaultBundle.want);
//         let want = {} as any;
//         want.address = vaultBundle.want.addr;
//         want.symbol = vaultBundle.want.symbol;
//         want.decimals = vaultBundle.want.decimals.toNumber();
//         want.name = vaultBundle.want.name;
//         want.asset = "";
//         want.displayDecimals = 6;

//         // add vault
//         let vault: VaultInfo = Object.assign ({}, {
//             address: vaultBundle.vault_address,
//             vaultId: vaultBundle.vaultId.toString(),
//             marketIds: vaultBundle.marketIds.map((id: BigNumber) => id.toString()),
//             onlyVerified: vaultBundle.onlyVerified,
//             want: want,
//             default_params: default_params,
//             r: toDisplay(vaultBundle.r.toString()),
//             asset_limit: toDisplay(vaultBundle.asset_limit.toString()),
//             total_asset_limit: toDisplay(vaultBundle.total_asset_limit.toString()),
//             totalShares: toDisplay(vaultBundle.totalShares.toString()),
//             name: vaultBundle.name,
//             exchangeRate: toDisplay(vaultBundle.exchangeRate.toString()),
//             utilizationRate: toDisplay(vaultBundle.utilizationRate.toString()),
//             totalAssets: toDisplay(vaultBundle.totalAssets.toString()),
//             totalEstimatedAPR: toDisplay(vaultBundle.totalEstimatedAPR.toString()), 
//             goalAPR: toDisplay(vaultBundle.goalAPR.toString()), 
//             totalProtection: toDisplay(vaultBundle.totalProtection.toString())
//         });  

//         for (let j = 0; j < marketBundle.length; j++) {
//             // add market
//             let m = marketBundle[j];
//             let parameters = {} as any;
//             for (const [key, value] of Object.entries(m.parameters)) {
//                 if (!isNumeric(key)) {
//                     parameters[key] = toDisplay(value.toString());
//                 }
//             }

//             let validatorData = {
//                 validators: m.validatorData.validators,
//                 val_cap: toDisplay(m.validatorData.val_cap.toString()),
//                 avg_price: toDisplay(m.validatorData.avg_price.toString()),
//                 totalSales: toDisplay(m.validatorData.totalSales.toString()),
//                 totalStaked: toDisplay(m.validatorData.totalStaked.toString()),
//                 numApproved: m.validatorData.numApproved.toString(),
//                 initialStake: toDisplay(m.validatorData.initialStake.toString()),
//                 finalStake: toDisplay(m.validatorData.finalStake.toString()),
//                 numResolved: m.validatorData.numResolved.toString(),
//             }

//             let market: CoreMarketInfo = Object.assign(
//                 {},
//                 {
//                     bondPool: m.bondPool,
//                     marketId: m.marketId.toString(),
//                     vaultId: m.vaultId.toString(),
//                     creationTimestamp: m.creationTimestamp.toString(),
//                     parameters,
//                     phase: m.phase,
//                     longZCB: m.longZCB,
//                     shortZCB: m.shortZCB,
//                     approved_principal: toDisplay(m.approved_principal.toString()),
//                     approved_yield: toDisplay(m.approved_yield.toString()),
//                     longZCBprice: toDisplay(m.longZCBprice.toString()),
//                     longZCBsupply: toDisplay(m.longZCBsupply.toString()),
//                     redemptionPrice: toDisplay(m.redemptionPrice.toString()),
//                     totalCollateral: toDisplay(m.totalCollateral.toString()),
//                     validatorData,
//                     marketConditionMet: m.marketConditionMet,
//                     initialLongZCBPrice: toDisplay(m.initialLongZCBPrice.toString())
//                 }
//             );

//             let instr = instrumentBundle[j];
//             let poolData = {} as any;
//             let instrument: Instrument  = Object.assign(
//                 {},
//                 {
//                     name: parseBytes32String(instr.name),
//                     marketId: instr.marketId.toString(),
//                     vaultId: instr.vaultId.toString(),
//                     utilizer: instr.utilizer,
//                     trusted: instr.trusted,
//                     description: instr.description,
//                     balance: toDisplay(instr.balance.toString()),
//                     principal: toDisplay(instr.principal.toString()),
//                     interest: toDisplay(instr.expectedYield.toString()),
//                     address: instr.instrument_address,
//                     duration: instr.duration.toString(),
//                     maturityDate: instr.maturityDate.toString(),
//                     seniorAPR: toDisplay(instr.seniorAPR.toString()),
//                     exposurePercentage: toDisplay(instr.exposurePercentage.toString()),
//                     managerStake: toDisplay(instr.managers_stake?.toString()),
//                     approvalPrice: toDisplay(instr.approvalPrice?.toString()),
//                     isPool: instr.isPool, 
//                     instrumentType: instr.instrument_type.toString(),
//                 }
//             )

//             if (instr.isPool) {
//                 let l = instr.poolData.collaterals.length;
//                 let collaterals: Collateral[] = [];
//                 for (let z=0; z < l; z++) {
//                     let _c = instr.poolData.collaterals[z];
//                     let c = Object.assign({}, {
//                         address: _c.tokenAddress,
//                         tokenId: _c.tokenId.toString(),
//                         name: _c.name,
//                         symbol: _c.symbol,
//                         isERC20: _c.isERC20,
//                         decimals: _c.decimals,
//                         borrowAmount: toDisplay(_c.borrowAmount.toString()),
//                         maxAmount: toDisplay(_c.maxAmount.toString()),
//                     })
//                     collaterals.push(c);
//                 }
//                 instrument = Object.assign(
//                     instrument,
//                     {  
//                         saleAmount: toDisplay(instr.poolData.saleAmount.toString()),
//                         initPrice: toDisplay(instr.poolData.initPrice.toString()),
//                         promisedReturn: instr.poolData.promisedReturn.toString(),
//                         inceptionTime: instr.poolData.inceptionTime.toString(),
//                         inceptionPrice: toDisplay(instr.poolData.inceptionPrice.toString()),
//                         poolLeverageFactor: toDisplay(instr.poolData.leverageFactor.toString()),
//                         managementFee: toDisplay(instr.poolData.managementFee.toString()),
//                         pju: toDisplay(instr.poolData.pju.toString()),
//                         psu: toDisplay(instr.poolData.psu.toString()),
//                         totalBorrowedAssets: toDisplay(instr.poolData.totalBorrowedAssets.toString()),
//                         totalSuppliedAssets: toDisplay(instr.poolData.totalSuppliedAssets.toString()),
//                         //totalAvailableAssets: toDisplay(instr.poolData.totalAvailableAssets.toString()),
//                         totalAvailableAssets: "0",
//                         APR: toDisplay(instr.poolData.APR.toString()),
//                         collaterals
//                     }
//                 )
//             }

//             markets[market.marketId] = market;
//             instruments[instrument.marketId] = instrument;
//         }
        
//         vaults[vault.vaultId] = vault;
//     }
//     // can filter markets here, if dead markets for example.

//     return { vaults, markets, instruments, blocknumber };
// }

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!
    return !Number.isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !Number.isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }

// mint test NFT for testing, should take tokenId as input and token address
export const mintTestNFT = async (account: string, provider: Web3Provider, tokenId: string, tokenAddress: string) => {
    const contract = new Contract(tokenAddress, TestNFTData.abi, getSigner(provider, account));
    const tx = await contract.freeMint(account, tokenId);
    await tx.wait(1);
    return tx;
}

// mint cash token for testing, should take account, provider, tokenId, token address as input
export const mintCashToken = async (account: string, provider: Web3Provider, tokenAddress: string) => {
    const contract = new Contract(tokenAddress, CashData.abi, getSigner(provider, account));
    const tx = await contract.faucet(new BN(1e18).multipliedBy(20).toFixed(0));
    await tx.wait(1);
    return tx;
}


export const getRammData = async (
    account: string, 
    provider: Web3Provider,
    vaults: VaultInfos,
    markets: CoreMarketInfos,
    instruments: InstrumentInfos,
    blocknumber: number
): Promise<CoreUserState> => {
    // get reputation score
    const controller = new Contract(controller_address, ControllerData.abi, provider);
    const reputationManager = new Contract(reputation_manager_address, ReputationManagerData.abi, provider);

    const reputationScore = toDisplay((await reputationManager.trader_scores(account)).toString());

    // get vault balances
    let vaultBalances: VaultBalances = {};
    console.log('A')
    for (const [key, value] of Object.entries(vaults)) {
        const vault = new Contract(value.address, VaultData.abi, getProviderOrSigner(provider, account));
        const balance = await vault.balanceOf(account);
        const base = new Contract(value.want.address, ERC20Data.abi, getProviderOrSigner(provider, account));
        const baseBalance = await base.balanceOf(account);
            console.log('getting user balances', key,value, balance.toString(),baseBalance.toString() )

        Object.assign(vaultBalances, {
            [key]: {
                shares: toDisplay(balance.toString()),
                base: toDisplay(baseBalance.toString())
            }
        })
    }
    console.log('B')

    // get zcb balances
    let zcbBalances: ZCBBalances = {};
    for (const [key, market] of Object.entries(markets as CoreMarketInfos)) {
        const { bondPool : { longZCB: { address: longZCBAddress }, shortZCB: { address: shortZCBAddress }} } = market;
        const longZCBContract = new Contract(longZCBAddress, ERC20Data.abi, getProviderOrSigner(provider, account));
        const shortZCBContract = new Contract(shortZCBAddress, ERC20Data.abi, getProviderOrSigner(provider, account));
        const longZCBBalance = await longZCBContract.balanceOf(account);
        const shortZCBBalance = await shortZCBContract.balanceOf(account);
        console.log('zcbbalances', longZCBBalance.toString())
        Object.assign(zcbBalances, {
            [key]: {
                longZCB: toDisplay(longZCBBalance.toString()),
                shortZCB: toDisplay(shortZCBBalance.toString())
            }
        })
    };
    console.log("C")

    // get pool data
    let poolInfos: UserPoolInfos = {};

    for (const [key, instrument] of Object.entries(instruments as InstrumentInfos)) {
        if ("poolLeverageFactor" in instrument) {
            // multicall w/ all the collateral balances + all the pool data
            const multicall = new Multicall({ ethersProvider: provider });

            console.log("pool leverage Factor")

            const walletBalancesContractCalls: ContractCallContext[] = instrument.collaterals.map((c) => {
                return c.isERC20 ? {
                    reference: "wallet-"+c.address + "-" + c.tokenId,
                    contractAddress: c.address,
                    abi:ERC20Data.abi,
                    calls: [
                        {
                            reference: "balanceOf",
                            methodName: "balanceOf",
                            methodParameters: [account],
                        },
                    ]                    
                } : {
                    reference: "wallet-"+c.address + "-" + c.tokenId,
                    contractAddress: c.address,
                    abi:ERC721Data.abi,
                    calls: [
                        {
                            reference: "ownerOf",
                            methodName: "ownerOf",
                            methodParameters: [c.tokenId],
                        },
                    ]
                }
            });
            
            const supplyBalancesContractCalls: ContractCallContext[] = instrument.collaterals.map((c) => {
                const methodParameters = c.isERC20 ? [c.address, account] : [c.address, c.tokenId];
                return {
                    reference: "supply-"+c.address + "-" + c.tokenId,
                    contractAddress: instrument.address,
                    abi: PoolInstrumentData.abi,
                    calls: [
                        {
                            reference: "balanceOf",
                            methodName: c.isERC20 ? "userCollateralERC20" : "userCollateralNFTs",
                            methodParameters,
                        }
                    ]               
                }});

            const maxBorrowableContractCall: ContractCallContext = {
                reference: "maxBorrowable",
                contractAddress: instrument.address,
                abi: PoolInstrumentData.abi,
                calls: [
                    {
                        reference: "maxBorrowable",
                        methodName: "getMaxBorrow",
                        methodParameters: [account]
                    }]
            }
            
            const removableCollateralContractCalls: ContractCallContext[] = instrument.collaterals.map((c) => {
                return {
                    reference: "removable-"+c.address+"-"+c.tokenId,
                    contractAddress: instrument.address,
                    abi: PoolInstrumentData.abi,
                    calls: [
                        {
                            reference: "removableCollateral",
                            methodName: "removeableCollateral",
                            methodParameters: [account, c.tokenId, c.address],
                        }
                    ]               
                }
            });
                

            const userSnapshotContractCall: ContractCallContext[] = [
                {
                    reference: "userSnapshot",
                    contractAddress: instrument.address,
                    abi: PoolInstrumentData.abi,
                    calls: [
                        {
                            reference: "snapshot",
                            methodName: "getUserSnapshot",
                            methodParameters: [account]
                        }
                    ]
                }
            ];

            const { results }: ContractCallResults = await multicall.call(
                [...walletBalancesContractCalls,
                ...supplyBalancesContractCalls,
                ...userSnapshotContractCall,
                ...removableCollateralContractCalls,
                maxBorrowableContractCall
            ]
            );
            console.log('results', results);
            let walletBalances = {};
            let supplyBalances = {};
            let removableCollaterals = {};

            instrument.collaterals.map((c) => {

                let walletBalance;
                let supplyBalance;
                let removableCollateral = toDisplay(results["removable-"+c.address+"-"+c.tokenId].callsReturnContext[0].returnValues[0].toString());
                if (c.isERC20) {
                    walletBalance = toDisplay(results["wallet-"+c.address+"-"+c.tokenId].callsReturnContext[0].returnValues[0].toString());
                    supplyBalance = toDisplay(results["supply-"+c.address+"-"+c.tokenId].callsReturnContext[0].returnValues[0].toString());
                } else {
                    walletBalance = results["wallet-"+c.address+"-"+c.tokenId].callsReturnContext[0].returnValues[0] === account ? "1" : "0";
                    supplyBalance = results["supply-"+c.address+"-"+c.tokenId].callsReturnContext[0].returnValues[0] === account ? "1" : "0";
                }
                // I hate javascript and this whole hack data structure.
                if (walletBalances[c.address]) {
                    let obj2 = Object.assign({}, walletBalances[c.address], {
                        [c.tokenId]: walletBalance
                    })
                    let obj3 = Object.assign({}, supplyBalances[c.address], {
                        [c.tokenId]: supplyBalance     
                     })
                    let obj4 = Object.assign({}, removableCollateral[c.address], {
                        [c.tokenId]: removableCollateral     
                     });
                    walletBalances = Object.assign(walletBalances, {
                        [c.address] : obj2
                    })
                    supplyBalances = Object.assign(supplyBalances, {
                        [c.address] : obj3
                    });
                    removableCollaterals = Object.assign(removableCollateral, {
                        [c.address] : obj4
                    });
                } else {
                    Object.assign(walletBalances, {
                        [c.address] : {
                            [c.tokenId]: walletBalance
                        }
                    })
                    Object.assign(supplyBalances, {
                        [c.address] : {
                            [c.tokenId]: supplyBalance
                        }
                    })
                    Object.assign(removableCollaterals, {
                        [c.address] : {
                            [c.tokenId]: removableCollateral
                        }
                    })
                }
            });

            const userSnapshot = results["userSnapshot"].callsReturnContext[0].returnValues as any;
            const maxBorrowable = toDisplay(results["maxBorrowable"].callsReturnContext[0].returnValues[0].toString());

            Object.assign(poolInfos, {
                [instrument.marketId]: {
                    walletBalances,
                    supplyBalances,
                    borrowBalance: {
                        shares: toDisplay(userSnapshot._userBorrowShares.toString()),
                        amount: toDisplay(userSnapshot._userBorrowAmount.toString())
                    },
                    accountLiquidity: toDisplay(userSnapshot._userAccountLiquidity.toString()),
                    maxBorrowable,
                    removableCollateral: removableCollaterals
                }
            });
        }
            
    }
    
    return {
        reputationScore,
        vaultBalances,
        zcbBalances,
        poolInfos
    }
}

// called to create the instrument.
export const createCreditLineInstrument = async (
    account: string, 
    provider: Web3Provider,
    vault: string, // vault address
    principal: string,
    notionalInterest: string,
    duration: string,
    collateral: string,
    collateral_balance: string,
    collateral_type: string
): Promise<string> => {
    const creditlineFactory = new ContractFactory(CreditlineData.abi, CreditlineData.bytecode, provider.getSigner(account));
    const faceValue = new BN(principal).plus(new BN(notionalInterest)).toString();
    // console.log("vault: ", vault);
    // console.log("account: ", account);
    // console.log("principal: ", principal);
    // console.log("faceValue: ", faceValue);
    // console.log("duration: ", duration);
    const creditline = await creditlineFactory.deploy(
        vault,
        account,
        principal,
        notionalInterest,
        duration,
        faceValue,
        collateral,
        constants.AddressZero,
        collateral_balance,
        collateral_type
    );
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
    instrument_address: string, 
    vaultId: string,
    principal: string, // user input, capped at however many decimals places of the underlying.
    expectedYield: string,
    description: string,
    duration: string
): Promise<TransactionResponse>  => {
    const controller = new Contract(controller_address, ControllerData.abi, provider.getSigner(account));
    const faceValue = new BN(principal).plus(new BN(expectedYield)).toFixed(0);
    const tx: TransactionResponse = await controller.initiateMarket(
        account,
        {
            name: formatBytes32String(name),
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
            poolData: {
                saleAmount: 0,
                initPrice: 0,
                promisedReturn: 0,
                inceptionTime: 0,
                inceptionPrice: 0,
                leverageFactor: 0,
                managementFee: 0
            }
        },
        vaultId
    );
    await tx.wait(1);

    return tx;
}

// export const getUserPoolData = async (
//     account: string, 
//     provider: Web3Provider,
//     instrument_address: string,
//     collaterals: Collateral[]
//     ): Promise<UserPoolData> => {
    
// }


/// POOL ACTIONS

export const useIsERC20ApprovedSpender = async (
    account: string,
    library: Web3Provider,
    tokenAddress: string,
    spenderAddress: string,
    amount: string
): Promise<boolean> => {
    const token = new Contract(tokenAddress, ERC20Data.abi, getProviderOrSigner(library, account));
    const decimals = await token.decimals();
    const allowance = await token.allowance(account, spenderAddress);
    return allowance && new BN(allowance.toString()).gt(new BN(amount).shiftedBy(new BN(decimals).toNumber())) ? true : false;
    
    // return useMemo(async () => {
    //     const token = new Contract(tokenAddress, ERC20Data.abi, getProviderOrSigner(library, account));
    //     const decimals = await token.decimals();
    //     const allowance = await token.allowance(account, spenderAddress);
    //     return allowance && new BN(allowance.toString()).gt(new BN(amount).shiftedBy(decimals.toString())) ? true : false;
    // }, [account, library, tokenAddress, spenderAddress]);
}

export const useIsERC721ApprovedSpender = async (
    account: string,
    library: Web3Provider,
    tokenAddress: string,
    tokenId: string,
    spenderAddress: string
): Promise<boolean> => {
    // const { account, library } = useActiveWeb3React();
    const token = new Contract(tokenAddress, ERC721Data.abi, getProviderOrSigner(library, account));
    const approval = await token.getApproved(tokenId);
    return approval === spenderAddress ? true : false;    
    // return useMemo(async () => {
    //     const token = new Contract(tokenAddress, ERC721Data.abi, getProviderOrSigner(library, account));
    //     const approval = await token.getApproved(tokenId);
    //     return approval === spenderAddress ? true : false;
    // }, [account, library, tokenAddress, spenderAddress]);
}

export const approveERC20 = async (
    account: string,
    library: Web3Provider,
    tokenAddress: string,
    amount: string,
    spenderAddress: string
): Promise<TransactionResponse> => {
    // const { account, library } = useActiveWeb3React();
    const token = new Contract(tokenAddress, ERC20Data.abi, getSigner(library, account));
    const decimals = await token.decimals();
    const tx: TransactionResponse = await token.approve(spenderAddress, new BN(amount).shiftedBy(new BN(decimals).toNumber()).toString());
    tx.wait();
    return tx;
}

export const approveERC721 = async (
    account: string,
    library: Web3Provider,
    tokenAddress: string,
    tokenId: string,
    spenderAddress: string
): Promise<TransactionResponse> => {
    // const { account, library } = useActiveWeb3React();
    const token = new Contract(tokenAddress, ERC721Data.abi, getSigner(library, account));
    const tx: TransactionResponse = await token.approve(spenderAddress, tokenId);
    tx.wait();
    return tx;
}

export const addPoolCollateral = async (
    account: string,
    library: Web3Provider,
    tokenAddress: string,
    tokenId="0",
    amount: string,
    poolAddress: string,
    isERC20: boolean,
    decimals?: number // decimals of collaterl token
) => {
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    console.log("A");
    if (isERC20) {
        const approved = await useIsERC20ApprovedSpender(account, library, tokenAddress, poolAddress, amount);
        console.log("approved: ", approved);
        if (!approved) {
            await approveERC20(account, library, tokenAddress, amount, poolAddress);
        }
    } else {
        const approved = await useIsERC721ApprovedSpender(account, library, tokenAddress, tokenId, poolAddress);
        if (!approved) {
            await approveERC721(account, library, tokenAddress, tokenId, poolAddress);
        }
    }
    const tx: TransactionResponse = await pool.addCollateral(
        tokenAddress, 
        tokenId,
        new BN(amount).shiftedBy(decimals).toString(),
        account
    );
    tx.wait();
    return tx;
}

export const removePoolCollateral = async (
    account: string,
    library: Web3Provider,
    tokenAddress: string,
    tokenId="0",
    amount="0",
    poolAddress: string,
    decimals?: number
) => {
    // const { account, library } = useActiveWeb3React();
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    const tx: TransactionResponse = await pool.removeCollateral(
        tokenAddress, 
        tokenId,
        new BN(amount).shiftedBy(decimals).toString(),
        account
    );
    tx.wait();
    return tx;
}

export const poolBorrow = async (
    account: string,
    library: Web3Provider,
    amount: string,
    collateralAmount: string,
    collateralAddress: string,
    collateralTokenId: string,
    collateralIsERC20: boolean,
    collateralDecimals: number,
    poolAddress: string
) => {
    // const { account, library } = useActiveWeb3React();
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    if (new BN(collateralAmount).gt(new BN(0))) {
        if (collateralIsERC20) {
            const approved = await useIsERC20ApprovedSpender(account, library, collateralAddress, poolAddress, collateralAmount);
            if (!approved) {
                await approveERC20(account, library, collateralAddress, collateralAmount, poolAddress);
            }
        } else {
            const approved = await useIsERC721ApprovedSpender(account, library, collateralAddress, collateralTokenId, poolAddress);
            if (!approved) {
                await approveERC721(account, library, collateralAddress, collateralTokenId, poolAddress);
            }
        }
    }
    const tx: TransactionResponse = await pool.borrow(
        new BN(amount).shiftedBy(18).toFixed(0),
        collateralAddress,
        collateralTokenId,
        collateralIsERC20 ? new BN(collateralAmount).shiftedBy(collateralDecimals).toFixed(0) : "0",
        account
    );
    return tx;
}


// repay is not ready yet.
export const poolRepayAmount = async (
    account: string,
    library: Web3Provider,
    amount: string,
    poolAddress: string,
    assetAddress: string
) => {
    // const { account, library } = useActiveWeb3React();
    const approved = await useIsERC20ApprovedSpender(account, library, assetAddress, poolAddress, amount);
    if (!approved) {
        await approveERC20(account, library, assetAddress, amount, poolAddress);
    }
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    const tx: TransactionResponse = await pool.repayWithAmount(
        new BN(amount).shiftedBy(18).toString(),
        account
    );
    return tx;
}

// export const poolRepayShares = async (
//     account: string,
//     library: Web3Provider,
//     amount: string,
//     decimals: number,
//     poolAddress: string,
//     assetAddress: string
// ) {
    
// }

export const poolAddInterest = async (
    account: string,
    library: Web3Provider,
    poolAddress: string
) => {
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    const tx: TransactionResponse = await pool.addInterest();
    tx.wait();
    return tx;
}