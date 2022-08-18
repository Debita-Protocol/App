import { Web3Provider } from "@ethersproject/providers";
import {
  MarketFactory,
  fetchInitialTrusted,
  instantiateMarketFactory,
  AMMFactory__factory,
  instantiateFetcher,
  TrustedFetcher,
  TrustedMarketFactoryV3,
  MasterChef__factory,
} from "@augurproject/smart";

import { getProviderOrSigner } from "../components/ConnectAccount/utils";
import { decodeBaseMarketFetcher, decodeMarketDetailsFetcher } from "./derived-market-data";
import { isDataTooOld } from "./date-utils";
import {getBondingCurvePrice} from "./contract-calls"; 
import { BigNumber as BN } from "bignumber.js";

export const fetchContractData = async (config: MarketFactory, provider: Web3Provider, account: string) => {
  const offset = 0;
  const bundleSize = 2;

  const fetcherContract = (instantiateFetcher(
    config.type,
    config.subtype,
    config.fetcher,
    getProviderOrSigner(provider, account)
  ) as unknown) as TrustedFetcher;

  const marketFactoryContract = (instantiateMarketFactory(
    config.type,
    config.subtype,
    config.address,
    getProviderOrSigner(provider, account)
  ) as unknown) as TrustedMarketFactoryV3;

  const masterChef = MasterChef__factory.connect(config.masterChef, getProviderOrSigner(provider, account));
  const ammFactoryContract = AMMFactory__factory.connect(config.ammFactory, getProviderOrSigner(provider, account));
  // console.log('contract', fetcherContract, 'marketFactoryContract',marketFactoryContract, 
  //   'ammFactoryContract',ammFactoryContract, 'masterChef', masterChef, offset, bundleSize)

  const { factoryBundle, markets, timestamp } = await fetchInitialTrusted(
    fetcherContract,
    marketFactoryContract,
    ammFactoryContract,
    masterChef,
    offset,
    bundleSize
  );
  console.log('factorybundle, markets, timestamp, ', factoryBundle, markets, timestamp)

  if (isDataTooOld(timestamp.toNumber())) {
    console.error(
      "node returned data too old",
      "timestamp",
      new Date(timestamp.toNumber() * 1000).toString(),
      provider.connection.url
    );
    throw new Error("contract data too old");
  }



  const raw_prices = (await Promise.all(
    markets.map(m=>{ return getBondingCurvePrice(account,provider, m.marketId.toString()) })
    ))

  const multiplier = new BN(10).pow(new BN(18));
  const raw_prices_fixed = raw_prices.map(p=> new BN(p).div(multiplier).toFixed())

 




  const factoryDetails = decodeBaseMarketFetcher(factoryBundle);

  const popMarkets = markets
    .map((m) => ({ ...m, ...factoryDetails, sportId: null }))
    .map((m,i) => decodeMarketDetailsFetcher(m, factoryDetails, config, raw_prices_fixed[i] ));


  return popMarkets.reduce((p, m) => ({ ...p, [m.marketId]: m }), {});
};
