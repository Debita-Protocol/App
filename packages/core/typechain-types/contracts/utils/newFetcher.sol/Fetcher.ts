/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../common";

export declare namespace Fetcher {
  export type DynamicVaultBundleStruct = {
    vaultId: PromiseOrValue<BigNumberish>;
    totalSupply: PromiseOrValue<BigNumberish>;
  };

  export type DynamicVaultBundleStructOutput = [BigNumber, BigNumber] & {
    vaultId: BigNumber;
    totalSupply: BigNumber;
  };

  export type DynamicMarketBundleStruct = {
    marketId: PromiseOrValue<BigNumberish>;
    phase: MarketManager.MarketPhaseDataStruct;
    longZCB: PromiseOrValue<BigNumberish>;
    shortZCB: PromiseOrValue<BigNumberish>;
    instrument: Vault.InstrumentDataStruct;
    approved_principal: PromiseOrValue<BigNumberish>;
    approved_yield: PromiseOrValue<BigNumberish>;
  };

  export type DynamicMarketBundleStructOutput = [
    BigNumber,
    MarketManager.MarketPhaseDataStructOutput,
    BigNumber,
    BigNumber,
    Vault.InstrumentDataStructOutput,
    BigNumber,
    BigNumber
  ] & {
    marketId: BigNumber;
    phase: MarketManager.MarketPhaseDataStructOutput;
    longZCB: BigNumber;
    shortZCB: BigNumber;
    instrument: Vault.InstrumentDataStructOutput;
    approved_principal: BigNumber;
    approved_yield: BigNumber;
  };

  export type CollateralBundleStruct = {
    addr: PromiseOrValue<string>;
    symbol: PromiseOrValue<string>;
    decimals: PromiseOrValue<BigNumberish>;
  };

  export type CollateralBundleStructOutput = [string, string, BigNumber] & {
    addr: string;
    symbol: string;
    decimals: BigNumber;
  };

  export type StaticVaultBundleStruct = {
    vaultId: PromiseOrValue<BigNumberish>;
    marketIds: PromiseOrValue<BigNumberish>[];
    default_params: MarketManager.MarketParametersStruct;
    onlyVerified: PromiseOrValue<boolean>;
    r: PromiseOrValue<BigNumberish>;
    asset_limit: PromiseOrValue<BigNumberish>;
    total_asset_limit: PromiseOrValue<BigNumberish>;
    collateral: Fetcher.CollateralBundleStruct;
  };

  export type StaticVaultBundleStructOutput = [
    BigNumber,
    BigNumber[],
    MarketManager.MarketParametersStructOutput,
    boolean,
    BigNumber,
    BigNumber,
    BigNumber,
    Fetcher.CollateralBundleStructOutput
  ] & {
    vaultId: BigNumber;
    marketIds: BigNumber[];
    default_params: MarketManager.MarketParametersStructOutput;
    onlyVerified: boolean;
    r: BigNumber;
    asset_limit: BigNumber;
    total_asset_limit: BigNumber;
    collateral: Fetcher.CollateralBundleStructOutput;
  };

  export type StaticMarketBundleStruct = {
    marketId: PromiseOrValue<BigNumberish>;
    creationTimestamp: PromiseOrValue<BigNumberish>;
    long: PromiseOrValue<string>;
    short: PromiseOrValue<string>;
    parameters: MarketManager.MarketParametersStruct;
  };

  export type StaticMarketBundleStructOutput = [
    BigNumber,
    BigNumber,
    string,
    string,
    MarketManager.MarketParametersStructOutput
  ] & {
    marketId: BigNumber;
    creationTimestamp: BigNumber;
    long: string;
    short: string;
    parameters: MarketManager.MarketParametersStructOutput;
  };
}

export declare namespace MarketManager {
  export type MarketPhaseDataStruct = {
    duringAssessment: PromiseOrValue<boolean>;
    onlyReputable: PromiseOrValue<boolean>;
    resolved: PromiseOrValue<boolean>;
    alive: PromiseOrValue<boolean>;
    atLoss: PromiseOrValue<boolean>;
    base_budget: PromiseOrValue<BigNumberish>;
  };

  export type MarketPhaseDataStructOutput = [
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    BigNumber
  ] & {
    duringAssessment: boolean;
    onlyReputable: boolean;
    resolved: boolean;
    alive: boolean;
    atLoss: boolean;
    base_budget: BigNumber;
  };

  export type MarketParametersStruct = {
    N: PromiseOrValue<BigNumberish>;
    sigma: PromiseOrValue<BigNumberish>;
    alpha: PromiseOrValue<BigNumberish>;
    omega: PromiseOrValue<BigNumberish>;
    delta: PromiseOrValue<BigNumberish>;
    r: PromiseOrValue<BigNumberish>;
    s: PromiseOrValue<BigNumberish>;
    steak: PromiseOrValue<BigNumberish>;
  };

  export type MarketParametersStructOutput = [
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber
  ] & {
    N: BigNumber;
    sigma: BigNumber;
    alpha: BigNumber;
    omega: BigNumber;
    delta: BigNumber;
    r: BigNumber;
    s: BigNumber;
    steak: BigNumber;
  };
}

export declare namespace Vault {
  export type InstrumentDataStruct = {
    trusted: PromiseOrValue<boolean>;
    balance: PromiseOrValue<BigNumberish>;
    faceValue: PromiseOrValue<BigNumberish>;
    marketId: PromiseOrValue<BigNumberish>;
    principal: PromiseOrValue<BigNumberish>;
    expectedYield: PromiseOrValue<BigNumberish>;
    duration: PromiseOrValue<BigNumberish>;
    description: PromiseOrValue<string>;
    Instrument_address: PromiseOrValue<string>;
    instrument_type: PromiseOrValue<BigNumberish>;
    maturityDate: PromiseOrValue<BigNumberish>;
  };

  export type InstrumentDataStructOutput = [
    boolean,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    string,
    string,
    number,
    BigNumber
  ] & {
    trusted: boolean;
    balance: BigNumber;
    faceValue: BigNumber;
    marketId: BigNumber;
    principal: BigNumber;
    expectedYield: BigNumber;
    duration: BigNumber;
    description: string;
    Instrument_address: string;
    instrument_type: number;
    maturityDate: BigNumber;
  };
}

export interface FetcherInterface extends utils.Interface {
  functions: {
    "fetchDynamic(address,address,uint256,uint256)": FunctionFragment;
    "fetchInitial(address,address,uint256,uint256)": FunctionFragment;
    "isUnresolvedMarket(uint256,address)": FunctionFragment;
    "marketType()": FunctionFragment;
    "version()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "fetchDynamic"
      | "fetchInitial"
      | "isUnresolvedMarket"
      | "marketType"
      | "version"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "fetchDynamic",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "fetchInitial",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "isUnresolvedMarket",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "marketType",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "version", values?: undefined): string;

  decodeFunctionResult(
    functionFragment: "fetchDynamic",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "fetchInitial",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isUnresolvedMarket",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "marketType", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "version", data: BytesLike): Result;

  events: {};
}

export interface Fetcher extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: FetcherInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    fetchDynamic(
      _controller: PromiseOrValue<string>,
      _marketManager: PromiseOrValue<string>,
      _vaultId: PromiseOrValue<BigNumberish>,
      _offset: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [
        Fetcher.DynamicVaultBundleStructOutput,
        Fetcher.DynamicMarketBundleStructOutput[],
        BigNumber
      ]
    >;

    fetchInitial(
      _controller: PromiseOrValue<string>,
      _marketManager: PromiseOrValue<string>,
      _vaultId: PromiseOrValue<BigNumberish>,
      _offset: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [
        Fetcher.StaticVaultBundleStructOutput,
        Fetcher.StaticMarketBundleStructOutput[],
        BigNumber
      ]
    >;

    isUnresolvedMarket(
      marketId: PromiseOrValue<BigNumberish>,
      _marketManager: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    marketType(overrides?: CallOverrides): Promise<[string]>;

    version(overrides?: CallOverrides): Promise<[string]>;
  };

  fetchDynamic(
    _controller: PromiseOrValue<string>,
    _marketManager: PromiseOrValue<string>,
    _vaultId: PromiseOrValue<BigNumberish>,
    _offset: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<
    [
      Fetcher.DynamicVaultBundleStructOutput,
      Fetcher.DynamicMarketBundleStructOutput[],
      BigNumber
    ]
  >;

  fetchInitial(
    _controller: PromiseOrValue<string>,
    _marketManager: PromiseOrValue<string>,
    _vaultId: PromiseOrValue<BigNumberish>,
    _offset: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<
    [
      Fetcher.StaticVaultBundleStructOutput,
      Fetcher.StaticMarketBundleStructOutput[],
      BigNumber
    ]
  >;

  isUnresolvedMarket(
    marketId: PromiseOrValue<BigNumberish>,
    _marketManager: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  marketType(overrides?: CallOverrides): Promise<string>;

  version(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    fetchDynamic(
      _controller: PromiseOrValue<string>,
      _marketManager: PromiseOrValue<string>,
      _vaultId: PromiseOrValue<BigNumberish>,
      _offset: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [
        Fetcher.DynamicVaultBundleStructOutput,
        Fetcher.DynamicMarketBundleStructOutput[],
        BigNumber
      ]
    >;

    fetchInitial(
      _controller: PromiseOrValue<string>,
      _marketManager: PromiseOrValue<string>,
      _vaultId: PromiseOrValue<BigNumberish>,
      _offset: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [
        Fetcher.StaticVaultBundleStructOutput,
        Fetcher.StaticMarketBundleStructOutput[],
        BigNumber
      ]
    >;

    isUnresolvedMarket(
      marketId: PromiseOrValue<BigNumberish>,
      _marketManager: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    marketType(overrides?: CallOverrides): Promise<string>;

    version(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    fetchDynamic(
      _controller: PromiseOrValue<string>,
      _marketManager: PromiseOrValue<string>,
      _vaultId: PromiseOrValue<BigNumberish>,
      _offset: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    fetchInitial(
      _controller: PromiseOrValue<string>,
      _marketManager: PromiseOrValue<string>,
      _vaultId: PromiseOrValue<BigNumberish>,
      _offset: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isUnresolvedMarket(
      marketId: PromiseOrValue<BigNumberish>,
      _marketManager: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    marketType(overrides?: CallOverrides): Promise<BigNumber>;

    version(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    fetchDynamic(
      _controller: PromiseOrValue<string>,
      _marketManager: PromiseOrValue<string>,
      _vaultId: PromiseOrValue<BigNumberish>,
      _offset: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    fetchInitial(
      _controller: PromiseOrValue<string>,
      _marketManager: PromiseOrValue<string>,
      _vaultId: PromiseOrValue<BigNumberish>,
      _offset: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isUnresolvedMarket(
      marketId: PromiseOrValue<BigNumberish>,
      _marketManager: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    marketType(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    version(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
