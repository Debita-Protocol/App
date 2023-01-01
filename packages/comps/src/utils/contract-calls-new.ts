import { BigNumber as BN } from "bignumber.js";
import {
    CoreMarketInfo, VaultInfos, CoreMarketInfos, InstrumentInfos, VaultInfo, CoreInstrumentData,
    CoreUserState, VaultBalances, ZCBBalances, Instrument, UserPoolData, Collateral
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
    _abi,
    _bytecode,
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

import { BigNumber, Transaction, constants, utils } from "ethers";
import { getProviderOrSigner, getSigner } from "../components/ConnectAccount/utils";

import { Contract, ContractFactory } from "@ethersproject/contracts";
import {TransactionResponse, Web3Provider } from "@ethersproject/providers";
import { isDataTooOld } from "./date-utils";
import VaultData from "../data/vault.json";
import { EthersFastSubmitWallet } from "@augurproject/smart";
import { useActiveWeb3React } from "../components/ConnectAccount/hooks";
import { formatBytes32String } from "ethers/lib/utils";
import { ContractCallContext, ContractCallResults, ContractCallReturnContext, Multicall } from "@augurproject/ethereum-multicall";


type NumStrBigNumber = number | BN | string;

// from wad to display string
function toDisplay(n: NumStrBigNumber, p: NumStrBigNumber = 18, d: number=4) {
    return new BN(n).dividedBy(new BN(10).pow(new BN(p))).decimalPlaces(d).toString();
}
const pp = BigNumber.from(10).pow(18);


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

    const tx = await controller.initiateMarket(
        account,
        instrumentData,
        vaultId
    );
    await tx.wait();
    const marketCount = await marketManager.marketCount();
    const marketId = new BN(marketCount.toString()).minus(1).toString();

    
    return marketId;
}

export const createPoolInstrument = async (
    account: string, 
    provider: Web3Provider, 
    vault: string,
    asset: string,
    name: string,
    symbol: string,
): Promise<string> => {
    console.log("poolInstrumentABI: ", PoolInstrumentData.abi);
    const poolInstrumentFactory = new ContractFactory(_abi, _bytecode, provider.getSigner(account));
    console.log("vault: ", vault);
    console.log("controller_address: ", controller_address);
    console.log("account: ", account);
    console.log("asset: ", asset);
    console.log("name: ", name);
    console.log("symbol: ", symbol);
    console.log("variable_interest_rate_address: ", variable_interest_rate_address);

    // const poolInstrument = await poolInstrumentFactory.deploy(  
    //     vault,
    //     controller_address,
    //     account,
    //     asset,
    //     name,
    //     symbol,
    //     variable_interest_rate_address,
    //     []
    // );
    // await poolInstrument.deployed();
    // console.log("poolInstrument deployed to:", poolInstrument.address);
    // return poolInstrument.address;
    return "string";
}

export const addAcceptedCollaterals = async (
    account: string,
    provider: Web3Provider,
    marketId: string,
    collateralItems: CollateralItem[] // not in wad format yet
) => {
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    
    const multicall = new Multicall({ ethersProvider: provider });

    const calls = collateralItems.map((item, i) => {
        return {
            reference: "Call " + i,
            methodName: "addAcceptedCollateral",
            methodParameters: [
                marketId,
                item.tokenAddress,
                item.isERC20 ? 0 : item.tokenId,
                new BN(item.maxAmount).shiftedBy(18).toFixed(),
                new BN(item.borrowAmount).shiftedBy(18).toFixed(),
                item.isERC20
            ]
        }});


    const contractCallContext: ContractCallContext[] = [
        {
            reference: "Controller",
            contractAddress: controller_address,
            abi: ControllerData.abi,
            calls
        }
    ]

    const results: ContractCallResults = await multicall.call(contractCallContext);

    console.log("done");
}


interface CollateralItem {
    tokenAddress: string;
    tokenId: string;
    borrowAmount: string;
    maxAmount: string;
    isERC20: boolean;
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
    const assetToMint = (await vault.convertToAsset(initialStake)).toString();
    const cash = new Contract(cash_address, ERC20Data.abi, signer);
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
}

export const testResolveMarket = async (account: string, provider: Web3Provider, marketId: string) => {
    const signer = getSigner(provider, account);
    const controller = new Contract(controller_address, ControllerData.abi, signer);
    let tx = await controller.testResolveMarket(marketId);
    await tx.wait();
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
    let tx;

    // const variableInterestRateFactory = new ContractFactory(VariableInterestRateData.abi, VariableInterestRateData.bytecode, provider.getSigner(account));
    // const variableInterestRate = await variableInterestRateFactory.deploy();
    // console.log("variableInterestRate", variableInterestRate.address);

    // tx = await reputationManager.incrementScore("0x0902B27060FB9acfb8C97688DA60D79D2EdD656e",pp); // validator
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
    
    // tx = await controller.initiateMarket(
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
    //             initPrice: 0,
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
    // console.log("A")

    const numVaults = await vaultFactory.numVaults();
    console.log("numVaults: ", numVaults.toNumber());
    let vaults: VaultInfos = {};
    let markets: CoreMarketInfos = {};
    let instruments: InstrumentInfos = {};

    for (let i = 1; i < numVaults.toNumber()+1; i++) {
        console.log("B")
        const { vaultBundle, marketBundle, instrumentBundle, timestamp } = await fetcher.fetchInitial(
            controller_address, 
            market_manager_address,
            i
        );
        console.log("C");
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
                    validatorData,
                    marketConditionMet: m.marketConditionMet,
                    initialLongZCBPrice: toDisplay(m.initialLongZCBPrice.toString())
                }
            );

            let instr = instrumentBundle[j];
            let poolData = {} as any;
            let instrument: Instrument = Object.assign(
                {},
                {
                    name: instr.name,
                    marketId: instr.marketId.toString(),
                    vaultId: instr.vaultId.toString(),
                    utilizer: instr.utilizer,
                    trusted: instr.trusted,
                    description: instr.description,
                    balance: toDisplay(instr.balance.toString()),
                    principal: toDisplay(instr.principal.toString()),
                    yield: toDisplay(instr.expectedYield.toString()),
                    address: instr.instrument_address,
                    duration: instr.duration.toString(),
                    maturityDate: instr.maturityDate.toString(),
                    seniorAPR: toDisplay(instr.seniorAPR.toString()),
                    exposurePercentage: toDisplay(instr.exposurePercentage.toString()),
                    managerStake: toDisplay(instr.managerStake.toString()),
                    approvalPrice: toDisplay(instr.approvalPrice.toString()),
                }
            )

            if (instr.isPool) {
                let l = instr.poolData.collaterals.length;
                let collaterals: Collateral[] = [];
                for (let z=0; z < l; z++) {
                    let _c = instr.poolData.collaterals[z];
                    let c = Object.assign({}, {
                        address: _c.tokenAddress,
                        tokenId: _c.tokenId,
                        name: _c.name,
                        symbol: _c.symbol,
                        isERC20: _c.isERC20,
                        decimals: _c.decimals,
                        borrowAmount: toDisplay(_c.borrowAmount.toString()),
                        maxAmount: toDisplay(_c.maxAmount.toString()),
                    })
                    collaterals.push(c);
                }
                instrument = Object.assign(
                    instrument,
                    {
                        saleAmount: toDisplay(instr.poolData.saleAmount.toString()),
                        initPrice: toDisplay(instr.poolData.initPrice.toString()),
                        promisedReturn: toDisplay(instr.poolData.promisedReturn.toString()),
                        inceptionTime: instr.poolData.inceptionTime.toString(),
                        inceptionPrice: toDisplay(instr.poolData.inceptionPrice.toString()),
                        poolLeverageFactor: toDisplay(instr.poolData.leverageFactor.toString()),
                        managementFee: toDisplay(instr.poolData.managementFee.toString()),
                        pju: toDisplay(instr.poolData.pju.toString()),
                        psu: toDisplay(instr.poolData.psu.toString()),
                        totalBorrowedAssets: toDisplay(instr.poolData.totalBorrowedAssets.toString()),
                        totalSuppliedAssets: toDisplay(instr.poolData.totalSuppliedAssets.toString()),
                        APR: toDisplay(instr.poolData.APR.toString()),
                        collaterals
                    }
                )
            }

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
    console.log("reputationScore", reputationScore);

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
    const faceValue = new BN(principal).plus(new BN(expectedYield)).toString();
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

// export const getUserPoolData = async (
//     account: string, 
//     provider: Web3Provider,
//     instrument_address: string,
//     collaterals: Collateral[]
//     ): Promise<UserPoolData> => {
    
// }


/// POOL ACTIONS

export const useIsERC20ApprovedSpender = async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string
): Promise<boolean> => {
    const { account, library } = useActiveWeb3React();

    
    return useMemo(async () => {
        const token = new Contract(tokenAddress, ERC20Data.abi, getProviderOrSigner(library, account));
        const decimals = await token.decimals();
        const allowance = await token.allowance(account, spenderAddress);
        return allowance && new BN(allowance.toString()).gt(new BN(amount).shiftedBy(decimals.toString())) ? true : false;
    }, [account, library, tokenAddress, spenderAddress]);
}

export const useIsERC721ApprovedSpender = async (
    tokenAddress: string,
    tokenId: string,
    spenderAddress: string
): Promise<boolean> => {
    const { account, library } = useActiveWeb3React();
    
    return useMemo(async () => {
        const token = new Contract(tokenAddress, ERC721Data.abi, getProviderOrSigner(library, account));
        const approval = await token.getApproved(tokenId);
        return approval === spenderAddress ? true : false;
    }, [account, library, tokenAddress, spenderAddress]);
}

export const approveERC20 = async (
    tokenAddress: string,
    amount: string,
    spenderAddress: string
): Promise<TransactionResponse> => {
    const { account, library } = useActiveWeb3React();
    const token = new Contract(tokenAddress, ERC20Data.abi, getSigner(library, account));
    const decimals = await token.decimals();
    const tx: TransactionResponse = await token.approve(spenderAddress, new BN(amount).shiftedBy(decimals).toString());
    tx.wait();
    return tx;
}

export const approveERC721 = async (
    tokenAddress: string,
    tokenId: string,
    spenderAddress: string
): Promise<TransactionResponse> => {
    const { account, library } = useActiveWeb3React();
    const token = new Contract(tokenAddress, ERC721Data.abi, getSigner(library, account));
    const tx: TransactionResponse = await token.approve(spenderAddress, tokenId);
    tx.wait();
    return tx;
}

export const addPoolCollateral = async (
    tokenAddress: string,
    tokenId="0",
    amount: string,
    poolAddress: string,
    isERC20: boolean,
    decimals?: number // decimals of collaterl token
) => {
    const { account, library } = useActiveWeb3React();
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    if (isERC20) {
        const approved = await useIsERC20ApprovedSpender(tokenAddress, poolAddress, amount);
        if (!approved) {
            await approveERC20(tokenAddress, amount, poolAddress);
        }
    } else {
        const approved = await useIsERC721ApprovedSpender(tokenAddress, tokenId, poolAddress);
        if (!approved) {
            await approveERC721(tokenAddress, tokenId, poolAddress);
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
    tokenAddress: string,
    tokenId="0",
    amount="0",
    poolAddress: string,
    decimals?: number
) => {
    const { account, library } = useActiveWeb3React();
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
    amount: string,
    decimals: number,
    poolAddress: string
) => {
    const { account, library } = useActiveWeb3React();
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    const tx: TransactionResponse = await pool.borrow(
        new BN(amount).shiftedBy(decimals).toString(),
        0,
        0,
        0,
        account
    );
    tx.wait();
    return tx;
}


// repay is not ready yet.
export const poolRepay = async (
    amount: string,
    decimals: number,
    poolAddress: string
) => {
    const { account, library } = useActiveWeb3React();
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    const tx: TransactionResponse = await pool.repay(
        new BN(amount).shiftedBy(decimals).toString()
    );
    tx.wait();
    return tx;
}

export const poolAddInterest = async (
    poolAddress: string
) => {
    const { account, library } = useActiveWeb3React();
    const pool = new Contract(poolAddress, PoolInstrumentData.abi, getSigner(library, account));
    const tx: TransactionResponse = await pool.addInterest();
    tx.wait();
    return tx;
}