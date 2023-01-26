import { BigNumber as BN } from "bignumber.js";
import {
    CoreMarketInfo, VaultInfos, CoreMarketInfos, InstrumentInfos, VaultInfo, CoreInstrumentData,
    CoreUserState, VaultBalances, ZCBBalances, Instrument, UserPoolInfos, Collateral, UserPoolInfo
} from "../types";
import { useMemo } from "react";
import {
    controller_address,
    market_manager_address,
    vault_factory_address,
    fetcher_address,
    reputation_manager_address,
    pool_factory_address,
    usdc_address,
    weth_address,
    creditLine_address,
    variable_interest_rate_address,
    validator_manager_address,
    ORACLE_MAPPING
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
import CoveredCallInstrumentData from "../data/CoveredCallOTC.json";
import AggregatorV3InterfaceData from "../data/AggregatorV3Interface.json";
import IRateCalculatorData from "../data/IRateCalculator.json";


import { BigNumber, Transaction, constants, utils } from "ethers";
import { getProviderOrSigner, getSigner } from "../components/ConnectAccount/utils";

import { Contract, ContractFactory } from "@ethersproject/contracts";
import { TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { isDataTooOld } from "./date-utils";
// import { EthersFastSubmitWallet } from "@augurproject/smart";
import { useActiveWeb3React } from "../components/ConnectAccount/hooks";
import { formatBytes32String, parseBytes32String, defaultAbiCoder } from "ethers/lib/utils";

import { rammClient, localClient } from "../apollo-ramm/client";
import { GET_VAULTS, GET_INSTRUMENTS, GET_MARKETS } from "../apollo-ramm/queries";

import _, { stubFalse } from "lodash"

// @ts-ignore
import { ContractCallContext, ContractCallResults, ContractCallReturnContext, Multicall } from "@augurproject/ethereum-multicall";


type NumStrBigNumber = number | BN | string;

// from wad to display string
function toDisplay(n: NumStrBigNumber, p: number = 18, d: number = 4) {
    return new BN(n).shiftedBy(-p).decimalPlaces(d).toString();
}
const pp = BigNumber.from(10).pow(18);



export const createOptionsInstrument = async (
    account, library,
    vault,
    strikePrice,
    pricePerContract,
    duration,
    numContracts,
    tradeTime,
    cash
): Promise<{ instrumentAddress: string, response: TransactionResponse }> => {
    const factory = new ContractFactory(CoveredCallInstrumentData.abi, CoveredCallInstrumentData.bytecode, library.getSigner(account));

    const shortCollateral = new BN(numContracts).multipliedBy(pricePerContract).decimalPlaces(18,1).dividedBy(new BN(pricePerContract)).shiftedBy(18).toFixed(0);
    const longCollateral = new BN(numContracts).multipliedBy(pricePerContract).shiftedBy(18).toFixed(0);
    strikePrice = new BN(strikePrice).shiftedBy(18).toFixed(0)
    
    pricePerContract = new BN(pricePerContract).shiftedBy(18).toFixed(0)

    console.log("shortCollateral", shortCollateral)
    console.log("longCollateral", longCollateral)
    console.log("pricePerContract", pricePerContract)

    // address _vault,
    // address _utilizer,
    // uint256 _strikePrice, 
    // uint256 _pricePerContract, // depends on IV, price per contract denominated in underlying  
    // uint256 _shortCollateral, // collateral for the sold options-> this is in underlyingAsset i.e weth 
    // uint256 _longCollateral,
    // address _cash,  // collateral amount in underlying for long to pay. (price*quantity)
    // uint256 duration,   
    // uint256 _tradeTime/

    const contract: Contract =  await factory.deploy(
        vault,
        account,
        strikePrice,
        pricePerContract,
        shortCollateral,
        longCollateral,
        cash,
        duration,
        tradeTime
    );
    return { instrumentAddress: contract.address, response: contract.deployTransaction };
}

// amount not in wad
export const depositOptionsInstrument = async (
    account, library,
    instrumentAddress
): Promise<TransactionResponse> => {
    const signer = library.getSigner(account);
    const instrument = new Contract(instrumentAddress, CoveredCallInstrumentData.abi, signer);
    return instrument.deposit();
}

export const createOptionsMarket = async (
    account: string, provider: Web3Provider,
    name,
    description,
    instrumentAddress,
    numContracts,
    pricePerContract,
    duration,
    maturityDate,
    vaultId,
): Promise<TransactionResponse> => {


    const shortCollateral = new BN(numContracts).shiftedBy(18).toFixed(0);
    const longCollateral = new BN(numContracts).multipliedBy(pricePerContract).shiftedBy(18).toFixed(0);
    pricePerContract = new BN(pricePerContract).shiftedBy(18).toFixed(0)

    const faceValue = new BN(longCollateral).plus(new BN(shortCollateral)).toFixed(0)

    // get controller contract
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    console.log("name: ", name)

    // create instrument data object that will be passed to the controller initiateMarket function
    const instrumentData = {
        name: formatBytes32String(name),
        isPool: false,
        trusted: false,
        balance: 0,
        faceValue: faceValue,
        marketId: 0,
        principal: shortCollateral,
        expectedYield: longCollateral,
        duration: duration,
        description: description,
        instrument_address: instrumentAddress,
        instrument_type: 1,
        maturityDate: maturityDate,
        poolData: {
            saleAmount: 0,
            initPrice: 0,
            promisedReturn: 0,
            inceptionTime: 0,
            inceptionPrice: 0,
            leverageFactor: 0,
            managementFee: 0,
        }
    }
    console.log("instrumentData", instrumentData)
    console.log("vaultId", vaultId)
    console.log("account", account)

    let tx = await controller.initiateMarket(
        account,
        instrumentData,
        vaultId
    );
    return tx;
}

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
            let _vault = _.assign(vault, { marketIds });
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
            let phase = {
                duringAssessment: market.duringAssessment,
                onlyReputable: market.onlyReputable,
                resolved: market.resolved,
                alive: market.alive,
                base_budget: market.baseBudget,
                marketCondition: market.marketCondition
            }
            let _market = _.assign(market, { vaultId: market.vaultId.vaultId }, { validators, parameters, phase });

            markets[market.marketId] = _market;
        })

        const instrumentResponse = await rammClient.query({
            query: GET_INSTRUMENTS
        });

        console.log("instrumentResponse", instrumentResponse)

        _.forEach(instrumentResponse.data.poolInstruments, (instrument) => {
            instruments[instrument.marketId.id] = _.assign(instrument, {
                vaultId: instrument.vaultId.vaultId,
                marketId: instrument.marketId.id,
                isPool: true,
                promisedReturn: new BN(instrument.promisedReturn).shiftedBy(18).toFixed(0),
                seniorAPR: new BN(instrument.seniorAPR).shiftedBy(18).toFixed(0)
            })
        })
        _.forEach(instrumentResponse.data.generalInstruments, (instrument) => {
            instruments[instrument.marketId.id] = _.assign(instrument, {
                vaultId: instrument.vaultId.vaultId,
                marketId: instrument.marketId.id,
                isPool: false,
                seniorAPR: new BN(instrument.seniorAPR).shiftedBy(18).toFixed(0)
            })
        })
        _.forEach(instrumentResponse.data.creditlineInstruments, (instrument) => {
            instruments[instrument.marketId.id] = _.assign(instrument, {
                vaultId: instrument.vaultId.vaultId,
                marketId: instrument.marketId.id,
                isPool: false,
                seniorAPR: new BN(instrument.seniorAPR).shiftedBy(18).toFixed(0)
            })
        })

        _.forEach(instrumentResponse.data.optionsInstruments, (instrument) => {
            instruments[instrument.marketId.id] = _.assign(instrument, {
                vaultId: instrument.vaultId.vaultId,
                marketId: instrument.marketId.id,
                isPool: false,
                seniorAPR: new BN(instrument.seniorAPR).shiftedBy(18).toFixed(0)
            })
        })
        console.log("EVERYTHING: ", vaults, markets, instruments, blocknumber)
        return { vaults, markets, instruments, blocknumber }

    } catch (err) {
        console.log(err);
        return { vaults, markets, instruments, blocknumber }
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
): Promise<TransactionResponse> => {
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

    return controller.initiateMarket(
        account,
        instrumentData,
        vaultId
    );
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
): Promise<{ response: TransactionResponse, instrumentAddress: string }> => {
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

    return { response: poolInstrument.deployTransaction, instrumentAddress: poolInstrument.address };
}

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
    const approved = await isERC20ApprovedSpender(account, provider, underlying_address, instrument_address, amount);

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



export const getContractData = async (account: string, provider: Web3Provider): Promise<{
    vaults: VaultInfos, 
    markets: CoreMarketInfos, 
    instruments: InstrumentInfos,
    blocknumber: number,
    prices: {
        [symbol:string]: string
    }
}> => {
    const blocknumber = await provider.getBlockNumber();

    const vaultFactory = new Contract(vault_factory_address, VaultFactoryData.abi, provider);
    const fetcher = new Contract(fetcher_address, FetcherData.abi, getProviderOrSigner(provider, account));

    const numVaults = await vaultFactory.numVaults();
    let vaults: VaultInfos = {};
    let markets: CoreMarketInfos = {};
    let instruments: InstrumentInfos = {};

    for (let i = 1; i < numVaults.toNumber()+1; i++) {
        const gasEstimate = await fetcher.estimateGas.fetchInitial(controller_address, market_manager_address, i);

        const { vaultBundle, marketBundle, instrumentBundle, timestamp } = await fetcher.fetchInitial(
            controller_address, 
            market_manager_address,
            i,
            {
                gasLimit: gasEstimate.mul(2).toString(),
            }
        );
        console.log("vaultBundle: ", vaultBundle);
        console.log("marketBundle: ", marketBundle);
        console.log("instrumentBundle: ", instrumentBundle);

        if (isDataTooOld(timestamp.toNumber())) {
            console.error(
              "node returned data too old",
              "timestamp",
              new Date(timestamp.toNumber() * 1000).toString(),
              provider.connection.url
            );
            throw new Error("contract data too old");
          }
        
        let default_params =  {
            N: vaultBundle.default_params.N.toString(),
            alpha: toDisplay(vaultBundle.default_params.alpha.toString()),
            sigma: toDisplay(vaultBundle.default_params.sigma.toString()),
            omega: toDisplay(vaultBundle.default_params.omega.toString()),
            delta: toDisplay(vaultBundle.default_params.delta.toString()),
            r: toDisplay(vaultBundle.default_params.r.toString()),
            s: toDisplay(vaultBundle.default_params.s.toString()),
            steak: toDisplay(vaultBundle.default_params.steak.toString()),
        }

        // //let want = structuredClone(vaultBundle.want);
        let want = {} as any;
        want.address = vaultBundle.want.addr;
        want.symbol = vaultBundle.want.symbol;
        want.decimals = vaultBundle.want.decimals.toNumber();
        want.name = vaultBundle.want.name;
        want.asset = "";
        want.displayDecimals = 6;

        // // add vault


        for (let j = 0; j < marketBundle.length; j++) {
            // add market
            let m = marketBundle[j];
            let parameters = {
                N: m.parameters.N.toString(),
                alpha: toDisplay(m.parameters.alpha.toString()),
                sigma: toDisplay(m.parameters.sigma.toString()),
                omega: toDisplay(m.parameters.omega.toString()),
                delta: toDisplay(m.parameters.delta.toString()),
                r: toDisplay(m.parameters.r.toString()),
                s: toDisplay(m.parameters.s.toString()),
                steak: toDisplay(m.parameters.steak.toString()),
            };

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

            markets[m.marketId.toString()] = {
                    marketId: m.marketId.toString(),
                    vaultId: m.vaultId.toString(),
                    creationTimestamp: m.creationTimestamp.toString(),
                    resolutionTimestamp: m.resolutionTimestamp.toString(),
                    parameters,

                    // phase data
                    duringAssessment: m.phase.duringAssessment,
                    onlyReputable: m.phase.onlyReputable,
                    resolved: m.phase.resolved,
                    alive: m.phase.alive,
                    atLoss: m.phase.atLoss,
                    base_budget: toDisplay(m.phase.base_budget.toString()),

                    approvedPrincipal: toDisplay(m.approvedPrincipal.toString()),
                    approvedYield: toDisplay(m.approvedYield.toString()),
                    managerStake: toDisplay(m.managerStake.toString()),
                    redemptionPrice: toDisplay(m.redemptionPrice.toString()),
                    totalCollateral: toDisplay(m.totalCollateral.toString()),
                    validatorData,
                    marketConditionMet: m.marketConditionMet,

                    bondPool: {
                        address: m.bondPool,
                        longZCBPrice: toDisplay(m.longZCBPrice.toString()),
                        a_initial: toDisplay(m.a_initial.toString()),
                        b_initial: toDisplay(m.b_initial.toString()),
                        b: toDisplay(m.b.toString()),
                        discountCap: toDisplay(m.discountCap.toString()),
                        discountedReserves: toDisplay(m.discountedReserves.toString()),
                        longZCB: {
                            name: "Long ZCB",
                            symbol: "long",
                            address: m.longZCB,
                            balance: toDisplay(m.longZCBSupply.toString()),
                            decimals: 18,
                        },
                        shortZCB: {
                            name: "Short ZCB",
                            symbol: "short",
                            address: m.shortZCB,
                            balance: toDisplay(m.shortZCBSupply.toString()),
                            decimals: 18,
                        },
                    }
                };
            let instr = instrumentBundle[j];

            let instrument: Instrument = {
                name: parseBytes32String(instr.name),
                marketId: instr.marketId.toString(),
                vaultId: instr.vaultId.toString(),
                utilizer: instr.utilizer,
                trusted: instr.trusted,
                description: instr.description,
                balance: toDisplay(instr.balance.toString()),
                principal: toDisplay(instr.principal.toString()),
                expectedYield: toDisplay(instr.expectedYield.toString()),
                address: instr.instrument_address,
                duration: instr.duration.toString(),
                maturityDate: instr.maturityDate.toString(),
                seniorAPR: toDisplay(instr.seniorAPR.toString()),
                exposurePercentage: toDisplay(instr.exposurePercentage.toString()),
                managerStake: toDisplay(instr.managers_stake?.toString()),
                approvalPrice: toDisplay(instr.approvalPrice?.toString()),
                isPool: instr.isPool, 
                instrumentType: instr.instrument_type.toString(),
            }

            if (instr.instrument_type.toString() === "2") {
                console.log("instr: ", instr);
                let l = instr.poolData.collaterals.length;
                let collaterals: Collateral[] = [];
                for (let z=0; z < l; z++) {
                    let _c = instr.poolData.collaterals[z];
                    let c = Object.assign({}, {
                        address: _c.tokenAddress,
                        tokenId: _c.tokenId.toString(),
                        name: _c.name,
                        symbol: _c.symbol,
                        isERC20: _c.isERC20,
                        decimals: _c.decimals,
                        borrowAmount: toDisplay(_c.borrowAmount.toString()),
                        maxAmount: toDisplay(_c.maxAmount.toString()),
                    })
                    collaterals.push(c);
                }

                //TODO: include other interest models other than just variable rate v2.
                // let rateCalculator = new Contract(instr.poolData.rateContract, IRateCalculatorData.abi, provider);

                // let encodedConstants = await rateCalculator.getConstants();

                // //uint32 MIN_UTIL, uint32 MAX_UTIL, uint32 UTIL_PREC, uint64 MIN_INT, uint64 MAX_INT, uint256 INT_HALF_LIFE
                // let decodedConstants = defaultAbiCoder.decode(["uint32", "uint32","uint32", "uint64", "uint64", "uint256"], encodedConstants)

                // let minUtil = Number(decodedConstants[0] / decodedConstants[2])
                // let maxUtil = Number(decodedConstants[1] / decodedConstants[2])
                // let minInt = new BN(decodedConstants[3].toString()).shiftedBy(-18).toNumber();
                // let maxInt = new BN(decodedConstants[4].toString()).shiftedBy(-18).toNumber();
                // let intHalfLife = new BN(decodedConstants[5].toString()).toNumber();
                let formattedRate = new BN(instr.poolData.ratePerSec.toString()).shiftedBy(-18).toNumber()
                
                let borrowAPR = String(Math.exp(31536000*Math.log(formattedRate + 1)) - 1);
                instrument = _.assign(
                    instrument,
                    {  
                        saleAmount: toDisplay(instr.poolData.saleAmount.toString()),
                        initPrice: toDisplay(instr.poolData.initPrice.toString()),
                        promisedReturn: instr.poolData.promisedReturn.toString(),
                        inceptionTime: instr.poolData.inceptionTime.toString(),
                        inceptionPrice: toDisplay(instr.poolData.inceptionPrice.toString()),
                        poolLeverageFactor: toDisplay(instr.poolData.leverageFactor.toString()),
                        managementFee: toDisplay(instr.poolData.managementFee.toString()),
                        pju: toDisplay(instr.poolData.pju.toString()),
                        psu: toDisplay(instr.poolData.psu.toString()),
                        totalBorrowedAssets: toDisplay(instr.poolData.totalBorrowedAssets.toString()),
                        totalSuppliedAssets: toDisplay(instr.poolData.totalSuppliedAssets.toString()),
                        utilizationRate: toDisplay(instr.poolData.utilizationRate.toString()),
                        totalAvailableAssets: toDisplay(instr.poolData.totalAvailableAssets.toString()),
                        // totalAvailableAssets: "0",
                        ratePerSecond: toDisplay(instr.poolData.ratePerSec.toString()),
                        rateContract: instr.poolData.rateContract,
                        rateName: instr.poolData.rateName,
                        collaterals,
                        exchangeRate: toDisplay(instr.poolData.exchangeRate.toString()),
                        // MIN_UTIL: minUtil,
                        // MAX_UTIL: maxUtil,
                        // MIN_INT: minInt,
                        // MAX_INT: maxInt,
                        // INT_HALF_LIFE: intHalfLife,
                        borrowAPR
                    }
                )
            // get rate constants.

            } else if (instr.instrument_type.toString() === "1") {
                instrument = _.assign(
                    instrument,
                    {  
                        strikePrice: toDisplay(instr.optionsData.strikePrice.toString()),
                        pricePerContract: toDisplay(instr.optionsData.pricePerContract.toString()),
                        shortCollateral: toDisplay(instr.optionsData.shortCollateral.toString()),
                        longCollateral: toDisplay(instr.optionsData.longCollateral.toString()),
                        maturityDate: instr.optionsData.maturityDate.toString(),
                        tradeTime: instr.optionsData.tradeTime.toString(),
                        oracle: instr.optionsData.oracle,
                        approvalStatus: instr.optionsData.approvalStatus,
                    }
                )
            } else if (instr.instrument_type.toString() === "0") {
                instrument = _.assign(
                    instrument,
                    {
                        collateral: instr.creditlineData.collateral,
                        collateralBalance: toDisplay(instr.creditlineData.collateralBalance.toString()),
                        oracle: instr.creditlineData.oracle,
                        loanStatus: instr.creditlineData.loanStatus,
                        collateralType: instr.creditlineData.collateralType,
                    }
                )
            }
            instruments[instrument.marketId] = instrument;
        }

        vaults[vaultBundle.vaultId] = {
            address: vaultBundle.vault_address,
            vaultId: vaultBundle.vaultId.toString(),
            marketIds: vaultBundle.marketIds.map((id: BigNumber) => id.toString()),
            onlyVerified: vaultBundle.onlyVerified,
            want: want,
            default_params: default_params,
            // r: toDisplay(vaultBundle.r.toString()),
            asset_limit: toDisplay(vaultBundle.asset_limit.toString()),
            total_asset_limit: toDisplay(vaultBundle.total_asset_limit.toString()),
            totalShares: toDisplay(vaultBundle.totalShares.toString()),
            name: vaultBundle.name,
            symbol: vaultBundle.symbol,
            exchangeRate: toDisplay(vaultBundle.exchangeRate.toString()),
            utilizationRate: toDisplay(vaultBundle.utilizationRate.toString()),
            totalAssets: toDisplay(vaultBundle.totalAssets.toString()),
            totalEstimatedAPR: toDisplay(vaultBundle.totalEstimatedAPR.toString()), 
            goalAPR: toDisplay(vaultBundle.goalAPR.toString()), 
            totalProtection: toDisplay(vaultBundle.totalProtection.toString()),
            totalInstrumentHoldings: toDisplay(vaultBundle.totalInstrumentHoldings.toString())
        };;
    }
    let prices = await getRammPrices(account, provider);
    return { vaults, markets, instruments, blocknumber, prices };
}

// Promise<{
//     [symbol:string]: string // price in USD
//   }>
export const getRammPrices = async (account: string, provider: Web3Provider): Promise<{
    [symbol: string]: string
}> => {
    const multicall = new Multicall({ ethersProvider: provider });
    
    let contractCalls: ContractCallContext[] = _.map(ORACLE_MAPPING, (value, key) => {
        return {
            reference: key,
            contractAddress: value,
            abi: AggregatorV3InterfaceData.abi,
            calls: [
                {
                    reference: "price-" + key,
                    methodName: "latestRoundData",
                    methodParameters: [],
                },
                {
                    reference: "decimals-" + key,
                    methodName: "decimals",
                    methodParameters: [],
                }
            ]
        }
    })

    const results: ContractCallResults = await multicall.call(contractCalls);
    // console.log("results", results);
    let prices = {};
    _.forEach(results.results, (value: any, key) => {
        prices[key] = toDisplay(value.callsReturnContext[0].returnValues.answer.toString(), value.callsReturnContext[1].returnValues[0].toString());
        if (key === "ETH") {
            prices["WETH"] = toDisplay(value.callsReturnContext[0].returnValues.answer.toString(), value.callsReturnContext[1].returnValues[0].toString());
        }
    })

    return prices;
}

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
    instruments: InstrumentInfos
): Promise<{
    reputationScore: string;
  vaultBalances: VaultBalances;
  zcbBalances: ZCBBalances;
  poolInfos: UserPoolInfos;
}> => {
    // get reputation score
    const controller = new Contract(controller_address, ControllerData.abi, provider);
    const reputationManager = new Contract(reputation_manager_address, ReputationManagerData.abi, provider);

    const reputationScore = toDisplay((await reputationManager.trader_scores(account)).toString());

    // get vault balances
    let vaultBalances: VaultBalances = {};
    await Promise.all(_.map(vaults, async (value, key) => {
        const vault = new Contract(value.address, VaultData.abi, getProviderOrSigner(provider, account));
        const balance = await vault.balanceOf(account);
        const base = new Contract(value.want.address, ERC20Data.abi, getProviderOrSigner(provider, account));
        const baseBalance = await base.balanceOf(account);
        vaultBalances[key] = {
            shares: toDisplay(balance.toString()),
            base: toDisplay(baseBalance.toString())
        }
      }));


    // // get zcb balances
    let zcbBalances: ZCBBalances = {};
    await Promise.all(_.map(markets, async (market, key) => {
        const { bondPool: { longZCB: { address: longZCBAddress }, shortZCB: { address: shortZCBAddress } } } = market;
        const longZCBContract = new Contract(longZCBAddress, ERC20Data.abi, getProviderOrSigner(provider, account));
        const shortZCBContract = new Contract(shortZCBAddress, ERC20Data.abi, getProviderOrSigner(provider, account));
        const longZCBBalance = await longZCBContract.balanceOf(account);
        const shortZCBBalance = await shortZCBContract.balanceOf(account);

        zcbBalances[key] = {
            longZCB: toDisplay(longZCBBalance.toString()),
            shortZCB: toDisplay(shortZCBBalance.toString())
        };
    }));

    // get pool data
    let poolInfos: UserPoolInfos = {};

    await Promise.all(_.map(instruments, async (instrument, key) => {
        if ("poolLeverageFactor" in instrument) {
            // multicall w/ all the collateral balances + all the pool data
            const multicall = new Multicall({ ethersProvider: provider });

            const walletBalancesContractCalls: ContractCallContext[] = _.map(instrument.collaterals,(c) => {
                return c.isERC20 ? {
                    reference: "wallet-" + c.address + "-" + c.tokenId,
                    contractAddress: c.address,
                    abi: ERC20Data.abi,
                    calls: [
                        {
                            reference: "balanceOf",
                            methodName: "balanceOf",
                            methodParameters: [account],
                        },
                    ]
                } : {
                    reference: "wallet-" + c.address + "-" + c.tokenId,
                    contractAddress: c.address,
                    abi: ERC721Data.abi,
                    calls: [
                        {
                            reference: "ownerOf",
                            methodName: "ownerOf",
                            methodParameters: [c.tokenId],
                        },
                    ]
                }
            });

            const supplyBalancesContractCalls: ContractCallContext[] = _.map(instrument.collaterals, (c) => {
                const methodParameters = c.isERC20 ? [c.address, account] : [c.address, c.tokenId];
                return {
                    reference: "supply-" + c.address + "-" + c.tokenId,
                    contractAddress: instrument.address,
                    abi: PoolInstrumentData.abi,
                    calls: [
                        {
                            reference: "balanceOf",
                            methodName: c.isERC20 ? "userCollateralERC20" : "userCollateralNFTs",
                            methodParameters,
                        }
                    ]
                }
            });

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

            const removableCollateralContractCalls: ContractCallContext[] = _.map(instrument.collaterals, (c) => {
                return {
                    reference: "removable-" + c.address + "-" + c.tokenId,
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

            _.forEach(instrument.collaterals, (c) => {

                let walletBalance;
                let supplyBalance;
                let removableCollateral = toDisplay(results["removable-" + c.address + "-" + c.tokenId].callsReturnContext[0].returnValues[0].toString());
                if (c.isERC20) {
                    walletBalance = toDisplay(results["wallet-" + c.address + "-" + c.tokenId].callsReturnContext[0].returnValues[0].toString());
                    supplyBalance = toDisplay(results["supply-" + c.address + "-" + c.tokenId].callsReturnContext[0].returnValues[0].toString());
                } else {
                    walletBalance = results["wallet-" + c.address + "-" + c.tokenId].callsReturnContext[0].returnValues[0] === account ? "1" : "0";
                    supplyBalance = results["supply-" + c.address + "-" + c.tokenId].callsReturnContext[0].returnValues[0] === account ? "1" : "0";
                }
                walletBalances[c.address + "-" + c.tokenId] = walletBalance;
                supplyBalances[c.address + "-" + c.tokenId] = supplyBalance;
                removableCollaterals[c.address + "-" + c.tokenId] = removableCollateral;
            });

            const userSnapshot = results["userSnapshot"].callsReturnContext[0].returnValues as any;
            const maxBorrowable = toDisplay(results["maxBorrowable"].callsReturnContext[0].returnValues[0].toString());

            poolInfos[instrument.marketId] = {
                walletBalances,
                supplyBalances,
                borrowBalance: {
                    shares: toDisplay(userSnapshot._userBorrowShares.toString()),
                    amount: toDisplay(userSnapshot._userBorrowAmount.toString())
                },
                accountLiquidity: toDisplay(userSnapshot._userAccountLiquidity.toString()),
                maxBorrowable,
                removableCollateral: removableCollaterals
            };
        }
    }))

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
    const { address: instrument_address } = creditline;
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
): Promise<TransactionResponse> => {
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

export const isERC20ApprovedSpender = async (
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


// amount not in wad
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
    tokenId = "0",
    amount: string,
    poolAddress: string,
    isERC20: boolean,
    decimals?: number // decimals of collaterl token
) => {
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    console.log("A");
    if (isERC20) {
        const approved = await isERC20ApprovedSpender(account, library, tokenAddress, poolAddress, amount);
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
    tokenId = "0",
    amount = "0",
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
            const approved = await isERC20ApprovedSpender(account, library, collateralAddress, poolAddress, collateralAmount);
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
// amount is not in wad
export const poolRepayAmount = async (
    account: string,
    library: Web3Provider,
    amount: string,
    poolAddress: string,
    assetAddress: string
) => {
    // const { account, library } = useActiveWeb3React();
    const approved = await isERC20ApprovedSpender(account, library, assetAddress, poolAddress, amount);
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

// scripts

const scriptVaultNames = ["ETH Options Vault", "USDC Lending Pool Vault"]
const scriptCashAddresses = [weth_address, usdc_address]

const fakeVaults = [
    {
        vaultId: 1,
        description: "ETH Options Vault",
        cash: weth_address,
        onlyVerified: false,
        r: "0",
        asset_limit: "0",
        total_asset_limit: "0",
        vaultParams: {
            N: 1,
            sigma: pp.mul(5).div(100),
            alpha: pp.mul(4).div(10),
            omega: pp.mul(2).div(10),
            delta: pp.mul(2).div(10),
            r: "0",
            s: pp.mul(2),
            steak: pp.div(4)
        }
    },
    {
        vaultId: 2,
        description: "USDC Lending Pool Vault",
        cash: usdc_address,
        onlyVerified: false,
        r: "0",
        asset_limit: "0",
        total_asset_limit: "0",
        vaultParams: {
            N: 1,
            sigma: pp.mul(5).div(100),
            alpha: pp.mul(4).div(10),
            omega: pp.mul(2).div(10),
            delta: pp.mul(2).div(10),
            r: "0",
            s: pp.mul(2),
            steak: pp.div(4)
        }
    }
]

// const fakePools = [
//     {

//     }
// ]

const ONE_BN = new BN(1).shiftedBy(18);

const fakeOptionsInstruments = [ //ETH-230116-1550-C
    {
        vaultId: 1,
        underlyingSymbol: "WETH",
        utilizer: "0x2C7Cb3cB22Ba9B322af60747017acb06deB10933",
        strikePrice: ONE_BN.multipliedBy(1600).toFixed(0),
        numContracts: 20, // long = short * pricePerContract
        pricePerContract: "0.5",
        cash: usdc_address,
        duration: new BN(7*86400).toFixed(0),
        tradeDuration: new BN(86400*2).toFixed(0), // 2 days later
        description: "test description of the options instrument"
    },
    {
        vaultId: 1,
        underlyingSymbol: "WETH",
        utilizer: "0x2C7Cb3cB22Ba9B322af60747017acb06deB10933",
        strikePrice: ONE_BN.multipliedBy(1500).toFixed(0),
        numContracts: 16,
        pricePerContract: "0.25",
        cash: usdc_address,
        duration: new BN(7*86400).toFixed(0),
        tradeDuration: new BN(2*86400).toFixed(0), // 2 days later
        description: "test description of the options instrument"
    }
]

export const ContractSetup = async (account: string, provider: Web3Provider) => {
    console.log("ContractSetup");
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    const marketManager = new Contract(market_manager_address, MarketManagerData.abi, signer);
    const vaultFactory = new Contract(vault_factory_address, VaultFactoryData.abi, signer);
    const fetcher = new Contract(fetcher_address, FetcherData.abi, signer);
    const reputationManager = new Contract(reputation_manager_address, ReputationManagerData.abi, signer);
    const cash = new Contract(usdc_address, ERC20Data.abi, signer);
    const cashFactory = new ContractFactory(CashData.abi, CashData.bytecode, provider.getSigner(account));
    const nftFactroy = new ContractFactory(TestNFTData.abi, TestNFTData.bytecode, provider.getSigner(account));
    let tx;
    console.log("market manager address: ", market_manager_address);
    // let option = new Contract("0x559c0Abf267b944E9D1D4A0D8f9Cc28320195776", CoveredCallInstrumentData.abi, signer);
    // console.log("STATIC:",await option.instrumentStaticSnapshot());
    //console.log("marketIds: ", await marketManager.getMarket(3, {gasLimit: 1000000}));
    // await fetcher.fetchInitial(controller_address, market_manager_address, 1);
    // await controller.testApproveMarket(6)

    // let data = await marketManager.getMarket(4);
    // console.log("data timestamp: ", data.creationTimestamp.toString());
    // for (let i = 1; i < 6; i ++) {
    //     let vid = await controller.id_parent(i);
    //     let vault_ad = await controller.vaults(vid);
    //     console.log("vault address: ", vault_ad)
    //     let vault = new Contract(vault_ad, VaultData.abi, signer);
    //     // await controller.getInstrumentSnapShot(i);
      
    //     let instrument = await vault.fetchInstrument(i);
    //     let instrumentData = await vault.fetchInstrumentData(i);
    //     console.log("instrument: ", instrument);
    //     console.log("instrumentData: ", instrumentData);
    //     if (instrumentData.isPool) {
    //         let pool = new Contract(instrument, PoolInstrumentData.abi, signer);
    //         console.log("ACCEPTED" ,await pool.getAcceptedCollaterals());
    //     } else {
    //         let option = new Contract(instrument, CoveredCallInstrumentData.abi, signer);
    //         console.log("STATIC:",await option.instrumentStaticSnapshot());
            
    //     }
    // }

    // await fetcher.fetchInitial(controller_address, market_manager_address, 1);
    // await getRammData(account, provider);
    // let data = await getContractData(account, provider);

    // const coveredCallContract = new Contract("0x559c0abf267b944e9d1d4a0d8f9cc28320195776", CoveredCallInstrumentData.abi, provider.getSigner(account));
    // console.log("covered call data: ", await coveredCallContract.instrumentStaticSnapshot());
    // tx = await cash.approve("0x86c6Be0BfEea130C3332017749550FF626556402", 1000);
    // await tx.wait();
    // console.log("cash allowance", await cash.allowance(account, "0x86c6Be0BfEea130C3332017749550FF626556402"));
    // console.log("numVaults", await vaultFactory.numVaults());

    // let vault_address = await controller.getVaultfromId(1);
    // let marketIds = await controller.getMarketIds(1);

    // console.log("marketIds", marketIds);
    // console.log("vault_address", vault_address);

    // let vault = new Contract(vault_address, VaultData.abi, signer);
    // let instrumentData = await vault.fetchInstrumentData(6);
    // console.log("instrumentData", instrumentData);

    // let pool = new Contract("0x14Fee7AB6A172658dAFdc6208788c1c81E7AcD0D", PoolInstrumentData.abi, signer);
    // let collaterals = await pool.getAcceptedCollaterals();
    // let collateralData = await pool.collateralData("0x2C7Cb3cB22Ba9B322af60747017acb06deB10933", 0);
    // console.log("collaterals", collateralData);

    // let token = new Contract("0xF44d295fC46cc72f8A2b7d91F57e32949dD6B249", ERC20Data.abi, signer);
    // let symbol = await token.symbol();
    // console.log("symbol", symbol);
    // console.log("collaterals", collaterals);
    // console.log("collateralData", collateralData);

    // vault.getInstrumentData();


    // tx = await reputationManager.incrementScore(account,pp); // validator
    // tx.wait();

    // tx = await reputationManager.incrementScore("0x0902B27060FB9acfb8C97688DA60D79D2EdD656e",pp); // validator
    // tx.wait();

    // tx = await reputationManager.incrementScore("0xfcDD4744d386F705cc1Fa45643535d0d649D5da2",pp); // validator
    // tx.wait();

    // tx = await controller.setMarketManager(marketManager.address);
    // await tx.wait();
    // tx = await controller.setVaultFactory(vaultFactory.address);
    // await tx.wait();
    // tx = await controller.setPoolFactory(pool_factory_address);
    // await tx.wait();
    // tx = await controller.setReputationManager(reputation_manager_address);
    // await tx.wait();
    // tx = await controller.setValidatorManager(validator_manager_address);
    // await tx.wait();
    // tx = await controller.testVerifyAddress(); 
    // await tx.wait();

    // console.log("F");

    // await scriptSetup(account, provider);
}


// creates fake vaults + associated instruments
const scriptSetup = async (account, provider) => {
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);

    for (let i = 0; i < scriptVaultNames.length; i++) {
        const { vaultId, description, onlyVerified, cash, r, asset_limit, total_asset_limit, vaultParams } = fakeVaults[i];
        await createVault(
            account, provider,
            cash,
            onlyVerified,
            r,
            asset_limit,
            total_asset_limit,
            vaultParams,
            description
        )
    }

    // for (let i=0; i < fakeOptionsInstruments.length; i++) {
    //     const { underlyingSymbol, vaultId, strikePrice, numContracts, pricePerContract, cash, duration, tradeDuration, description } = fakeOptionsInstruments[i];
    //     const vault_address = await controller.vaults(vaultId)
    //     const { instrumentAddress, response } = await createOptionsInstrument(
    //         account, provider,
    //         vault_address,
    //         strikePrice,
    //         pricePerContract,
    //         duration,
    //         numContracts,
    //         tradeDuration,
    //         cash,
    //     )

    //     let maturityDate = new Date((Date.now() / 1000 + parseInt(duration)) * 1000);
    //     let formattedDate = maturityDate.toISOString().split('T')[0]
    //     let name = `${underlyingSymbol}-${formattedDate}-${strikePrice}-C`;

    //     await createOptionsMarket(
    //         account, provider,
    //         name,
    //         description,
    //         instrumentAddress,
    //         numContracts,
    //         pricePerContract,
    //         duration,
    //         maturityDate,
    //         vaultId,
    //     )
    // }

    // await scriptAddPoolInstruments(
    //     account, provider,

    // );
    // await scriptAddOptionsInstruments();
}

const createVault = async (
    account, provider,
    underlying_address,
    onlyVerified,
    r,
    asset_limit,
    total_asset_limit,
    vaultParams,
    description
) => {
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);

    let tx = await controller.createVault(
        underlying_address,
        onlyVerified,
        r,
        asset_limit,
        total_asset_limit,
        vaultParams,
        description
    );

    tx.wait()
}

const scriptCreateOptionsInstrument = async (
    account, provider,
    onlyReputable
) => {

}

export const isValidERC20 = async (account: string, library: Web3Provider, address) => {
    // get ERC20 contract
    const erc20 = new Contract(address, ERC20Data.abi, library.getSigner(account));
    // get name
    try {
        const name = await erc20.callStatic.name();
        const symbol = await erc20.callStatic.symbol();
        const decimals = await erc20.callStatic.decimals();
        return true;
    } catch (e) {
        return false;
    }
}

export const isValidERC721 = async (account: string, library: Web3Provider, address) => {
    // get erc721 contract
    const erc721 = new Contract(address, ERC721Data.abi, library.getSigner(account));
    // get name
    try {
        const name = await erc721.callStatic.name();
        const symbol = await erc721.callStatic.symbol();
        return true;
    } catch (e) {
        return false;
    }
}