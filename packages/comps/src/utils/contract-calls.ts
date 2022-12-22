import { BigNumber as BN } from "bignumber.js";
import {
  AddRemoveLiquidity,
  AllMarketsTransactions,
  AllUserMarketTransactions,
  AmmExchange,
  AmmExchanges,
  AmmMarketShares,
  AmmOutcome,
  BuySellTransactions,
  Cash,
  Cashes,
  ClaimWinningsTransactions,
  CurrencyBalance,
  EstimateTradeResult,
  LiquidityBreakdown,
  LPTokenBalance,
  LPTokens,
  MarketFactoryNames,
  MarketInfo,
  MarketInfos,
  MarketTransactions,
  PendingUserReward,
  PositionBalance,
  RewardsInfo,
  UserBalances,
  UserClaimTransactions,
  UserMarketTransactions,
  VaultInfo,
  VaultInfos,
  CoreMarketInfo, 
  CoreInstrumentData, 
  CorePoolData
} from "../types";
import { ethers, Transaction } from "ethers";
import { Contract } from "@ethersproject/contracts";
import {addresses, 
  //LinearBondingCurve__factory 
} from "@augurproject/smart";

// @ts-ignore
import { ContractCallContext, ContractCallReturnContext, Multicall } from "@augurproject/ethereum-multicall";
import { TransactionResponse, Web3Provider } from "@ethersproject/providers";
import {
  cashOnChainToDisplay,
  convertDisplayCashAmountToOnChainCashAmount,
  convertDisplayShareAmountToOnChainShareAmount,
  convertOnChainCashAmountToDisplayCashAmount,
  isSameAddress,
  lpTokenPercentageAmount,
  lpTokensOnChainToDisplay,
  sharesDisplayToOnChain,
  sharesOnChainToDisplay,
} from "./format-number";
import {
  DAYS_IN_YEAR,
  DUST_LIQUIDITY_AMOUNT,
  DUST_POSITION_AMOUNT,
  DUST_POSITION_AMOUNT_ON_CHAIN,
  ETH,
  MARKET_FACTORY_TYPES,
  MARKET_LOAD_TYPE,
  MARKET_STATUS,
  NULL_ADDRESS,
  SEC_IN_DAY,
  SPORTS_MARKET_TYPE,
  TradingDirection,
  USDC,
  ZERO,
  POLYGON_NETWORK,
  POLYGON_PRICE_FEED_MATIC,
  MAX_LAG_BLOCKS,
  WMATIC_TOKEN_ADDRESS,
  REWARDS_AMOUNT_CUTOFF
} from "./constants";
import { getProviderOrSigner, getSigner } from "../components/ConnectAccount/utils";
import { createBigNumber } from "./create-big-number";
import { PARA_CONFIG } from "../stores/constants";
import ERC20ABI from "./ERC20ABI.json";
import ParaShareTokenABI from "./ParaShareTokenABI.json";
import PriceFeedABI from "./PriceFeedABI.json";
//import { addresses } from "@augurproject/smart";

import {
  Controller__factory, 
  Cash__factory,
  MarketFactory,
  ERC20__factory,
  Vault__factory,
  // VaultFactory__factory,
  Instrument__factory, 
  Instrument, 
  MarketManager__factory,
  ReputationNFT__factory,
  CreditLine__factory,
  CreditLine,
  // BondingCurve, 
  // BondingCurve__factory, 
  Fetcher__factory,
  Vault

} from "@augurproject/smart";
import { fetcherMarketsPerConfig, isIgnoredMarket, isIgnoreOpendMarket } from "./derived-market-data";
import { getDefaultPrice } from "./get-default-price";
import {approveERC20Contract} from "../stores/use-approval-callback";
import {
  TrustedMarketFactoryV3Address,
  
  settlementAddress, 
  dsAddress, 
  controller_address,
  ammFactoryAddress,
  indexCDSAddress, 
  collateral_address,
  vault_factory_address,

  Vault_address, 
  market_manager_address,
  RepNFT_address,
  marketFactoryAddress,
  fetcher_address,
  rep_token_address, 
  cash_address, 
  pool_factory_address, 
  creditLine_address, 
} from "../data/constants";


import {BigNumber, BigNumberish, utils} from "ethers"
import { Loan, InstrumentData} from "../types"
import createIdentity from "@interep/identity"
import createProof from "@interep/proof"
import tlensabi from "../data/TrustedMarketFactoryV3.json"; 

import controllerabi from "../data/controller.json" ; 
import cashabi from "../data/cash.json"; 
import vaultabi from "../data/vault.json"; 
import marketmanagerabi from "../data/marketmanager.json"; 



const pp = BigNumber.from(10).pow(18);
const { parseBytes32String, formatBytes32String } = utils;



export interface CoreInstrumentData_ {
  marketId: string;
  trusted: boolean;
  isPool: boolean;
  balance: string;
  faceValue: BigNumberish;
  principal: BigNumberish;
  expectedYield: BigNumberish;
  duration: BigNumberish;
  description: string;
  Instrument_address: string;
  instrument_type: number;
  maturityDate: string;
  poolData?: CorePoolData;
}

// export interface NFT {
//   name: string,
//   symbol: string,
//   tokenURI: string,
//   address: string,
//   maxLTV: string,
//   APY: string
// };

// // can make more modular in future
export interface CorePoolData_ {
  saleAmount: string;
  initPrice: string;
  promisedReturn: string;
  inceptionTime: string;
  inceptionPrice: string;
  leverageFactor: string;
  managementFee: string; 
  
}

export async function setUpTestManager(
  account: string, 
  library: Web3Provider
  ) {
  const controller = new ethers.Contract(controller_address,
    controllerabi["abi"], getProviderOrSigner(library, account)
    );
  await controller.testVerifyAddress(); 
  await controller._incrementScore(account, pp); 

}

export async function tradeZCB(
  account: string,
  library: Web3Provider, 
  marketId: string, 
  amount: string, 
  long: boolean, 
  close: boolean, 
  underlyingAddress: string = ""
  ): Promise<TransactionResponse>{
  const controller = new ethers.Contract(controller_address,
    controllerabi["abi"], getProviderOrSigner(library, account)
    );
  // await controller.testVerifyAddress(); 
  // await controller._incrementScore(account, pp.mul(10)); 
  await controller._incrementScore("0x4D53611dd18A1dEAceB51f94168Ccf9812b3476e", pp); 

  if (underlyingAddress=="") underlyingAddress = cash_address; 

  const collateral = new ethers.Contract(underlyingAddress, cashabi["abi"], getProviderOrSigner(library, account)); 
  const marketmanager = new ethers.Contract(market_manager_address, 
    marketmanagerabi["abi"], getProviderOrSigner(library, account));
  const scaledAmount = pp.mul(amount); 
  if (long){
    const budget = await marketmanager.getTraderBudget(marketId, account); 
    console.log('budget', budget.toString()); 

    // await (await collateral.approve(market_manager_address, scaledAmount)).wait(); 
    await marketmanager.buyBond(marketId, scaledAmount, pp.mul(100), 0); 

  }
  else{

  }
  let tx; 
  return tx; 

}


export async function setUpExampleController(account: string, library: Web3Provider){
  interface DefaultParams {
    N: string;
    sigma: BigNumberish;
    alpha: BigNumberish; 
    omega: BigNumberish; 
    delta: BigNumberish; 
    r: string; 
    s: BigNumberish; 
    steak: BigNumberish; 
  }
  const params = {} as DefaultParams; 

  const controller = new ethers.Contract(controller_address,
    controllerabi["abi"], getProviderOrSigner(library, account)
    );
  params.N = "1"; 
  params.sigma = pp.mul(5).div(100); 
  params.alpha = pp.mul(4).div(10); 
  params.omega = pp.mul(2).div(10);
  params.delta = pp.mul(2).div(10); 
  params.r = "0"; 
  params.s = pp.mul(2);
  params.steak = pp.div(4); 

  await controller.setMarketManager(market_manager_address);
  await controller.setVaultFactory(vault_factory_address);
  await controller.setPoolFactory(pool_factory_address); 
  // await (await controller.setMarketManager(market_manager_address)).wait();
  // console.log("A")
  // await (await controller.setVaultFactory(vault_factory_address)).wait();
  // console.log("B")
  // await (await controller.setReputationNFT(rep_token_address)).wait();
  // console.log("Completed Reputation")

  await controller.createVault(
    cash_address, 
    false, 0, pp.mul(10000000000), pp.mul(10000000000), params
  )

}

export async function addProposal(  // calls initiate market
  account: string, 
  library: Web3Provider,
  faceValue: string = "11000", 
  principal: string= "10000", 
  expectedYield: string= "1000", // this should be amount of collateral yield to be collected over the duration, not percentage
  duration: string = "100", 
  description: string= "Test Description", 
  Instrument_address: string = creditLine_address, //need to have been created before
  instrument_type: number = 0, 
  vaultId: string = "1"
  ): Promise<TransactionResponse> {
  const controller = new ethers.Contract(controller_address,
    controllerabi["abi"], getProviderOrSigner(library, account)
    );


  const data = {} as CoreInstrumentData_; 
  const pooldata = {} as CorePoolData_; 
  data.isPool = false; 
  data.trusted = false; 
  data.balance = new BN(0).toFixed(); 
  data.faceValue = pp.mul(faceValue); //new BN(faceValue).shiftedBy(decimals).toFixed(); 
  data.marketId = "0"; //new BN(0).toFixed(); 
  data.principal = pp.mul(principal); //new BN(principal).shiftedBy(decimals).toFixed(); 
  data.expectedYield = pp.mul(expectedYield);//new BN(expectedYield).shiftedBy(decimals).toFixed(); 
  data.duration = duration//new BN(duration).toString(); 
  data.description = description;
  data.Instrument_address = Instrument_address; //sample_instument_address;
  data.instrument_type = instrument_type;
  data.maturityDate = String(0);

  pooldata.saleAmount = "0"
  pooldata.initPrice = "0"
  pooldata.promisedReturn = "0"
  pooldata.inceptionTime = "0"
  pooldata.inceptionPrice = "0"
  pooldata.leverageFactor = "0"
  pooldata.managementFee = "0"
  data.poolData = pooldata; 
  console.log('account', account, Instrument_address); 
  await controller.initiateMarket(account, data, vaultId)
  // export interface CorePoolData {
//   saleAmount: string;
//   initPrice: string;
//   promisedReturn: string;
//   inceptionTime: string;
//   inceptionPrice: string;
//   leverageFactor: string;
//   APR?: string;
//   NFTs?: NFT[];
// }
  // const id = await controller.getMarketId(account); 
  // console.log('id', id, data); 
  // // const credit_line_address = await createCreditLine(account, library, principal, expectedYield, duration, faceValue ); 
  // // console.log('creation', credit_line_address); 

  // const tx = await controller.initiateMarket(account, data, vaultId).catch((e) => {
  //     console.error(e);
  //     throw e;
  //   }); 
  let tx; 
    return tx; 
}

export const faucetUnderlying = async (account: string, library: Web3Provider) => {
  const collateral = new ethers.Contract(cash_address, cashabi["abi"], getProviderOrSigner(library, account)); 
  await collateral.faucet(pp.mul(100000)); 
  // const { marketFactories } = PARA_CONFIG;
  // const usdcContract = marketFactories[0].collateral;
  // const amount = ethers.BigNumber.from(10).pow(10); // 10k
  // const collateral = Cash__factory.connect(usdcContract, getProviderOrSigner(library, account));
  // await collateral.faucet(String(amount));
};

export async function redeemVault(
  account: string,
  library: Web3Provider,
  vaultId: string, 
  redeemAmount: string //in shares
  // not_faucet: boolean = false
  ){
  const controller = new ethers.Contract(controller_address,
    controllerabi["abi"], getProviderOrSigner(library, account)
    );
  const vaultAd = await controller.getVaultfromId(vaultId); 
  const vault = new ethers.Contract(vaultAd, vaultabi["abi"], getProviderOrSigner(library, account)); 
  const scaledAmount = pp.mul(redeemAmount);
   
  await vault.redeem(scaledAmount, account, account); 
}


export async function mintVaultDS(
  account: string,
  library: Web3Provider,
  vaultId: string, 
  depositAmount: string = "0" 
  // not_faucet: boolean = false
  ) {

  const collateral = new ethers.Contract(cash_address, cashabi["abi"], getProviderOrSigner(library, account)); 
  const controller = new ethers.Contract(controller_address,
    controllerabi["abi"], getProviderOrSigner(library, account)
    );
  console.log('colla', collateral, controller, vaultId); 
  const vaultAd = await controller.getVaultfromId(vaultId); 
  console.log('vaultad,', vaultAd); 

  const vault = new ethers.Contract(vaultAd, vaultabi["abi"], getProviderOrSigner(library, account)); 
  const scaledAmount = pp.mul(depositAmount); 

  await collateral.approve(vaultAd, scaledAmount); 
  await vault.deposit(scaledAmount, account); 

  // const collateral = Cash__factory.connect(collateral_address, library.getSigner(account));
  // const decimals = await collateral.decimals()
  // const vault = Vault__factory.connect(Vault_address, library.getSigner(account)); 
  // const amount = not_faucet? new BN(shares_amount).shiftedBy(decimals).toFixed() : new BN(100000).shiftedBy(6).toFixed(); 
  // console.log('mintamount', amount); 

  // console.log((await collateral.callStatic.increaseAllowance(Vault_address, amount)));
  // let tx = await collateral.increaseAllowance(Vault_address, amount).catch(
  //   (e) => {
  //     console.error("allowance error", e);
  //     throw e;
  //   }
  // );; 
  // tx.wait(1);
  // console.log("tx: ", tx);

  // let allowance = await collateral.allowance(account, Vault_address);
  // console.log("allowance: ", allowance.toString());

  // console.log("desposit result: ", (await vault.callStatic.deposit(amount, account)).toString());
  // let tx2 = await vault.deposit(amount, account);
  // tx2.wait(6);
  // const balance = await vault.balanceOf(account);
  // console.log("VT balance: ", balance.toString())

  
} 

export async function redeemVaultDS(
  account: string,
  library: Web3Provider,
  redeem_amount: string = "0", //in shares 
  not_faucet: boolean = true

) {
  const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account))
  const decimals = await collateral.decimals()

  const amount = not_faucet? new BN(redeem_amount).shiftedBy(decimals).toFixed() : new BN(100000).shiftedBy(6).toFixed(); 
  const vault = Vault__factory.connect(Vault_address, getProviderOrSigner(library, account) ); 
  await vault.redeem(amount, account, account); 

}

const trimDecimalValue = (value: string | BN) => createBigNumber(value).decimalPlaces(6, 1).toFixed();

// ONLY FOR TESTING.
// export async function setupContracts(account: string, library: Web3Provider) {

//   const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account));
//   const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account));
//   const market_manager = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account));
//   const vault_factory = VaultFactory__factory.connect(vault_factory_address, getProviderOrSigner(library, account));
//   const rep_token = ReputationNFT__factory.connect(rep_token_address, getProviderOrSigner(library, account));

//   const pp = BigNumber.from(10).pow(18);

//   const principal = 1000;
//   const drawdown = 5000000; 
//   const interestAPR = 100; 
//   const duration = 1; 
//   const faceValue = 1100;
//   const vault_ad = await controller.getVaultfromId(1); 
//   console.log("vault address: ", vault_ad);

//   let vault = Vault__factory.connect(vault_ad, getProviderOrSigner(library, account)) as Vault; 

//   let creditline_factory = new CreditLine__factory(getSigner(library, account));

//   console.log("vault addr: ", vault_ad)
//   console.log("account ", account)
//   console.log("collateral: ", collateral.address)

//   let data = {} as any;
//   data.trusted = false; 
//   data.balance = pp.mul(0).toString();
//   data.faceValue = pp.mul(faceValue).toString();
//   data.marketId = pp.mul(0).toString(); 
//   data.principal = pp.mul(principal).toString();
//   data.expectedYield = pp.mul(interestAPR).toString();
//   data.duration = pp.mul(duration).toString();
//   data.description = "test";
//   data.Instrument_address = collateral.address;
//   data.instrument_type = String(0);
//   data.maturityDate = String(10);

//     let tx = await controller.initiateMarket(account, data, 1);

//     await tx.wait();
//     console.log("success");

  // interface DefaultParams {

  //   N: string;
  //   sigma: BigNumberish;
  //   alpha: BigNumberish; 
  //   omega: BigNumberish; 
  //   delta: BigNumberish; 
  //   r: string; 
  //   s: BigNumberish; 
  
  // }
  // const params = {} as DefaultParams; 

  // params.N = "1"; 
  // params.sigma = pp.mul(5).div(100); 
  // params.alpha = pp.mul(4).div(10); 
  // params.omega = pp.mul(2).div(10);
  // params.delta = pp.mul(2).div(10); 
  // params.r = "10"; 
  // params.s = pp.mul(2);

  // await controller.createVault(
  //   collateral.address, 
  //   false, 1, 0, 0, params
  // )

  // await (await controller.setMarketManager(market_manager.address)).wait();
  // console.log("A")
  // await (await controller.setVaultFactory(vault_factory.address)).wait();
  // console.log("B")
  // await (await controller.setReputationNFT(rep_token.address)).wait();
  // console.log("Completed Reputation")


// }

// NEW STUFF BELOW

interface InstrumentData_ {
  trusted: boolean; 
  balance: BigNumberish; 
  faceValue: BigNumberish;
  marketId: string; 
  principal: BigNumberish; 
  expectedYield: BigNumberish; 
  duration: string;
  description: string; 
  Instrument_address: string; 
  instrument_type: string;
  maturityDate: string;
}; 

export async function getMarketData(
  account: string,
  loginAccount: Web3Provider
) {
  
}

// export async function getAddresses()

export async function getERCBalance(
  account: string, 
  library: Web3Provider, 
  address: string) : Promise<string>{
  return (await ERC20__factory.connect(address, getProviderOrSigner(library, account)).balanceOf(account)).toString();
}
// export async function estimateZCBBuyTrade(
//   account: string,
//   library: Web3Provider,
//   marketId: string,
//   inputDisplayAmount: string,
//   selectedOutcomeId: number,
//   cash: Cash
// ): Promise<EstimateTradeResult>  {
//   const amount = convertDisplayCashAmountToOnChainCashAmount(inputDisplayAmount, cash.decimals)
//     .decimalPlaces(0, 1)
//     .toFixed();
  
//   const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
//   const bc_ad = await controller.getZCB_ad(marketId);
//   const bc = BondingCurve__factory.connect(bc_ad, getProviderOrSigner(library, account)); 

//   //how much I get from this vault amount
//   console.log(inputDisplayAmount, amount)
//   const estimatedShares_ = await bc.calculatePurchaseReturn(amount); 
//   // console.log('est', estimatedShares_.toString())
//   var estimatedShares = estimatedShares_.toString(); 
//   const averagePrice_ = await bc.calcAveragePrice(estimatedShares);
//   // console.log('avg', averagePrice_.toString())

//   const tradeFees = "0";  //APR 
//   estimatedShares = new BN(estimatedShares).div(10**18).toFixed(4); 
//   const averagePrice = new BN(averagePrice_.toString()).div(10**18).toFixed(4);
//   //const maxProfit = (new BN(estimatedShares).minus(new BN(amount))); 
//   const maxProfit =  (1 - Number(averagePrice))* Number(estimatedShares)
//   //const maxProfit = "1";
//   const priceImpact = "1";
//   const ratePerCash = "1";
//   return {
//     outputValue: estimatedShares,
//     tradeFees,
//     averagePrice: averagePrice,//.tofixed(4),
//     maxProfit: String(maxProfit),
//     ratePerCash,
//     priceImpact,
//   };
// };

// export async function estimateZCBShortTrade(
//   account: string,
//   library: Web3Provider,
//   marketId: string,
//   inputDisplayAmount: string,
//   selectedOutcomeId: number,
//   cash: Cash
// ): Promise<EstimateTradeResult> {
//   const amount = convertDisplayCashAmountToOnChainCashAmount(inputDisplayAmount, cash.decimals)
//     .decimalPlaces(0, 1)
//     .toFixed();
  
//   const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
//   const sbc_ad = await controller.getshortZCB_ad(marketId);
//   const sbc = LinearShortZCB__factory.connect(sbc_ad, getProviderOrSigner(library, account)); 

//   const output = await calculateAveragePrice(amount); 
//   const average_price_ = output[0];
//   const estimatedShares_ = output[1]; 
//   // const average_price_ = await calculateAveragePrice(amount); 
//   // const estimatedShares_ = await calculateAmountGivenSell(amount); 

//   const average_price = new BN(averagePrice_.toString()).div(10**18).toFixed(4);
//   const estimatedShares = new BN(estimatedShares_).div(10**18).toFixed(4); 

//   const tradeFees = "0"; 
//   const maxProfit = (1-Number(averagePrice)) * Number(estimatedShares); 
//   const priceImpact = "1";
//   const ratePerCash = "1";
//   return {
//     outputValue: estimatedShares,
//     tradeFees,
//     averagePrice: averagePrice,//.tofixed(4),
//     maxProfit: String(maxProfit),
//     ratePerCash,
//     priceImpact,
//   };


// }; 



export async function createCreditLine(
  account: string, 
  library: Web3Provider,
  principal: string, // decimal format
  interestAPR: string,
  duration: string, // in seconds.
  faceValue: string
): Promise<string> {
  const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account));
  const decimals = await collateral.decimals(); 

  let creditLineF = new CreditLine__factory(library.getSigner(account));
  console.log('creditlinef', creditLineF); 

  const _principal = new BN(principal).shiftedBy(decimals).toFixed()
  const _interestAPR = new BN(interestAPR).shiftedBy(decimals).toFixed()
  const _faceValue = new BN(faceValue).shiftedBy(decimals).toFixed()

  console.log(account)
  // let creditLine = await creditLineF.deploy(
  //   Vault_address,
  //   account,
  //   _principal,
  //   _interestAPR,
  //   duration,
  //   _faceValue
  // ).catch((e) => {
  //   console.error(e);
  //   throw e;
  // });
  // creditLine = await creditLine.deployed();
  // console.log("here");

  // return creditLine.address;
  return "0x0";
}

export async function canBuy(
  account: string, 
  library: Web3Provider
  ): Promise<boolean>{
  //const marketmanager = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account)); 
  //marketmanager.canBuy()
  return true; 
}
export async function getHedgePrice(
  account: string, 
  provider:Web3Provider,
  marketId: string): Promise<string>{
  const marketmanager = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(provider, account)); 
  const hedgePrice = await marketmanager.getHedgePrice( marketId); 
  return hedgePrice.toString(); 
}
// export async function getTotalCollateral(
//   account: string, 
//   library: Web3Provider, 
//   marketId: string
//   ): Promise<string>{
//   const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
//   const bc_ad = await controller.getZCB_ad(marketId);
//   const bc = BondingCurve__factory.connect(bc_ad, getProviderOrSigner(library, account))
//   const total_collateral = await bc.getTotalCollateral()
//   return total_collateral.toString(); 
// }

export async function getInstrumentData_(
  account: string, 
  library: Web3Provider, 
  marketId: string
  ): Promise<any>{

  const vault = Vault__factory.connect(Vault_address,getProviderOrSigner(library, account) ); 
  const instrument_data = await vault.fetchInstrumentData(marketId); 
  return instrument_data; 
}

  // function getHedgeQuantity(address trader, uint256 marketId) public view returns(uint256){
  //   uint256 principal = controller.vault().fetchInstrumentData(marketId).principal; 
  //   uint256 holdings =  controller.vault().balanceOf(trader);
  //   uint256 marketCap = controller.vault().totalSupply(); 
  //   uint num = (principal * (PRICE_PRECISION - INSURANCE_CONSTANT)/PRICE_PRECISION) * holdings; 
  //   return num/marketCap; 
  // } 

export async function getTraderBudget(
  account: string,
  library: Web3Provider,
  marketId: string
): Promise<string>{
  const marketmanager = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account)); 
  const budget = await marketmanager.getTraderBudget(marketId, account); 
  return budget.toString(); 
}

export async function getMarketId(
  account: string,
  library: Web3Provider
): Promise<string> {
  const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account));
  let id = await controller.ad_to_id(account);
  return id.toString();
}

export async function getHedgeQuantity(
  account: string,
  library: Web3Provider, 
  marketId: string, 
): Promise<string>{
  const marketmanager = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account)); 
  const hedgeQuantity = await marketmanager.getHedgeQuantity(account, marketId);

  return hedgeQuantity.toString(); 
}
// export async function getBondingCurveContract(
//   account: string, 
//   library : Web3Provider, 
//   marketId: string
//   ): Promise<BondingCurve>{
//   const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
//   const bc_ad = await controller.getZCB_ad(marketId);
//   const bc = BondingCurve__factory.connect(bc_ad, getProviderOrSigner(library, account)) as BondingCurve
//   return bc; 
// }
// export async function isMarketActive(
//   account:string, 
//   library: Web3Provider, 
//   marketId: string
//   )
// export async function getBondingCurvePrice(
//   account: string, 
//   library: Web3Provider, 
//   marketId: string
//   ): Promise<any>{
//   const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
//   const bc_ad = await controller.getZCB_ad(marketId);
//   const bc = BondingCurve__factory.connect(bc_ad, getProviderOrSigner(library, account)); 
//   //const bc = getBondingCurveContract(account, library, marketId) as BondingCurve; 
//   const price =  await bc.calculateExpectedPrice(0); 
//   const totalsupply = await bc.getTotalZCB(); 
//   return price.toString(); 
// }
export async function doOwnerSettings(
  account: string,
  library: Web3Provider
  ): Promise<TransactionResponse>{
    const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
    await controller.setMarketManager(market_manager_address);
    await controller.setVault(Vault_address);
    //await mintVaultDS(account, library); 
    const tx = await controller.setMarketFactory(marketFactoryAddress);
    return tx; 
}
export async function resolveZCBMarket(
  account:string, 
  library: Web3Provider, 
  marketId: string = "7", 
  atLoss: boolean = false, 
  extra_gain: string ="0", 
  principal_loss: string = "0"
  ){
  const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
  // await controller.resolveMarket(marketId, atLoss, extra_gain, principal_loss); 
}



export async function isUtilizerApproved(account: string, library: Web3Provider):Promise<boolean> {
  const Instrument = await getInstrument(account, library);  
  const vault = Vault__factory.connect(Vault_address,getProviderOrSigner(library, account) ); 

  const isApproved = await vault.isTrusted(Instrument.address); 
  return isApproved; 
}

// export async function validator_approve_market(
//   account: string, 
//   library: Web3Provider,
//   marketId: string
// ) : Promise<TransactionResponse> {
  
// }

export const getInstrument = async(
  account: string, 
  library: Web3Provider
  ): Promise<Instrument> =>{
  const vault = Vault__factory.connect(Vault_address, getProviderOrSigner(library, account) ); 
  const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
  const marketId = await controller.getMarketId(account); 
  const data = await vault.fetchInstrumentData( marketId); 
  const Instrument_address = data.Instrument_address; 
  return Instrument__factory.connect(Instrument_address, getProviderOrSigner(library, account));
}; 

export const vaultHarvest = async (
  account: string,
  library: Web3Provider,
  instrument_address: string
): Promise<TransactionResponse> => {
  const vault = Vault__factory.connect(Vault_address, getProviderOrSigner(library, account) ); 
  return vault.harvest(instrument_address);
}

export const getFormattedInstrumentData = async (
  account:string,
  library: Web3Provider
): Promise<InstrumentData_> => {
  const vault = Vault__factory.connect(Vault_address, getProviderOrSigner(library, account) ); 
  const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
  const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account))
  const decimals = await collateral.decimals()
  const marketId = await controller.getMarketId(account); 
  let data = await vault.fetchInstrumentData(marketId);

  let result = {
    trusted: false,
    balance: "",
    faceValue: "",
    marketId: "",
    principal: "",
    expectedYield: "",
    duration: "",
    description: "",
    Instrument_address: "",
    instrument_type: "",
    maturityDate: ""
  }
  result.trusted = data.trusted;
  result.Instrument_address = data.Instrument_address
  result.description = data.description
  result.instrument_type = data.instrument_type.toString()
  result.marketId = data.marketId.toString()
  result.balance = new BN(data.balance.toString()).div(10**decimals).toString()
  result.faceValue = new BN(data.faceValue.toString()).div(10**decimals).toString()
  result.principal = new BN(data.principal.toString()).div(10**decimals).toString()
  result.expectedYield = new BN(data.expectedYield.toString()).div(10**decimals).toString()
  result.duration = data.duration.toString()
  result.maturityDate = data.maturityDate.toString()
  return result;
}

export const checkInstrumentStatus = async (
  account: string,
  library: Web3Provider,
  marketId: string
): Promise<TransactionResponse> => {
  const vault = Vault__factory.connect(Vault_address, getProviderOrSigner(library, account)); 
  const tx = vault.checkInstrument(marketId)
  return tx;
}

export async function borrow_from_creditline(
  account: string,
  library: Web3Provider,
  instrument_address:string,
  amount: string //decimal format
) : Promise<TransactionResponse> {
  let creditLine = CreditLine__factory.connect(instrument_address, getProviderOrSigner(library, account));
  const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account))
  const decimals = await collateral.decimals()
  
  const drawdownAmount = new BN(amount).shiftedBy(decimals).toFixed(); 
  // const tx =  await creditLine.drawdown(drawdownAmount); 
  // return tx; 
  let tx: TransactionResponse;
  return tx;
}

export async function repay_to_creditline(
  account: string,
  library: Web3Provider,
  instrument_address: string, // decimal format
  amount: string,  //decimal format
  interest: string
) : Promise<TransactionResponse> {
  let creditLine = CreditLine__factory.connect(instrument_address, getProviderOrSigner(library, account));
  const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account))

  const decimals = await collateral.decimals()
  
  const repayAmount = new BN(amount).shiftedBy(decimals).toFixed(); 
  const repayInterest = new BN(interest).shiftedBy(decimals).toFixed(); 

  const totalAmount = new BN(repayAmount).plus(repayInterest).toString();

  let tx = await collateral.approve(instrument_address, totalAmount);
  tx.wait();

  // tx =  await creditLine.repay(repayAmount, repayInterest);
  // tx.wait();
  return tx; 
}


// VAULT FUNCTIONS BELOW


export async function getVaultTokenBalance(
  account: string,
  library: Web3Provider
): Promise<string> {
  const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account))
  const decimals = await collateral.decimals()
  const vault = Vault__factory.connect(Vault_address, getProviderOrSigner(library, account) ); 

  let amount = await vault.balanceOf(account);
  return new BN(amount.toString()).div(10**(decimals)).toString();
}

export async function redeemZCB(
  account: string,
  library: Web3Provider, 
  marketId: string 
  ){
  const MM = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account));
  //await MM.redeem(marketId, account);
}

export async function getZCBBalances(
  account :string, 
  library: Web3Provider, 
  marketId: string): Promise<string[]>{
  // const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account));
  // const zcb_ad = await controller.getZCB_ad( marketId) ;
  // const szcb_ad = await controller.getshortZCB_ad(marketId)
  // const zcb= ERC20__factory.connect(zcb_ad, getProviderOrSigner(library, account)); 
  // const szcb = ERC20__factory.connect(szcb_ad, getProviderOrSigner(library, account)); 
  // const zcb_balance = await zcb.balanceOf(account); 
  // const szcb_balance = await szcb.balanceOf(account); 
  // console.log("zb")
  return ["0", "0"]; 
  //return [zcb_balance.div(10**18).toString(),szcb_balance.div(10**18).toString() ]; 
}


export async function doZCBTrade(
  account: string, 
  library: Web3Provider, 
  marketId: string, 
  collateralIn: string, 
  direction: boolean = true, //true if long
  exit:boolean = false//true if selling position 
  ): Promise< TransactionResponse>{
  let tx; 
  if(direction){
    console.log()
    const tx = buyZCB(account, library, marketId, collateralIn); 
    return tx;
  }
  else{
        const tx = buyZCB(account, library, marketId, collateralIn); 

    //sellamount = get_sellamount()
   // sellZCB(account, library, marketId, collateralIn,  )
   return tx; 
  }
}

export async function buyZCB(
  account: string, 
  library: Web3Provider,
  marketId: string,
  collateralIn: string // without decimal point.
): Promise<TransactionResponse> {
  const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account))
  const decimals = await collateral.decimals()
  const MM = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account));
  const vault = Vault__factory.connect(Vault_address, getProviderOrSigner(library, account) ); 
  const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
  const bc_ad = await controller.getZCB_ad(marketId);

  const _collateralIn = new BN(collateralIn).shiftedBy(decimals).toFixed()
  console.log("collateralIn", _collateralIn);

  return await vault.approve(bc_ad, _collateralIn); 
  // let tx = MM.buy(marketId, _collateralIn);
  // return tx;
}

export async function sellZCB(
  account: string, 
  library: Web3Provider,
  marketId: string,
  sellAmount: string, // ZCB tokens to sell
) : Promise<TransactionResponse> {
  const collateral = Cash__factory.connect(collateral_address, getProviderOrSigner(library, account))
  const decimals = await collateral.decimals()
  const MM = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account));
  const _sellAmount = new BN(sellAmount).shiftedBy(decimals).toFixed()
  let tx: TransactionResponse;
  //let tx = MM.sell(marketId, _sellAmount);
  return tx;
}

export async function redeemPostAssessment(
  account: string, 
  library: Web3Provider,
  marketId: string,
  trader: string
) : Promise<TransactionResponse> {
  const MM = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account));
  let tx = MM.redeemPostAssessment(marketId, trader);
  return tx;
}


export async function verifyAddress(
  account: string,
  provider: Web3Provider
): Promise<TransactionResponse> {
  const wasmFilePath = "../static/semaphore.wasm";
  const zkeyFilePath = "../static/semaphore_final.zkey";
  
  const signer = provider.getSigner(account)
  
  const controller = Controller__factory.connect(controller_address, getProviderOrSigner(provider, account))
  
  const identity = await createIdentity((message) => signer.signMessage(message), "Twitter")
  
  const group = {
    provider: "twitter",
    name: "unrated"
  }

  const externalNullifier = 1

  const snarkArtifacts = {
    wasmFilePath,
    zkeyFilePath
  }

  const signal_string = "twitter-unrated"

  const proof : any = await createProof(identity, group, externalNullifier, signal_string, snarkArtifacts)

  return controller.verifyAddress(proof.publicSignals.nullifierHash, proof.publicSignals.externalNullifier, proof.solidityProof)
}

export async function getVerificationStatus(
  account: string,
  provider: Web3Provider
) : Promise<boolean> {
  const controller = Controller__factory.connect(controller_address, getProviderOrSigner(provider, account))
  
  return controller.verified(account)
}

export async function mintRepNFT(
  account: string,
  library: Web3Provider
) : Promise<TransactionResponse> {
  const repToken = ReputationNFT__factory.connect(RepNFT_address, getProviderOrSigner(library, account))
  
  let tx = repToken.mint(account)

  return tx
}
export async function approveUtilizer(
  account:string, 
  library: Web3Provider, 
  marketId: string
  ){
  const controller = Controller__factory.connect(controller_address, getProviderOrSigner(library, account)); 
  await controller.approveMarket(marketId); 

}

export async function canApproveUtilizer(
  account:string, 
  library: Web3Provider, 
  marketId: string 
  ):Promise<boolean>{
  const marketmanager = MarketManager__factory.connect(market_manager_address, getProviderOrSigner(library, account)); 
  const canApprove =  await marketmanager.marketCondition(marketId)
  return canApprove; 
}



export async function contractApprovals(
  account: string, 
  provider: Web3Provider) {

  const rewardContractAddress = getRewardsContractAddress(TrustedMarketFactoryV3Address);
  console.log('rewardcontractaddress', rewardContractAddress)
  // const rewardContract = getRewardContract(provider, rewardContractAddress, account); 
  // await rewardContract.trustAMMFactory(ammFactoryAddress)

}

export async function validator_approve_check(
    provider: Web3Provider,
  account: string
  ): Promise<boolean>{

  return true; 
}

export async function validator_approve_loan(
  provider: Web3Provider,
  account: string,  )
{
  //TODO, get from lendingpool
  const borrower_address = settlementAddress; 
  const borrower_id = "1";

  const manager_contract = Controller__factory.connect(controller_address, getProviderOrSigner(provider, account))

  await manager_contract.approveLoan(borrower_address, formatBytes32String(borrower_id))


}



function calculateIntialPriceLiquidity(
  principal: string, 
  totalDebt: string
  ): {liquidity: string, weight1: string, weight2:string}{
  //TODO
  const liquidity = totalDebt; 

  const weight1 = new BN("3").shiftedBy(18).toString()
  const weight2 = new BN("47").shiftedBy(18).toString()
  
  return{
    liquidity, weight1, weight2
  };
}

function getInitialMarketNames(

  ) : {_token1: string, _token2: string, name:string} {
  const _token1 = "lCDS";
  const _token2= "sCDS";
  const name =  "test"; 
  return {
    _token1, _token2, name
  };

}
export async function fetchTradeData(
  provider: Web3Provider, 
  account: string, 
  turboId: number, 
  ) : Promise<string> {
  // const marketFactoryData = getMarketFactoryData(TrustedMarketFactoryV3Address);
  // const marketFactoryContract = getMarketFactoryContract(provider, marketFactoryData, settlementAddress);
  // const amount = await marketFactoryContract.getTradeDetails(turboId, 1)//TODO get for all outcomes 

  // return amount.toString()
  return "";
}


export async function getNFTPositionInfo(
  provider: Web3Provider, 
  account: string
  ) : Promise<any>{

  // const indexCDS_contract = IndexCDS__factory.connect(indexCDSAddress,
  //  getProviderOrSigner(provider, account)) ; 
  // const infos = await indexCDS_contract.getUserTotalBalance(account); 

  // return infos; 

}


export async function createMarket_(provider: Web3Provider): Promise<boolean> {
   const weight1 = new BN(2).shiftedBy(18).toString()
  const weight2 = new BN(48).shiftedBy(18).toString()


  //const marketFactoryAddress = "0x78a37719caDFBb038359c3A06164c46932EBD29A"; 
  const marketFactoryAddress_ = TrustedMarketFactoryV3Address
  const settlementAddress_ = settlementAddress
  const dsAddress_ = dsAddress
  const signer = getProviderOrSigner(provider, settlementAddress_)
  console.log('signers', signer)
  console.log("marketfactories", marketFactories)
  const marketFactoryData = getMarketFactoryData(marketFactoryAddress_);
  // const marketFactoryContract = getMarketFactoryContract(provider, marketFactoryData, settlementAddress_);
  //   console.log('new marketfactorycontract', marketFactoryContract)

  // await approveERC20Contract(dsAddress, "name", marketFactoryAddress, loginAccount, string  tokenAddress: string,
  // approvingName: string,
  // spender: string,
  // loginAccount: LoginAccount,
  // amount: string = APPROVAL_AMOUNT)

  // const details = await marketFactoryContract.createMarket(settlementAddress_, "testCDS",['longCDS', 'shortCDS'], 
  //   [weight1, weight2] ).catch((e) => {
  //   console.error(e);
  //   throw e;
  // });


  // console.log(details)
  return true; 
}
export async function endMarket(
  account: string,
  provider: Web3Provider,
  // amm: AmmExchange,
  // cash: Cash,
  // cashAmount: string
): Promise<TransactionResponse> {


  const settlementAddress = "0xFD84b7AC1E646580db8c77f1f05F47977fAda692";
  const marketFactoryAddress = "0x78a37719caDFBb038359c3A06164c46932EBD29A"; 
  const marketFactoryData = getMarketFactoryData(marketFactoryAddress);
  // const marketFactoryContract = getMarketFactoryContract(provider, marketFactoryData, settlementAddress);
  // const tx = await marketFactoryContract.getMarketDetails(0); 
  // console.log('Detail', tx);
  const totalAmount = sharesDisplayToOnChain("100").toFixed();
  console.log('totalamount', totalAmount)
  // const tx = await marketFactoryContract.callStatic.mintShares(
  //       0, totalAmount, settlementAddress
  //   )

  // const tx = await marketFactoryContract.trustedResolveMarket(2, 0).catch((e) => {
  //   console.error(e);
  //   throw e;
  // });




  // return tx;
  let tx: TransactionResponse;
  return tx; 
}

export async function createMarket(
  account: string,
  provider: Web3Provider,
  // amm: AmmExchange,
  // cash: Cash,
  // cashAmount: string
): Promise<TransactionResponse> {


  const weight1 = new BN(2).shiftedBy(18).toString()
  const weight2 = new BN(48).shiftedBy(18).toString()



 // const weight1 = BigNumber.from("2").mul(exp)
  //const weight2 = BigNumber.from("48").mul(exp)

  const settlementAddress = "0xFD84b7AC1E646580db8c77f1f05F47977fAda692";
  const marketFactoryAddress = "0x78a37719caDFBb038359c3A06164c46932EBD29A"; 
  const marketFactoryData = getMarketFactoryData(marketFactoryAddress);
  // const marketFactoryContract = getMarketFactoryContract(provider, marketFactoryData, settlementAddress);
  // console.log('isthisworking', marketFactoryData, marketFactoryContract)
  // const tx = await marketFactoryContract.getMarketDetails(0); 
  // console.log('Detail', tx);
  const totalAmount = sharesDisplayToOnChain("100").toFixed();
  console.log('totalamount', totalAmount)
  // const tx = await marketFactoryContract.callStatic.mintShares(
  //       0, totalAmount, settlementAddress
  //   )

  // const tx = await marketFactoryContract.createMarket(settlementAddress, "testCDS",['longCDS', 'shortCDS'], 
  //   [weight1, weight2] ).catch((e) => {
  //   console.error(e);
  //   throw e;
  // });




  // return tx;

  let tx: TransactionResponse;
 
  return tx; 
}


export async function mintCompleteSets_(
  provider: Web3Provider,
  amount: string,
  account: string
): Promise<TransactionResponse> {

  const marketFactoryAddress = "0x78a37719caDFBb038359c3A06164c46932EBD29A"; 

  const marketFactoryData = getMarketFactoryData(marketFactoryAddress);
  if (!marketFactoryData) return null;
  //const marketFactoryContract = getMarketFactoryContract(provider, marketFactoryData, account);
  // const totalAmount = sharesDisplayToOnChain(amount).toFixed();
  //   console.log('new function', marketFactoryContract); 

  // const tx = await marketFactoryContract.mintShares(1, totalAmount, account).catch((e) => {
  //   console.error(e);
  //   throw e;
  // });
  let tx: TransactionResponse;

  return tx;
}

//called when default OR repayment finished, handles nondefault/default logic 
export async function resolveMarket(
  account: string,
  provider: Web3Provider,

  marketID: number = 1, 
  isDefault: boolean = false
  // amm: AmmExchange,
  // cash: Cash,
  // cashAmount: string
): Promise<TransactionResponse> {

  //ok, so this is not default. end market first 
  const winningOutcome = isDefault ? 0 : 1
  const marketFactoryData = getMarketFactoryData(TrustedMarketFactoryV3Address)
  // const marketFactoryContract = getMarketFactoryContract(provider, marketFactoryData, settlementAddress);//only deployer can end market for now 
  // const tx = await marketFactoryContract.trustedResolveMarket(marketID, winningOutcome).catch((e) => {
  //   console.error(e);
  //   throw e;
  // });




  // return tx;
  let tx: TransactionResponse;
  return tx; 
}



export const checkConvertLiquidityProperties = (
  account: string,
  marketId: string,
  amount: string,
  fee: string,
  outcomes: AmmOutcome[],
  cash: Cash
): boolean => {
  if (!account || !marketId || !amount || !outcomes || outcomes.length === 0 || !cash) return false;
  if (amount === "0" || amount === "0.00") return false;
  if (Number(fee) < 0) return false;

  return true;
};

export async function mintCompleteSets(
  amm: AmmExchange,
  provider: Web3Provider,
  amount: string,
  account: string
): Promise<TransactionResponse> {
  if (!provider) {
    console.error("mintCompleteSets: no provider");
    return null;
  }
  if (!amm || !amm?.ammFactoryAddress) {
    console.error("minCompleteSets: no amm provided");
    return null;
  }

  const marketFactoryData = getMarketFactoryData(amm.marketFactoryAddress);
  if (!marketFactoryData) return null;
  // const marketFactoryContract = getMarketFactoryContract(provider, marketFactoryData, account);
  const totalAmount = sharesDisplayToOnChain(amount).toFixed();
  // console.log("minting!!!",marketFactoryContract, marketFactoryContract.address, amm?.market?.turboId, totalAmount, account, 
  //   marketFactoryData);
  // const tx = await marketFactoryContract.mintShares(amm?.market?.turboId, totalAmount, account).catch((e) => {
  //   console.error(e);
  //   throw e;
  // });
  let tx: TransactionResponse;
  return tx;
}

export async function estimateAddLiquidityPool(
  account: string,
  provider: Web3Provider,
  amm: AmmExchange,
  cash: Cash,
  cashAmount: string
): Promise<LiquidityBreakdown> {
  if (!provider) console.error("provider is null");
  // const ammFactoryContract = getAmmFactoryContract(provider, amm.ammFactoryAddress, account);
  console.log('cashamount', cashAmount)
  const { amount, marketFactoryAddress, turboId } = shapeAddLiquidityPool(amm, cash, cashAmount);
  const ammAddress = null;// amm?.id;

  //
  // const dsContract = DS__factory.connect(dsAddress, getProviderOrSigner(provider, account))
  // await dsContract.approve(amm.ammFactoryAddress, cashAmount)
  // console.log('dscontract approves!')
  //

  let results = null;
  let tokenAmount = "0";
  let minAmounts = [];
  let minAmountsRaw = [];
  let poolPct = "0";

  const rewardContractAddress = getRewardsContractAddress(amm.marketFactoryAddress);
  const rewardContract = null; //rewardContractAddress ? getRewardContract(provider, rewardContractAddress, account) : null;
  if (!ammAddress) {
    console.log("est add init", marketFactoryAddress, turboId, amount, account, 
      'rewardcontractaddress' , rewardContractAddress);
    // results = rewardContractAddress
    //   ? await rewardContract.callStatic.createPool(
    //       amm.ammFactoryAddress,
    //       marketFactoryAddress,
    //       turboId,
    //       amount,
    //       account
    //     )
    //   : await ammFactoryContract.callStatic.createPool(marketFactoryAddress, turboId, amount, account);
    results = null;
    tokenAmount = trimDecimalValue(sharesOnChainToDisplay(String(results || "0")));
    console.log('results',results)
  } else {
    // todo: get what the min lp token out is
    console.log("est add additional", marketFactoryAddress, "marketId", turboId, "amount", amount, 0, account);

    // results = rewardContractAddress
    //   ? await rewardContract.callStatic.addLiquidity(
    //       amm.ammFactoryAddress,
    //       marketFactoryAddress,
    //       turboId,
    //       amount,
    //       0,
    //       account
    //     )
    //   : await ammFactoryContract.callStatic.addLiquidity(marketFactoryAddress, turboId, amount, 0, account);
    results = null;
    if (results) {
      const { _balances, _poolAmountOut } = results;
      minAmounts = _balances
        ? _balances.map((v, i) => ({
            amount: lpTokensOnChainToDisplay(String(v)).toFixed(),
            outcomeId: i,
            hide: lpTokensOnChainToDisplay(String(v)).lt(DUST_POSITION_AMOUNT),
          }))
        : [];
      minAmountsRaw = _balances ? _balances.map((v) => new BN(String(v)).toFixed()) : [];
      // lp tokens are 18 decimal
      tokenAmount = trimDecimalValue(sharesOnChainToDisplay(String(_poolAmountOut)));

      const poolSupply = lpTokensOnChainToDisplay(amm?.totalSupply).plus(tokenAmount);
      poolPct = String(lpTokenPercentageAmount(tokenAmount, poolSupply));
    }
  }

  if (!results) return null;

  return {
    amount: tokenAmount,
    minAmounts,
    minAmountsRaw,
    poolPct,
  };
}

export async function addLiquidityPool(
  account: string,
  provider: Web3Provider,
  amm: AmmExchange,
  cash: Cash,
  cashAmount: string,
  minAmount: string,
  outcomes: AmmOutcome[]
): Promise<TransactionResponse> {
  if (!provider) console.error("provider is null");
  // const ammFactoryContract = getAmmFactoryContract(provider, amm.ammFactoryAddress, account);
  const rewardContractAddress = getRewardsContractAddress(amm.marketFactoryAddress);
  const { amount, marketFactoryAddress, turboId } = shapeAddLiquidityPool(amm, cash, cashAmount);
  const bPoolId = amm?.id;
  const minLpTokenAllowed = "0"; //sharesDisplayToOnChain(minLptokenAmount).toFixed();
  let tx = null;
  console.log(
    !bPoolId ? "add init liquidity:" : "add additional liquidity",
    "amm",
    amm.ammFactoryAddress,
    "factory",
    marketFactoryAddress,
    "marketIndex",
    turboId,
    "amount",
    amount,
    "account",
    account
  );
  if (rewardContractAddress) {
    //const contract = getRewardContract(provider, rewardContractAddress, account);
    // use reward contract (master chef) to add liquidity
    if (!bPoolId) {
      // tx = contract.createPool(amm.ammFactoryAddress, marketFactoryAddress, turboId, amount, account, {
      //   // gasLimit: "800000",
      //   // gasPrice: "10000000000",
      // });
    } else {
      // tx = contract.addLiquidity(
      //   amm.ammFactoryAddress,
      //   marketFactoryAddress,
      //   turboId,
      //   amount,
      //   minLpTokenAllowed,
      //   account,
      //   {
      //     // gasLimit: "800000",
      //     // gasPrice: "10000000000",
      //   }
      // );
    }
  } else {
    if (!bPoolId) {
      // tx = ammFactoryContract.createPool(marketFactoryAddress, turboId, amount, account, {
      //   // gasLimit: "800000",
      //   // gasPrice: "10000000000",
      // });
    } else {

      // tx = ammFactoryContract.addLiquidity(marketFactoryAddress, turboId, amount, minLpTokenAllowed, account, {
      //   // gasLimit: "800000",
      //   // gasPrice: "10000000000",
      // });
    }
  }

  return tx;
}

function shapeAddLiquidityPool(
  amm: AmmExchange,
  cash: Cash,
  cashAmount: string
): { amount: string; marketFactoryAddress: string; turboId: number } {
  const { marketFactoryAddress, turboId } = amm;
  console.log('cashdecimals', cash.decimals)
  const amount = convertDisplayCashAmountToOnChainCashAmount(cashAmount, cash.decimals).toFixed();
  return {
    marketFactoryAddress,
    turboId,
    amount,
  };
}

export async function getRemoveLiquidity(
  amm: AmmExchange,
  provider: Web3Provider,
  lpTokenBalance: string,
  account: string,
  cash: Cash,
  hasWinner: boolean = false
): Promise<LiquidityBreakdown | null> {
  if (!provider) {
    console.error("getRemoveLiquidity: no provider");
    return null;
  }
  const { market } = amm;
  // const ammFactory = getAmmFactoryContract(provider, amm.ammFactoryAddress, account);

  // balancer lp tokens are 18 decimal places
  const lpBalance = convertDisplayCashAmountToOnChainCashAmount(lpTokenBalance, 18).toFixed();
  let results = null;
  let minAmounts = null;
  let minAmountsRaw = null;
  let collateralOut = "0";

  const rewardContractAddress = null; // getRewardsContractAddress(amm.marketFactoryAddress);
  const rewardContract = null; // rewardContractAddress ? getRewardContract(provider, rewardContractAddress, account) : null;
  // results = rewardContractAddress
  //   ? await rewardContract.callStatic
  //       .removeLiquidity(amm.ammFactoryAddress, market.marketFactoryAddress, market.turboId, lpBalance, "0", account) // uint256[] calldata minAmountsOut values be?
  //       .catch((e) => {
  //         console.log(e);
  //         throw e;
  //       })
  //   : await ammFactory.callStatic
  //       .removeLiquidity(market.marketFactoryAddress, market.turboId, lpBalance, "0", account) // uint256[] calldata minAmountsOut values be?
  //       .catch((e) => {
  //         console.log(e);
  //         throw e;
  //       });
  results = null;

  const balances = results ? results?._balances || results[1] : [];
  collateralOut = results ? results?._collateralOut || results[0] || "0" : collateralOut;
  minAmounts = balances.map((v, i) => ({
    amount: lpTokensOnChainToDisplay(String(v)).toFixed(),
    outcomeId: i,
    hide: lpTokensOnChainToDisplay(String(v)).lt(DUST_POSITION_AMOUNT),
  }));
  minAmountsRaw = balances.map((v) => new BN(String(v)).toFixed());

  if (!results) return null;

  const amount = cashOnChainToDisplay(String(collateralOut), cash.decimals).toFixed();
  const poolPct = String(lpTokenPercentageAmount(lpTokenBalance, lpTokensOnChainToDisplay(amm?.totalSupply || "1")));

  return {
    minAmountsRaw,
    minAmounts,
    amount,
    poolPct,
  };
}

export async function estimateLPTokenInShares(
  balancerPoolId: string,
  provider: Web3Provider,
  lpTokenBalance: string,
  account: string,
  outcomes: AmmOutcome[] = []
): Promise<LiquidityBreakdown | null> {
  if (!provider || !balancerPoolId) {
    console.error("estimate lp tokens: no provider or no balancer pool id");
    return null;
  }
  // const balancerPool = getBalancerPoolContract(provider, balancerPoolId, account);
  // balancer lp tokens are 18 decimal places
  const lpBalance = convertDisplayCashAmountToOnChainCashAmount(lpTokenBalance, 18).toFixed();

  // const results = await balancerPool
  //   .calcExitPool(
  //     lpBalance,
  //     outcomes.map((o) => "0")
  //   ) // uint256[] calldata minAmountsOut values be?
  //   .catch((e) => {
  //     console.log(e);
  //     throw e;
  //   });

  // ANTI-LEGACY
  const results = null;

  if (!results) return null;
  const minAmounts = results.map((v) => ({ amount: lpTokensOnChainToDisplay(String(v)).toFixed() }));
  const minAmountsRaw: string[] = results.map((v) => new BN(String(v)).toFixed());

  return {
    minAmountsRaw,
    minAmounts,
  };
}

export function doRemoveLiquidity(
  amm: AmmExchange,
  provider: Web3Provider,
  lpTokenBalance: string,
  amountsRaw: string[],
  account: string,
  cash: Cash,
  hasWinner = false
): Promise<TransactionResponse | null> {
  if (!provider) {
    console.error("doRemoveLiquidity: no provider");
    return null;
  }
  const { market } = amm;
  // const ammFactory = getAmmFactoryContract(provider, amm.ammFactoryAddress, account);
  const lpBalance = convertDisplayCashAmountToOnChainCashAmount(lpTokenBalance, 18).toFixed();
  // const balancerPool = getBalancerPoolContract(provider, amm?.id, account);
  const rewardContractAddress = getRewardsContractAddress(amm.marketFactoryAddress);

  if (rewardContractAddress) {
    // const contract = getRewardContract(provider, rewardContractAddress, account);
    // return contract.removeLiquidity(
    //   amm.ammFactoryAddress,
    //   market.marketFactoryAddress,
    //   market.turboId,
    //   lpBalance,
    //   "0",
    //   account
    // );
  } else {
    // return hasWinner
    //   ? balancerPool.exitPool(lpBalance, amountsRaw)
    //   : ammFactory.removeLiquidity(market.marketFactoryAddress, market.turboId, lpBalance, "0", account);
  }
  return null; // AL
}

export const maxWhackedCollateralAmount = (amm: AmmExchange) => {
  const greatestBalanceOutcome = amm.ammOutcomes.reduce(
    (p, a) => (new BN(a.balanceRaw).gt(new BN(p.balanceRaw)) ? a : p),
    amm.ammOutcomes[0]
  );
  const smallestBalanceOutcome = amm.ammOutcomes.reduce(
    (p, a) => (new BN(a.balanceRaw).lt(new BN(p.balanceRaw)) ? a : p),
    amm.ammOutcomes[0]
  );

  const decimals = amm.cash?.decimals || 6;
  const collateral = new BN(greatestBalanceOutcome.balanceRaw)
    .minus(new BN(smallestBalanceOutcome.balanceRaw))
    .div(new BN(amm.shareFactor))
    .plus(1) // needs to be one over
    .decimalPlaces(0);
  const collateralUsd = convertOnChainCashAmountToDisplayCashAmount(collateral, decimals).toFixed();

  return {
    maxOutcomeId: greatestBalanceOutcome.id,
    collateralRaw: collateral.toFixed(),
    collateralUsd,
  };
};

const WHACK_PRICE = 0.7;
const LOW_LIQ_USD = 50;
export const isMarketPoolWhacked = (amm: AmmExchange) => {
  if (!amm) return false;
  // liquidity is less than $50
  // and one outcome price is over 0.70
  const isWhackPrice = amm.ammOutcomes.some((a) => Number(a.price) > WHACK_PRICE);
  const isLowerLiq = Number(amm.liquidityUSD) < LOW_LIQ_USD;
  return isWhackPrice && isLowerLiq;
};

export const estimateResetPrices = async (
  library: Web3Provider,
  account: string,
  amm: AmmExchange
): Promise<LiquidityBreakdown> => {
  const { evenTheOdds } = PARA_CONFIG;
  // const contract = EvenTheOdds__factory.connect(evenTheOdds, getProviderOrSigner(library, account));
  const factory = getMarketFactoryData(amm.marketFactoryAddress);

  const maxCollateral = maxWhackedCollateralAmount(amm);

  let results = {
    _balancesOut: ["0", "0", "0"],
    _collateralOut: "0",
  };

  try {
    results = results; 
     // await contract.callStatic.bringTokenBalanceToMatchOtherToken(
     //  factory.address,
     //  amm.turboId,
     //  amm.id,
     //  maxCollateral.maxOutcomeId,
     //  maxCollateral.collateralRaw
   //);
  } catch (e) {
    console.log(e);
  }

  let minAmounts = [];
  let collateralOut = "0";

  if (results) {
    minAmounts = results?._balancesOut
      ? results._balancesOut.map((v, i) => ({
          amount: lpTokensOnChainToDisplay(String(v)).toFixed(),
          outcomeId: i,
          hide: lpTokensOnChainToDisplay(String(v)).lt(DUST_POSITION_AMOUNT),
        }))
      : [];
    const usdcRaw = results?._collateralOut ? results?._collateralOut : collateralOut;
    collateralOut = cashOnChainToDisplay(String(usdcRaw), amm?.cash?.decimals).toFixed();
  }

  return {
    minAmounts,
    cashAmount: collateralOut,
  };
};

export const doResetPrices = async (library: Web3Provider, account: string, amm: AmmExchange) => {
  if (!amm) return null;
  const { evenTheOdds } = PARA_CONFIG;
  // const contract = EvenTheOdds__factory.connect(evenTheOdds, getProviderOrSigner(library, account));
  const factory = getMarketFactoryData(amm.marketFactoryAddress);
  const maxCollateral = maxWhackedCollateralAmount(amm);
  // return contract.bringTokenBalanceToMatchOtherToken(
  //   factory.address,
  //   amm.turboId,
  //   amm.id,
  //   maxCollateral.maxOutcomeId,
  //   maxCollateral.collateralRaw,
  //   {
  //     //gasLimit: "800000",
  //     //gasPrice: "10000000000",
  //   }
  // );
};

export const estimateBuyTrade = (
  amm: AmmExchange,
  inputDisplayAmount: string,
  selectedOutcomeId: number,
  cash: Cash
): EstimateTradeResult | null => {
  const amount = convertDisplayCashAmountToOnChainCashAmount(inputDisplayAmount, cash.decimals)
    .decimalPlaces(0, 1)
    .toFixed();
  let result = null;
  try {
    // result = estimateBuy(amm.shareFactor, selectedOutcomeId, amount, amm.balancesRaw, amm.weights, amm.feeRaw);
  } catch (e) {
    if (String(e).indexOf("ERR_DIV_ZERO") > -1) {
      console.log("Insufficent Liquidity to estimate buy", inputDisplayAmount);
    } else {
      console.log("error in estimate buy", e);
    }
  }

  if (!result) return null;

  const estimatedShares = sharesOnChainToDisplay(String(result));
  const tradeFees = String(new BN(inputDisplayAmount).times(new BN(amm.feeDecimal)));
  const averagePrice = new BN(inputDisplayAmount).div(new BN(estimatedShares));
  const maxProfit = String(new BN(estimatedShares).minus(new BN(inputDisplayAmount)));
  const price = new BN(amm.ammOutcomes[selectedOutcomeId]?.price);
  const priceImpact = price.minus(averagePrice).times(100).toFixed(4);
  const ratePerCash = new BN(estimatedShares).div(new BN(inputDisplayAmount)).toFixed(6);

  return {
    outputValue: trimDecimalValue(estimatedShares),
    tradeFees,
    averagePrice: averagePrice.toFixed(4),
    maxProfit,
    ratePerCash,
    priceImpact,
  };
};

export const estimateSellTrade = (
  amm: AmmExchange,
  inputDisplayAmount: string,
  selectedOutcomeId: number,
  userBalances: { outcomeSharesRaw: string[] }
): EstimateTradeResult | null => {
  // const amount = sharesDisplayToOnChain(inputDisplayAmount).toFixed();

  // const [setsOut, undesirableTokensInPerOutcome] = calcSellCompleteSets(
  //   amm.shareFactor,
  //   selectedOutcomeId,
  //   amount,
  //   amm.balancesRaw,
  //   amm.weights,
  //   amm.feeRaw
  // );
  // let maxSellAmount = "0";
  // const completeSets = sharesOnChainToDisplay(setsOut); // todo: debugging div 1000 need to fix
  // const tradeFees = String(new BN(inputDisplayAmount).times(new BN(amm.feeDecimal)).toFixed(4));

  // const displayAmount = new BN(inputDisplayAmount);
  // const averagePrice = new BN(completeSets).div(displayAmount);
  // const price = new BN(String(amm.ammOutcomes[selectedOutcomeId].price));
  // const userShares = userBalances?.outcomeSharesRaw
  //   ? new BN(userBalances?.outcomeSharesRaw?.[selectedOutcomeId] || "0")
  //   : "0";
  // const priceImpact = averagePrice.minus(price).times(100).toFixed(4);
  // const ratePerCash = new BN(completeSets).div(displayAmount).toFixed(6);
  // const displayShares = sharesOnChainToDisplay(userShares);
  // const remainingShares = new BN(displayShares || "0").minus(displayAmount).abs();

  // const sumUndesirable = (undesirableTokensInPerOutcome || []).reduce((p, u) => p.plus(new BN(u)), ZERO);

  // const canSellAll = new BN(amount).minus(sumUndesirable).abs();

  // if (canSellAll.gte(new BN(amm.shareFactor))) {
  //   maxSellAmount = sharesOnChainToDisplay(sumUndesirable).decimalPlaces(4, 1).toFixed();
  // }

  // return {
  //   outputValue: String(completeSets),
  //   tradeFees,
  //   averagePrice: averagePrice.toFixed(2),
  //   maxProfit: null,
  //   ratePerCash,
  //   remainingShares: remainingShares.toFixed(6),
  //   priceImpact,
  //   outcomeShareTokensIn: undesirableTokensInPerOutcome, // just a pass through to sell trade call
  //   maxSellAmount,
  // };
  return null;
};



export const claimWinnings = (
  account: string,
  provider: Web3Provider,
  marketIds: string[],
  factoryAddress: string
): Promise<TransactionResponse | null> => {
  if (!provider) {
    console.error("claimWinnings: no provider");
    return null;
  }
  // const marketFactoryContract = getAbstractMarketFactoryContract(provider, factoryAddress, account);
  // return marketFactoryContract.claimManyWinnings(marketIds, account);
  return null;
};

export const claimFees = (
  account: string,
  provider: Web3Provider,
  factoryAddress: string
): Promise<TransactionResponse | null> => {
  if (!provider) {
    console.error("claimFees: no provider");
    return null;
  }
  // const marketFactoryContract = getAbstractMarketFactoryContract(provider, factoryAddress, account);
  //return marketFactoryContract.claimSettlementFees(account);
  return null;
};

export const cashOutAllShares = (
  account: string,
  provider: Web3Provider,
  balancesRaw: string[],
  marketId: string,
  shareFactor: string,
  factoryAddress: string
): Promise<TransactionResponse | null> => {
  if (!provider) {
    console.error("cashOutAllShares: no provider");
    return null;
  }
  // const marketFactoryContract = getAbstractMarketFactoryContract(provider, factoryAddress, account);
  const shareAmount = BN.min(...balancesRaw);
  const normalizedAmount = shareAmount
    .div(new BN(shareFactor))
    .decimalPlaces(0, 1)
    .times(new BN(shareFactor))
    .decimalPlaces(0, 1);
  console.log("share to cash out", shareAmount.toFixed(), marketId, normalizedAmount.toFixed(), account);
  // return marketFactoryContract.burnShares(
  //   marketId,
  //   normalizedAmount.toFixed(),
  //   account
  //   //, { gasLimit: "800000", gasPrice: "10000000000", }
  // );
  return null;
};

export const getCompleteSetsAmount = (outcomeShares: string[], ammOutcomes): string => {
  if (!outcomeShares) return "0";
  const shares = (ammOutcomes || []).map((s, i) => new BN(outcomeShares[i] || "0"));
  const amount = BN.min(...shares);
  if (isNaN(Number(amount.toFixed()))) return "0";
  const isDust = amount.lte(DUST_POSITION_AMOUNT);
  return isDust ? "0" : amount.toFixed();
};

const MULTI_CALL_LIMIT = 100;
const chunkedMulticall = async (
  provider: Web3Provider,
  contractCalls,
  callingMethod: string,
  chunkSize: number = MULTI_CALL_LIMIT,
  currentBlockNumber: number = 0
): Promise<{ blocknumber: number; results: { [key: string]: ContractCallReturnContext } }> => {
  if (!provider) {
    throw new Error("Provider not provided");
  }

  const multicall = new Multicall({ ethersProvider: provider });
  let results = { blocknumber: null, results: {} };

  if (!contractCalls || contractCalls.length === 0) return results;
  if (contractCalls.length < chunkSize) {
    const res = await multicall.call(contractCalls).catch((e) => {
      console.error("multicall", callingMethod, contractCalls);
      throw e;
    });
    results = { results: res.results, blocknumber: res.blockNumber };
  } else {
    const combined = {
      blocknumber: null,
      results: {},
    };
    const chunks = sliceIntoChunks(contractCalls, chunkSize);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const call = await multicall.call(chunk).catch((e) => {
        console.error(`multicall, ${callingMethod} chunking ${chunk.length} calls`);
        throw e;
      });
      combined.blocknumber = call.blockNumber;
      combined.results = { ...combined.results, ...call.results };
    }
    results = combined;
  }
  if (Math.abs(currentBlockNumber - results.blocknumber) >= MAX_LAG_BLOCKS) {
    const msg = `user balance data more than ${MAX_LAG_BLOCKS} blocks, ${provider.connection.url}`;
    console.error(msg);
    throw new Error(msg);
  }
  return results;
};

const sliceIntoChunks = (arr, chunkSize) => {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
};

export const getUserBalances = async (
  provider: Web3Provider,
  account: string,
  ammExchanges: AmmExchanges,
  cashes: Cashes,
  markets: MarketInfos,
  transactions: AllMarketsTransactions | UserClaimTransactions,
  currentBlockNumber: number = 0
): Promise<UserBalances> => {
  const userBalances = {
    ETH: {
      balance: "0",
      rawBalance: "0",
      usdValue: "0",
    },
    USDC: {
      balance: "0",
      rawBalance: "0",
      usdValue: "0",
    },
    totalPositionUsd: "0",
    total24hrPositionUsd: "0",
    change24hrPositionUsd: "0",
    totalAccountValue: "0",
    availableFundsUsd: "0",
    lpTokens: {},
    marketShares: {},
    claimableWinnings: {},
    pendingRewards: {},
    claimableFees: "0",
    approvals: {},
    totalRewards: "0",
    totalAccountValueOpenOnly: "0",
    totalCurrentLiquidityUsd: "0",
  };

  if (!account || !provider) {
    console.log("returning default");
    return userBalances;
  }

  const userMarketTransactions = getUserTransactions(transactions as AllMarketsTransactions, account);
  const userClaims = transactions as UserClaimTransactions;
  const BALANCE_OF = "balanceOf";
  const POOL_TOKEN_BALANCE = "getPoolTokenBalance"; // on master chef
  const POOL_TOKEN_BALANCE_BAL = "getTokenBalanceByPool"; // on amm factory
  const POOL_PENDING_REWARDS = "getUserPendingRewardInfo";
  const LP_TOKEN_COLLECTION = "lpTokens";
  const PENDING_REWARDS_COLLECTION = "pendingRewards";
  const MARKET_SHARE_COLLECTION = "marketShares";
  const APPROVAL_COLLECTION = "approvals";
  const ALLOWANCE = "allowance";

  // finalized markets
  const finalizedMarkets = Object.values(markets).filter((m) => m.reportingState === MARKET_STATUS.FINALIZED);
  const finalizedMarketIds = finalizedMarkets.map((f) => f.marketId);
  const finalizedAmmExchanges = Object.values(ammExchanges).filter((a) => finalizedMarketIds.includes(a.marketId));
  const ammFactoryAddresses = Object.values(ammExchanges).reduce(
    (p, exchange) => (p.includes(exchange.ammFactoryAddress) ? p : [...p, exchange.ammFactoryAddress]),
    []
  );

  // balance of
  const exchanges = Object.values(ammExchanges).filter((e) => e.id && e.totalSupply !== "0");
  const allExchanges = Object.values(ammExchanges).filter((e) => e.id);
  userBalances.ETH = await getEthBalance(provider, cashes, account);
  const usdc = Object.values(cashes).find((c) => c.name === USDC);

  const supportRewards = rewardsSupported(ammFactoryAddresses);
  const rewardsUnsupportedExchanges = exchanges.filter((f) => !supportRewards.includes(f.ammFactoryAddress));
    console.log("AMMMEXCHANGE", rewardsUnsupportedExchanges)

  const supportRewardsExchanges = exchanges.filter((f) => supportRewards.includes(f.ammFactoryAddress));
  // const ammFactoryAbi =
  //   supportRewards.length > 0 ? extractABI(getAmmFactoryContract(provider, supportRewards[0], account)) : null;
  const ammFactoryAbi = null; // AL

  const contractLpBalanceRewardsCall: ContractCallContext[] = []; // ammFactoryAbi
    // ? supportRewardsExchanges.reduce(
    //     (p, exchange) => [
    //       ...p,
    //       {
    //         reference: `${exchange.id}-lp`,
    //         contractAddress: getRewardsContractAddress(exchange.marketFactoryAddress),
    //         abi: extractABI(
    //           getRewardContract(provider, getRewardsContractAddress(exchange.marketFactoryAddress), account)
    //         ),
    //         calls: [
    //           {
    //             reference: `${exchange.id}-lp`,
    //             methodName: POOL_TOKEN_BALANCE,
    //             methodParameters: [
    //               exchange.ammFactoryAddress,
    //               exchange.marketFactoryAddress,
    //               exchange.turboId,
    //               account,
    //             ],
    //             context: {
    //               dataKey: exchange.marketId,
    //               collection: LP_TOKEN_COLLECTION,
    //               decimals: 18,
    //               marketId: exchange.marketId,
    //               totalSupply: exchange?.totalSupply,
    //             },
    //           },
    //         ],
    //       },
    //       {
    //         reference: `${exchange.id}-reward`,
    //         contractAddress: getRewardsContractAddress(exchange.marketFactoryAddress),
    //         abi: extractABI(
    //           getRewardContract(provider, getRewardsContractAddress(exchange.marketFactoryAddress), account)
    //         ),
    //         calls: [
    //           {
    //             reference: `${exchange.id}-reward`,
    //             methodName: POOL_PENDING_REWARDS,
    //             methodParameters: [
    //               exchange.ammFactoryAddress,
    //               exchange.marketFactoryAddress,
    //               exchange.turboId,
    //               account,
    //             ],
    //             context: {
    //               dataKey: exchange.marketId,
    //               collection: PENDING_REWARDS_COLLECTION,
    //               decimals: 18,
    //               marketId: exchange.marketId,
    //             },
    //           },
    //         ],
    //       },
    //     ],
    //     []
    //   )
    // : [];

  const contractLpBalanceCall: ContractCallContext[] = rewardsUnsupportedExchanges.map((exchange) => ({
    reference: exchange.id,
    contractAddress: exchange.id,
    abi: ERC20ABI,
    calls: [
      {
        reference: exchange.id,
        methodName: BALANCE_OF,
        methodParameters: [account],
        context: {
          dataKey: exchange.marketId,
          collection: LP_TOKEN_COLLECTION,
          decimals: 18,
          marketId: exchange.marketId,
          totalSupply: exchange?.totalSupply,
        },
      },
    ],
  }));

  const contractAmmFactoryApprovals: ContractCallContext[] = ammFactoryAddresses.map((address) => ({
    reference: address,
    contractAddress: usdc.address,
    abi: ERC20ABI,
    calls: [
      {
        reference: address,
        methodName: ALLOWANCE,
        methodParameters: [account, address],
        context: {
          dataKey: address,
          collection: APPROVAL_COLLECTION,
        },
      },
    ],
  }));

  const contractMarketShareBalanceCall: ContractCallContext[] = allExchanges.reduce((p, exchange) => {
    const shareTokenOutcomeShareBalances = exchange.ammOutcomes.map((outcome) => ({
      reference: `${outcome.shareToken}`,
      contractAddress: outcome.shareToken,
      abi: ERC20ABI,
      calls: [
        {
          reference: `${outcome.shareToken}`,
          methodName: BALANCE_OF,
          methodParameters: [account],
          context: {
            dataKey: outcome.shareToken,
            collection: MARKET_SHARE_COLLECTION,
            decimals: exchange?.cash?.decimals,
            marketId: exchange.marketId,
            outcomeId: outcome.id,
          },
        },
      ],
    }));
    return [...p, ...shareTokenOutcomeShareBalances];
  }, []);

  let basicBalanceCalls: ContractCallContext[] = [];

  if (usdc) {
    basicBalanceCalls = [
      {
        reference: "usdc-balance",
        contractAddress: usdc.address,
        abi: ERC20ABI,
        calls: [
          {
            reference: "usdcBalance",
            methodName: BALANCE_OF,
            methodParameters: [account],
            context: {
              dataKey: USDC,
              collection: null,
              decimals: usdc?.decimals,
            },
          },
        ],
      },
    ];
  }

  const balanceCalls = [
    ...basicBalanceCalls,
    ...contractMarketShareBalanceCall,
    ...contractLpBalanceCall,
    ...contractAmmFactoryApprovals,
    ...contractLpBalanceRewardsCall,
  ];

  const balanceResult = await chunkedMulticall(provider, balanceCalls, "getUserBalances", 20, currentBlockNumber);

  for (let i = 0; i < Object.keys(balanceResult.results).length; i++) {
    const key = Object.keys(balanceResult.results)[i];
    const method = String(balanceResult.results[key].originalContractCallContext.calls[0].methodName);
    const balanceValue = balanceResult.results[key].callsReturnContext[0].returnValues[0] as ethers.utils.Result;
    const context = balanceResult.results[key].originalContractCallContext.calls[0].context;
    const rawBalance = new BN(balanceValue._hex).toFixed();
    const { dataKey, collection, decimals, marketId, outcomeId, totalSupply } = context;
    const balance = convertOnChainCashAmountToDisplayCashAmount(new BN(rawBalance), new BN(decimals));
    if (method === POOL_TOKEN_BALANCE) {
      if (rawBalance !== "0") {
        const lpBalance = lpTokensOnChainToDisplay(rawBalance);
        const total = lpTokensOnChainToDisplay(totalSupply);
        const poolPct = lpTokenPercentageAmount(lpBalance, total);
        userBalances[collection][dataKey] = {
          balance: lpBalance.toFixed(),
          rawBalance,
          marketId,
          poolPct,
        };
      } else {
        delete userBalances[collection][dataKey];
      }
    } else if (method === POOL_PENDING_REWARDS) {
      const {
        accruedEarlyDepositBonusRewards,
        accruedStandardRewards,
        earlyDepositEndTimestamp,
        pendingEarlyDepositBonusRewards,
        endTimestamp,
      } = balanceValue;
      const balance = convertOnChainCashAmountToDisplayCashAmount(
        new BN(String(accruedStandardRewards)),
        new BN(decimals)
      ).toFixed();
      const pendingBonusRewards = convertOnChainCashAmountToDisplayCashAmount(
        new BN(String(pendingEarlyDepositBonusRewards.add(accruedEarlyDepositBonusRewards))),
        new BN(decimals)
      ).toFixed();
      const earnedBonus = convertOnChainCashAmountToDisplayCashAmount(
        new BN(String(accruedEarlyDepositBonusRewards)),
        new BN(decimals)
      ).toFixed();
      if (rawBalance !== "0") {
        userBalances[collection][dataKey] = {
          balance,
          rawBalance: new BN(String(accruedStandardRewards)).toFixed(),
          marketId,
          pendingBonusRewards,
          earnedBonus,
          endEarlyBonusTimestamp: new BN(String(earlyDepositEndTimestamp)).toNumber(),
          endBonusTimestamp: new BN(String(endTimestamp)).toNumber(),
        };
      } else {
        delete userBalances[collection][dataKey];
      }
    } else if (method === BALANCE_OF) {
      if (!collection) {
        userBalances[dataKey] = {
          balance: balance.toFixed(),
          rawBalance: rawBalance,
          usdValue: balance.toFixed(),
        };
      } else if (collection === MARKET_SHARE_COLLECTION) {
        const fixedShareBalance = sharesOnChainToDisplay(new BN(rawBalance)).toFixed();
        // shape AmmMarketShares
        const existingMarketShares = userBalances[collection][marketId];
        const marketTransactions = userMarketTransactions[marketId];
        const exchange = ammExchanges[marketId];
        const isDust = new BN(rawBalance).lt(DUST_POSITION_AMOUNT_ON_CHAIN);
        if (existingMarketShares && !isDust) {
          const position = getPositionUsdValues(
            marketTransactions,
            rawBalance,
            fixedShareBalance,
            outcomeId,
            exchange,
            account,
            userClaims,
            marketId
          );
          if (position) userBalances[collection][marketId].positions.push(position);
          userBalances[collection][marketId].outcomeSharesRaw[outcomeId] = rawBalance;
          userBalances[collection][marketId].outcomeShares[outcomeId] = fixedShareBalance;
        } else if (!isDust) {
          userBalances[collection][marketId] = {
            ammExchange: exchange,
            positions: [],
            outcomeSharesRaw: exchange.ammOutcomes.map((o) => null) || [],
            outcomeShares: exchange.ammOutcomes.map((o) => null) || [],
          };
          // calc user position here **
          const position = getPositionUsdValues(
            marketTransactions,
            rawBalance,
            fixedShareBalance,
            outcomeId,
            exchange,
            account,
            userClaims,
            marketId
          );
          if (position) userBalances[collection][marketId].positions.push(position);
          userBalances[collection][marketId].outcomeSharesRaw[outcomeId] = rawBalance;
          userBalances[collection][marketId].outcomeShares[outcomeId] = fixedShareBalance;
        }
      }
    } else if (method === ALLOWANCE) {
      userBalances[collection][dataKey] = new BN(rawBalance).gt(ZERO);
    }
  }

  if (finalizedMarkets.length > 0) {
    const keyedFinalizedMarkets = finalizedMarkets.reduce((p, f) => ({ ...p, [f.marketId]: f }), {});
    populateClaimableWinnings(keyedFinalizedMarkets, finalizedAmmExchanges, userBalances.marketShares);
  }

  const totalRewards = Object.values((userBalances.pendingRewards as unknown) as PendingUserReward[])
    .reduce((p, r) => p.plus(new BN(r.balance)), ZERO)
    .toFixed();
  const userPositions = getTotalPositions(userBalances.marketShares);
  let openMarketShares = {};
  Object.keys(userBalances.marketShares).forEach((marketId) => {
    if (userBalances.marketShares[marketId]?.ammExchange?.market?.winner === null) {
      openMarketShares[marketId] = userBalances.marketShares[marketId];
    }
  });
  const availableFundsUsd = String(new BN(userBalances.USDC.usdValue));
  await populateInitLPValues(userBalances.lpTokens, provider, ammExchanges, account);
  const totalCurrentLiquidityUsd = String(
    Object.values((userBalances.lpTokens as unknown) as LPTokenBalance[]).reduce(
      (p, l) => p.plus(new BN(l.usdValue)),
      ZERO
    )
  );
  const totalAccountValue = String(
    new BN(availableFundsUsd).plus(new BN(userPositions.totalPositionUsd)).plus(new BN(totalCurrentLiquidityUsd))
  );
  const userOpenPositions = getTotalPositions(openMarketShares);
  const totalAccountValueOpenOnly = String(
    new BN(availableFundsUsd).plus(new BN(userOpenPositions.totalPositionUsd)).plus(new BN(totalCurrentLiquidityUsd))
  );
  const userOpenPositionsOpenOnly = {
    change24hrPositionUsdOpenOnly: userOpenPositions.change24hrPositionUsd,
    total24hrPositionUsdOpenOnly: userOpenPositions.total24hrPositionUsd,
    totalPositionUsdOpenOnly: userOpenPositions.totalPositionUsd,
  };

  return {
    ...userBalances,
    ...userPositions,
    ...userOpenPositionsOpenOnly,
    totalAccountValueOpenOnly,
    totalAccountValue,
    availableFundsUsd,
    totalCurrentLiquidityUsd,
    totalRewards,
  };
};

const populateClaimableWinnings = (
  finalizedMarkets: MarketInfos = {},
  finalizedAmmExchanges: AmmExchange[] = [],
  marketShares: AmmMarketShares = {}
): void => {
  finalizedAmmExchanges.reduce((p, amm) => {
    const market = finalizedMarkets[amm.marketId];
    const winningOutcome = market.hasWinner ? market.outcomes[market.winner] : null;
    if (winningOutcome) {
      const outcomeBalances = marketShares[amm.marketId];
      const userShares = outcomeBalances?.positions.find((p) => p.outcomeId === winningOutcome.id);
      if (userShares && new BN(userShares?.rawBalance).gt(0)) {
        const claimableBalance = new BN(userShares.balance).minus(new BN(userShares.initCostUsd)).abs().toFixed(4);
        marketShares[amm.marketId].claimableWinnings = {
          claimableBalance,
          userBalances: outcomeBalances.outcomeSharesRaw,
        };
      }
    }
    return p;
  }, {});
};

const getTotalPositions = (
  ammMarketShares: AmmMarketShares
): { change24hrPositionUsd: string; totalPositionUsd: string; total24hrPositionUsd: string } => {
  const result = Object.keys(ammMarketShares).reduce(
    (p, ammId) => {
      const outcomes = ammMarketShares[ammId];
      outcomes.positions.forEach((position) => {
        p.total = p.total.plus(new BN(position.usdValue));
        if (position.past24hrUsdValue) {
          p.total24 = p.total24.plus(new BN(position.past24hrUsdValue));
        }
      });
      return p;
    },
    { total: new BN("0"), total24: new BN("0") }
  );

  const change24hrPositionUsd = String(result.total.minus(result.total24));
  return {
    change24hrPositionUsd,
    total24hrPositionUsd: String(result.total24),
    totalPositionUsd: String(result.total),
  };
};

const getPositionUsdValues = (
  marketTransactions: UserMarketTransactions,
  rawBalance: string,
  balance: string,
  outcome: string,
  amm: AmmExchange,
  account: string,
  userClaims: UserClaimTransactions,
  marketId: string
): PositionBalance => {
  let past24hrUsdValue = null;
  let change24hrPositionUsd = null;
  let avgPrice = "0";
  let initCostUsd = "0";
  let totalChangeUsd = "0";
  let timestamp = 0;
  let quantity = trimDecimalValue(balance);
  const outcomeId = Number(outcome);
  const price = amm.ammOutcomes[outcomeId].price;
  const outcomeName = amm.ammOutcomes[outcomeId].name;
  let visible = false;
  let positionFromAddLiquidity = false;
  let positionFromRemoveLiquidity = false;

  // need to get this from outcome
  const maxUsdValue = new BN(balance).times(new BN(amm.cash.usdPrice)).toFixed();

  let result = {
    avgPrice: "0",
    positionFromRemoveLiquidity: false,
    positionFromAddLiquidity: false,
  };

  const currUsdValue = new BN(balance).times(new BN(price)).times(new BN(amm.cash.usdPrice)).toFixed();
  const postitionResult = getInitPositionValues(marketTransactions, amm, outcome, account, userClaims);

  if (postitionResult) {
    result = postitionResult;
    avgPrice = trimDecimalValue(result.avgPrice);
    initCostUsd = new BN(result.avgPrice).times(new BN(quantity)).toFixed(4);
    timestamp = postitionResult.timestamp;
  }

  let usdChangedValue = new BN(currUsdValue).minus(new BN(initCostUsd));
  // ignore negative dust difference
  if (usdChangedValue.lt(new BN("0")) && usdChangedValue.gt(new BN("-0.001"))) {
    usdChangedValue = usdChangedValue.abs();
  }
  totalChangeUsd = trimDecimalValue(usdChangedValue);
  visible = true;
  positionFromAddLiquidity = !result.positionFromRemoveLiquidity && result.positionFromAddLiquidity;
  positionFromRemoveLiquidity = result.positionFromRemoveLiquidity;

  if (new BN(balance).lt(DUST_POSITION_AMOUNT)) return null;

  return {
    balance,
    quantity,
    rawBalance,
    usdValue: currUsdValue,
    past24hrUsdValue,
    change24hrPositionUsd,
    totalChangeUsd,
    avgPrice,
    initCostUsd,
    outcomeName,
    outcomeId,
    maxUsdValue,
    visible,
    positionFromAddLiquidity,
    positionFromRemoveLiquidity,
    timestamp,
    marketId,
  };
};

export const getLPCurrentValue = async (
  displayBalance: string,
  provider: Web3Provider,
  amm: AmmExchange,
  account: string
): Promise<string> => {
  const { ammOutcomes } = amm;
  if (!ammOutcomes || ammOutcomes.length === 0 || displayBalance === "0") return null;
  const estimate = await estimateLPTokenInShares(amm.id, provider, displayBalance, account, amm.ammOutcomes).catch(
    (e) => {
      console.error("getLPCurrentValue estimation error", e);
      throw e;
    }
  );

  if (estimate && estimate.minAmountsRaw) {
    const totalValueRaw = ammOutcomes.reduce(
      (p, v, i) => p.plus(new BN(estimate.minAmounts[i].amount).times(v.price)),
      ZERO
    );

    return totalValueRaw.times(amm?.cash?.usdPrice).toFixed();
  }
  return null;
};

const populateInitLPValues = async (
  lptokens: LPTokens,
  provider: Web3Provider,
  ammExchanges: AmmExchanges,
  account: string
): Promise<LPTokens> => {
  const marketIds = Object.keys(lptokens);
  for (let i = 0; i < marketIds.length; i++) {
    const marketId = marketIds[i];
    const lptoken = lptokens[marketId];
    const amm = ammExchanges[marketId];
    // sum up enters/exits transaction usd cash values
    const initialCashValueUsd = "0";
    lptoken.initCostUsd = initialCashValueUsd;
    lptoken.usdValue = lptoken?.balance ? await getLPCurrentValue(lptoken.balance, provider, amm, account) : "0";
  }

  return lptokens;
};

export const getUserLpTokenInitialAmount = (
  transactions: AllMarketsTransactions,
  account: string,
  cash: Cash
): { [marketId: string]: string } => {
  return Object.keys(transactions).reduce((p, marketId) => {
    const id = marketId.toLowerCase();
    const adds = (transactions[marketId]?.addLiquidity || [])
      .filter((t) => isSameAddress(t.sender?.id, account))
      .reduce((p, t) => p.plus(new BN(t.collateral || "0").abs()), new BN("0"));
    const removed = (transactions[marketId]?.removeLiquidity || [])
      .filter((t) => isSameAddress(t.sender?.id, account))
      .reduce((p, t) => p.plus(new BN(t.collateral || "0").abs()), new BN("0"));
    const initCostUsd = String(adds.minus(removed));
    return {
      ...p,
      [id]: convertOnChainCashAmountToDisplayCashAmount(initCostUsd, cash.decimals).toFixed(),
    };
  }, {});
};

const getUserTransactions = (transactions: AllMarketsTransactions, account: string): AllUserMarketTransactions => {
  if (!transactions) return {};
  return Object.keys(transactions).reduce((p, marketId) => {
    const id = marketId.toLowerCase();
    const addLiquidity = (transactions[marketId]?.addLiquidity || []).filter((t) =>
      isSameAddress(t.sender?.id, account)
    );
    const removeLiquidity = (transactions[marketId]?.removeLiquidity || []).filter((t) =>
      isSameAddress(t.sender?.id, account)
    );
    const buys = (transactions[marketId]?.trades || []).filter(
      (t) => isSameAddress(t.user, account) && new BN(t.collateral).lt(0)
    );
    const sells = (transactions[marketId]?.trades || []).filter(
      (t) => isSameAddress(t.user, account) && new BN(t.collateral).gt(0)
    );

    return {
      ...p,
      [id]: {
        addLiquidity,
        removeLiquidity,
        buys,
        sells,
      },
    };
  }, {});
};

const getInitPositionValues = (
  marketTransactions: UserMarketTransactions,
  amm: AmmExchange,
  outcome: string,
  account: string,
  userClaims: UserClaimTransactions
): { avgPrice: string; positionFromAddLiquidity: boolean; positionFromRemoveLiquidity: boolean; timestamp: number } => {
  const outcomeId = String(new BN(outcome));
  // sum up trades shares
  const claimTimestamp = lastClaimTimestamp(userClaims?.claimedProceeds, outcomeId, account);
  const sharesEntered = accumSharesPrice(marketTransactions?.buys, outcomeId, account, claimTimestamp);
  const enterAvgPriceBN = sharesEntered.avgPrice;
  const defaultAvgPrice = getDefaultPrice(outcome, amm.weights);

  // get shares from LP activity
  const sharesAddLiquidity = accumLpSharesPrice(
    marketTransactions?.addLiquidity,
    outcomeId,
    account,
    claimTimestamp,
    amm.shareFactor,
    defaultAvgPrice
  );
  const sharesRemoveLiquidity = accumLpSharesPrice(
    marketTransactions?.removeLiquidity,
    outcome,
    account,
    claimTimestamp,
    amm.shareFactor,
    defaultAvgPrice
  );

  const positionFromAddLiquidity = sharesAddLiquidity.shares.gt(ZERO);
  const positionFromRemoveLiquidity = sharesRemoveLiquidity.shares.gt(ZERO);

  const outcomeLiquidityShares = sharesRemoveLiquidity.shares.plus(sharesAddLiquidity.shares);

  const avgPriceLiquidity = outcomeLiquidityShares.gt(0)
    ? sharesAddLiquidity.avgPrice
        .times(sharesAddLiquidity.shares)
        .plus(sharesRemoveLiquidity.avgPrice.times(sharesRemoveLiquidity.shares))
        .div(sharesAddLiquidity.shares.plus(sharesRemoveLiquidity.shares))
    : ZERO;

  const totalShares = outcomeLiquidityShares.plus(sharesEntered.shares);
  const weightedAvgPrice = totalShares.gt(ZERO)
    ? avgPriceLiquidity
        .times(outcomeLiquidityShares)
        .div(totalShares)
        .plus(enterAvgPriceBN.times(sharesEntered.shares).div(totalShares))
    : 0;

  const timestamp = [
    ...(marketTransactions?.addLiquidity || []),
    ...(marketTransactions?.removeLiquidity || []),
    ...(marketTransactions?.buys || []),
    ...(marketTransactions?.sells || []),
  ].reduce((p, v) => (Number(v.timestamp) > p ? Number(v.timestamp) : p), 0);

  return {
    avgPrice: String(weightedAvgPrice),
    positionFromAddLiquidity,
    positionFromRemoveLiquidity,
    timestamp,
  };
};

const accumSharesPrice = (
  transactions: BuySellTransactions[],
  outcome: string,
  account: string,
  cutOffTimestamp: number
): { shares: BN; cashAmount: BN; avgPrice: BN } => {
  if (!transactions || transactions.length === 0) return { shares: ZERO, cashAmount: ZERO, avgPrice: ZERO };
  const result = transactions
    .filter(
      (t) =>
        isSameAddress(t.user, account) && new BN(t.outcome).eq(new BN(outcome)) && Number(t.timestamp) > cutOffTimestamp
    )
    .reduce(
      (p, t) => {
        const shares = p.shares.plus(new BN(t.shares)).abs();
        const cashAmount = p.cashAmount.plus(new BN(t.collateral).abs());
        const accumAvgPrice = new BN(t.collateral).times(new BN(t.price)).abs().plus(p.accumAvgPrice);
        return {
          shares,
          cashAmount,
          accumAvgPrice,
        };
      },
      { shares: ZERO, cashAmount: ZERO, accumAvgPrice: ZERO }
    );
  const avgPrice = result.cashAmount.eq(ZERO) ? ZERO : result.accumAvgPrice.div(result.cashAmount);
  return { shares: result.shares, cashAmount: result.cashAmount, avgPrice };
};

const accumLpSharesPrice = (
  transactions: AddRemoveLiquidity[],
  outcome: string,
  account: string,
  cutOffTimestamp: number,
  shareFactor: string,
  outcomeDefaultAvgPrice: BN
): { shares: BN; cashAmount: BN; avgPrice: BN } => {
  if (!transactions || transactions.length === 0) return { shares: ZERO, cashAmount: ZERO, avgPrice: ZERO };
  const result = transactions
    .filter((t) => isSameAddress(t?.sender?.id, account) && Number(t.timestamp) > cutOffTimestamp)
    .reduce(
      (p, t) => {
        const outcomeShares = new BN(t.sharesReturned[Number(outcome)]);
        let shares = t.sharesReturned && t.sharesReturned.length > 0 ? outcomeShares : ZERO;
        if (shares.gt(ZERO) && shares.lte(DUST_POSITION_AMOUNT_ON_CHAIN)) {
          return p;
        }

        const cashValue = outcomeShares.eq(ZERO)
          ? ZERO
          : outcomeShares.div(new BN(shareFactor)).div(new BN(t.sharesReturned.length)).abs();
        return {
          shares: p.shares.plus(shares),
          cashAmount: p.cashAmount.plus(new BN(cashValue)),
        };
      },
      { shares: ZERO, cashAmount: ZERO }
    );

  return { shares: result.shares, cashAmount: result.cashAmount, avgPrice: new BN(outcomeDefaultAvgPrice) };
};

export const calculateAmmTotalVolApy = (
  amm: AmmExchange,
  transactions: MarketTransactions,
  rewards: RewardsInfo,
  hasWinner: boolean = false
): { apy: string; vol?: number; vol24hr?: number } => {
  const defaultValues = { apy: undefined, vol: null, vol24hr: null };
  if (!amm?.id || (transactions?.addLiquidity || []).length === 0 || Object.keys(transactions).length === 0)
    return defaultValues;
  const { feeDecimal, liquidityUSD, cash, totalSupply } = amm;

  if (totalSupply === "0") return defaultValues;
  const timestamp24hr = Math.floor(new Date().getTime() / 1000 - Number(SEC_IN_DAY));
  // calc total volume
  const volumeTotalUSD = calcTotalVolumeUSD(transactions, cash).toNumber();
  const volumeTotalUSD24hr = calcTotalVolumeUSD(transactions, cash, timestamp24hr).toNumber();

  const sortedAddLiquidity = (transactions?.addLiquidity || []).sort((a, b) =>
    Number(a.timestamp) > Number(b.timestamp) ? 1 : -1
  );
  const startTimestamp = Number(sortedAddLiquidity[0].timestamp);
  const totalTradingVolUSD = volumeTotalUSD || 0;
  if (startTimestamp === 0) return defaultValues;

  const totalFeesInUsd = new BN(totalTradingVolUSD).times(new BN(feeDecimal || "0"));
  const currTimestamp = Math.floor(new Date().getTime() / 1000); // current time in unix timestamp
  const secondsPast = currTimestamp - startTimestamp;
  const pastDays = Math.floor(new BN(secondsPast).div(SEC_IN_DAY).toNumber());
  const maticPrice = defaultMaticPrice; // don't make eth call.
  const rewardsUsd = new BN(rewards.totalRewardsAccrued || "0").times(new BN(maticPrice || "1"));

  const tradeFeeLiquidityPerDay = new BN(liquidityUSD).lte(DUST_LIQUIDITY_AMOUNT)
    ? rewardsUsd.div(new BN(liquidityUSD)).div(new BN(pastDays || 1))
    : rewardsUsd
        .plus(totalFeesInUsd)
        .div(new BN(liquidityUSD))
        .div(new BN(pastDays || 1));

  const tradeFeePerDayInYear =
    hasWinner || !tradeFeeLiquidityPerDay
      ? undefined
      : tradeFeeLiquidityPerDay.times(DAYS_IN_YEAR).abs().times(100).toFixed(4);

  return { apy: tradeFeePerDayInYear, vol: totalTradingVolUSD, vol24hr: volumeTotalUSD24hr };
};

const calcTotalVolumeUSD = (transactions: MarketTransactions, cash: Cash, cutoffTimestamp: number = 0) => {
  const { trades } = transactions;
  const totalCollateral = (trades || []).reduce(
    (p, b) => (Number(b.timestamp) > cutoffTimestamp ? p.plus(new BN(b.collateral).abs()) : p),
    ZERO
  );
  return convertOnChainCashAmountToDisplayCashAmount(totalCollateral, cash.decimals);
};

const lastClaimTimestamp = (transactions: ClaimWinningsTransactions[], outcome: string, account: string): number => {
  if (!transactions || transactions.length === 0) return 0;
  const claims = transactions.filter((c) => isSameAddress(c.receiver, account) && c.outcome === outcome);
  return claims.reduce((p, c) => (Number(c.timestamp) > p ? Number(c.timestamp) : p), 0);
};

const getEthBalance = async (provider: Web3Provider, cashes: Cashes, account: string): Promise<CurrencyBalance> => {
  const ethCash = Object.values(cashes).find((c) => c.name === ETH);
  const ethbalance = await provider.getBalance(account);
  const ethValue = convertOnChainCashAmountToDisplayCashAmount(new BN(String(ethbalance)), 18);

  return {
    balance: String(ethValue),
    rawBalance: String(ethbalance),
    usdValue: ethCash ? String(ethValue.times(new BN(ethCash.usdPrice))) : String(ethValue),
  };
};

export const isAddress = (value) => {
  try {
    return ethers.utils.getAddress(value.toLowerCase());
  } catch {
    return false;
  }
};

export const getContract = (tokenAddress: string, ABI: any, library: Web3Provider, account?: string): Contract => {
  if (!isAddress(tokenAddress) || tokenAddress === NULL_ADDRESS) {
    throw Error(`Invalid 'address' parameter '${tokenAddress}'.`);
  }
  return new Contract(tokenAddress, ABI, getProviderOrSigner(library, account) as any);
};

// const getAmmFactoryContract = (library: Web3Provider, address: string, account?: string): AMMFactory => {
//   return AMMFactory__factory.connect(address, getProviderOrSigner(library, account));
// };

// const getRewardContract = (library: Web3Provider, address: string, account?: string): MasterChef => {
//   return MasterChef__factory.connect(address, getProviderOrSigner(library, account));
// };

// const getDSContract = (library: Web3Provider, address: string, account?: string): MasterChef => {
//   return MasterChef__factory.connect(address, getProviderOrSigner(library, account));
// };

export const faucetUSDC = async (library: Web3Provider, account?: string) => {
  const { marketFactories } = PARA_CONFIG;
  const usdcContract = marketFactories[0].collateral;
  const amount = ethers.BigNumber.from(10).pow(10); // 10k
  const collateral = Cash__factory.connect(usdcContract, getProviderOrSigner(library, account));
  await collateral.faucet(String(amount));
};

// const getDSContract = (
//   library: Web3Provider,
//   marketFactoryData: MarketFactory,
//   account?: string
//   ): DSContract

// const getMarketFactoryContract = (
//   library: Web3Provider,
//   marketFactoryData: MarketFactory,
//   account?: string
// ): MarketFactoryContract => {
//   return instantiateMarketFactory(
//     marketFactoryData.type,
//     marketFactoryData.subtype,
//     marketFactoryData.address,
//     getProviderOrSigner(library, account)
//   );
// };

// const getAbstractMarketFactoryContract = (
//   library: Web3Provider,
//   address: string,
//   account?: string
// ): AbstractMarketFactoryV2 => {
//   return AbstractMarketFactoryV2__factory.connect(address, getProviderOrSigner(library, account));
// };

// const getBalancerPoolContract = (library: Web3Provider, address: string, account?: string): BPool => {
//   return BPool__factory.connect(address, getProviderOrSigner(library, account));
// };

// returns null on errors
export const getErc20Contract = (tokenAddress: string, library: Web3Provider, account: string): Contract | null => {
  if (!tokenAddress || !library) return null;
  try {
    return getContract(tokenAddress, ERC20ABI, library, account);
  } catch (error) {
    console.error("Failed to get contract", error);
    return null;
  }
};

export const getErc1155Contract = (tokenAddress: string, library: Web3Provider, account: string): Contract | null => {
  if (!tokenAddress || !library) return null;
  try {
    return getContract(tokenAddress, ParaShareTokenABI, library, account);
  } catch (error) {
    console.error("Failed to get contract", error);
    return null;
  }
};

export const getERC20Allowance = async (
  tokenAddress: string,
  provider: Web3Provider,
  account: string,
  spender: string
): Promise<string> => {
  const contract = getErc20Contract(tokenAddress, provider, account);
  const result = await contract.allowance(account, spender);
  const allowanceAmount = String(new BN(String(result)));
  return allowanceAmount;
};

export const getERC1155ApprovedForAll = async (
  tokenAddress: string,
  provider: Web3Provider,
  account: string,
  spender: string
): Promise<boolean> => {
  const contract = getErc1155Contract(tokenAddress, provider, account);
  const isApproved = await contract.isApprovedForAll(account, spender);
  return Boolean(isApproved);
};

const rewardsSupported = (ammFactories: string[]): string[] => {
  // filter out amm factories that don't support rewards, use new flag to determine if amm factory gives rewards
  const rewardable = marketFactories()
    .filter((m) => m.hasRewards)
    .map((m) => m.ammFactory);
  return ammFactories.filter((m) => rewardable.includes(m));
};

export const getRewardsContractAddress = (marketFactoryAddress: string) => {
  // filter out amm factories that don't support rewards, use new flag to determine if amm factory gives rewards
  const marketFactory = marketFactories().find((m) => isSameAddress(m.address, marketFactoryAddress) && m.hasRewards);
  return marketFactory?.masterChef;
};

// adding constants here with special logic
const SUB_OLD_VERSION = "V1";

export const canAddLiquidity = (market: MarketInfo): boolean => {
  const initLiquidity = !market?.amm?.id;
  if (!initLiquidity) return true;
  const data = getMarketFactoryData(market.marketFactoryAddress);
  return data?.subtype !== SUB_OLD_VERSION;
};

const marketFactories = (loadtype: string = MARKET_LOAD_TYPE.SIMPLIFIED): MarketFactory[] =>
  loadtype === MARKET_LOAD_TYPE.SPORT
    ? PARA_CONFIG.marketFactories.filter(
        (c) => c.type !== MARKET_FACTORY_TYPES.CRYPTO && c.type !== MARKET_FACTORY_TYPES.CRYPTO_CURRENCY
      )
    : PARA_CONFIG.marketFactories;

export const getMarketFactoryData = (marketFactoryAddress: string): MarketFactory => {
  const factory = marketFactories().find((m) => m.address.toLowerCase() === marketFactoryAddress.toLowerCase());
  if (!factory) return null;
  return factory;
};

export const ammFactoryMarketNames = (): MarketFactoryNames =>
  PARA_CONFIG.marketFactories.reduce((p, factory) => {
    const isSportsLink = factory.type === MARKET_FACTORY_TYPES.SPORTSLINK;
    return {
      ...p,
      [factory.ammFactory]: isSportsLink ? "NBA & MLB" : factory.description.toUpperCase(),
    };
  }, {});

// stop updating resolved markets
const addToIgnoreList = (
  ignoreList: { [factory: string]: number[] },
  factoryAddress: string,
  marketIndexs: number[]
) => {
  const address = factoryAddress.toUpperCase();
  const factoryList = ignoreList[address] || [];
  const filtered = marketIndexs.filter((i) => !factoryList.includes(i));
  ignoreList[address] = [...factoryList, ...filtered];
};

export const getMarketInfos = async (
  provider: Web3Provider,
  markets: MarketInfos,
  ammExchanges: AmmExchanges,
  account: string,
  ignoreList: { [factory: string]: number[] },
  loadtype: string = MARKET_LOAD_TYPE.SIMPLIFIED,
  blocknumber: number
): Promise<{ markets: MarketInfos; ammExchanges: AmmExchanges; blocknumber: number }> => {
  const factories = marketFactories(loadtype);
  // const addresses_ =   {...addresses["80001"]}
  console.log("factories: ", factories)

  // need to filter for the correct markets.
  const allMarkets = await Promise.all(
    factories.filter((f) => f.hasRewards).map((config) => fetcherMarketsPerConfig(config, provider, account))
  );

  // first market infos get all markets with liquidity
  const aMarkets = allMarkets.reduce((p, data) => ({ ...p, ...data.markets }), {});

  // only updating the markets that were filtered above
  let filteredMarkets = { ...markets, ...aMarkets };

  const newBlocknumber = allMarkets.reduce((p, data) => (p > data.blocknumber ? p : data.blocknumber), 0);

  if (Object.keys(ignoreList).length === 0) {
    filteredMarkets = setIgnoreRemoveMarketList(filteredMarkets, ignoreList, loadtype);
  }
  // console.log('filteredMarkets', filteredMarkets); 
  const exchanges = Object.values(filteredMarkets as MarketInfos).reduce((p, m) => ({ ...p, [m.marketId]: m.amm }), {});
  return { markets: filteredMarkets, ammExchanges: exchanges, blocknumber: newBlocknumber };
};

// import {fetchInitialData, fetchDynamicData} from "@augurproject/smart"
import { isDataTooOld } from "./date-utils";

/**
 * 
 * TODO shouldn't have to hardcode everything for reformatting
 */

const EthersBN_to_Str = (a) => {
  return new BN(String(a)).toNumber().toString()
}


const setIgnoreRemoveMarketList = (
  allMarkets: MarketInfos,
  ignoreList: { [factory: string]: number[] },
  loadtype: string = MARKET_LOAD_TYPE.SIMPLIFIED
): MarketInfos => {
  // <Removal> resolved markets with no liquidity
  // const nonLiqResolvedMarkets = Object.values(allMarkets).filter((m) => !m?.amm?.hasLiquidity && m?.hasWinner);
  //TODO 
  const nonLiqResolvedMarkets = Object.values(allMarkets).filter((m) => !m?.amm?.hasLiquidity && m?.hasWinner &&!m?.shareTokens);

  const sportsMarkets = Object.values(allMarkets).filter((m) => m?.categories[0]== "Sports");
  // console.log(['ignored', ...nonLiqResolvedMarkets]);
  // console.log(['ignored2', ...sportsMarkets]);
  // console.log('allmarkets', allMarkets)
  // <Removal> speard marketw with zero line
  const zeroSpreadMarkets = Object.values(allMarkets).filter(
    (m) => m?.sportsMarketType === SPORTS_MARKET_TYPE.SPREAD && m?.spreadLine === 0 && m.amm.hasLiquidity === false
  );
  // <Removal> MLB spread and over/under
  // <Removal> for sportsbook removing crypto
  const ignoredSportsMarkets = Object.values(allMarkets).filter((m) =>
    isIgnoredMarket(m?.sportId, m?.sportsMarketType)
  );

  const ignoredCrypto =
    loadtype === MARKET_LOAD_TYPE.SPORT
      ? Object.values(allMarkets).filter(({ marketFactoryType }) => marketFactoryType === MARKET_FACTORY_TYPES.CRYPTO)
      : [];

  // <Removal> summer nba open markets
  // TODO: need to allow when NBA season comes around again
  const openNbaV1Markets = Object.values(allMarkets).filter(
    (m) => isIgnoreOpendMarket(m?.sportId, m?.sportsMarketType) && !m.hasWinner
  );

  const ignoreRemovedMarkets = [
    ...ignoredCrypto,
    //...nonLiqResolvedMarkets,
    ...zeroSpreadMarkets,
    ...ignoredSportsMarkets,
    ...openNbaV1Markets,
    ...sportsMarkets,
  ].reduce((p, m) => ({ ...p, [m.marketFactoryAddress]: [...(p[m.marketFactoryAddress] || []), m.turboId] }), {});
  console.log('ignored,', ignoreRemovedMarkets)
  Object.keys(ignoreRemovedMarkets).forEach((factoryAddress) =>
    addToIgnoreList(ignoreList, factoryAddress, ignoreRemovedMarkets[factoryAddress] || [])
  );

  const filteredMarkets = Object.keys(allMarkets).reduce(
    (p, id) =>
      (ignoreRemovedMarkets[allMarkets[id].marketFactoryAddress] || []).includes(allMarkets[id].turboId)
        ? p
        : { ...p, [id]: allMarkets[id] },
    {}
  );

  // <Ignore> resolved markets
  Object.values(filteredMarkets as MarketInfos)
    .filter((m) => m.hasWinner)
    .forEach((m) => addToIgnoreList(ignoreList, m.marketFactoryAddress, [m.turboId]));

  return filteredMarkets;
};

let ABIs = {};
function extractABI(contract: ethers.Contract): any[] {
  if (!contract) {
    console.error("contract is null");
    return null;
  }
  const { address } = contract;
  const abi = ABIs[address];
  if (abi) return abi;

  // Interface.format returns a JSON-encoded string of the ABI when using FormatTypes.json.
  const contractAbi = JSON.parse(contract.interface.format(ethers.utils.FormatTypes.json) as string);
  ABIs[address] = contractAbi;
  return contractAbi;
}

let defaultMaticPrice = 1.34;
export const getMaticUsdPrice = async (library: Web3Provider = null): Promise<number> => {
  if (!library) return defaultMaticPrice;
  const network = await library?.getNetwork();
  if (network?.chainId !== POLYGON_NETWORK) return defaultMaticPrice;
  try {
    const contract = getContract(POLYGON_PRICE_FEED_MATIC, PriceFeedABI, library);
    const data = await contract.latestRoundData();
    defaultMaticPrice = new BN(String(data?.answer)).div(new BN(10).pow(Number(8))).toNumber();
    // get price
  } catch (error) {
    console.error(`Failed to get price feed contract, using ${defaultMaticPrice}`);
    return defaultMaticPrice;
  }
  return defaultMaticPrice;
};

export const getRewardsStatus = async (library: Web3Provider = null): Promise<{ isLow: boolean; isEmpty: boolean }> => {
  const defaultValue = { isLow: false, isEmpty: false };
  if (!library) return defaultValue;
  const factories = marketFactories();
  if (!factories || factories.length === 0) return defaultValue;

  const masterChef = factories[0]?.masterChef;
  const wmatic = WMATIC_TOKEN_ADDRESS;
  const network = await library?.getNetwork();
  if (network?.chainId !== POLYGON_NETWORK) return defaultValue;

  try {
    const contract = getErc20Contract(wmatic, library, null);
    const value = await contract.balanceOf(masterChef);
    const amount = new BN(String(value))
      .div(new BN(10).pow(Number(18)))
      .decimalPlaces(0, 1)
      .toNumber();
    const isLow = amount < REWARDS_AMOUNT_CUTOFF;
    const isEmpty = amount === 0;
    return { isLow, isEmpty };
  } catch (error) {
    console.error(`Failed to get price feed contract, using ${defaultMaticPrice}`);
  }
  return defaultValue;
};