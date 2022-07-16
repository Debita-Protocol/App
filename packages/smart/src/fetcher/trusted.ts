import { AMMFactory, TrustedFetcher, TrustedMarketFactoryV3, MasterChef } from "../../typechain";
import { BigNumber, BigNumberish } from "ethers";
import {
  createDynamicMarketBundle,
  createMarketFactoryBundle,
  createStaticMarketBundle,
  DynamicMarketBundle,
  MarketFactoryBundle,
  RawDynamicMarketBundle,
  RawStaticMarketBundle,
  StaticMarketBundle,
} from "./common";

export async function fetchInitialTrusted(
  fetcher: TrustedFetcher,
  marketFactory: TrustedMarketFactoryV3,
  ammFactory: AMMFactory,
  masterChef: MasterChef,
  initialOffset: BigNumberish = 0,
  bundleSize: BigNumberish = 50
): Promise<{
  factoryBundle: MarketFactoryBundle;
  markets: InitialTrustedMarket[];
  timestamp: BigNumber | null;
}> {
  const marketCount = await marketFactory.marketCount();

  let factoryBundle: MarketFactoryBundle | undefined;
  let markets: StaticTrustedMarketBundle[] = [];
  let timestamp: BigNumber | null = null;
  console.log( 'contractcalls1',  marketFactory.address,
      ammFactory.address,
      masterChef.address,
      
      bundleSize)

  for (let offset = BigNumber.from(initialOffset); ; ) {
    const [rawFactoryBundle, rawMarketBundles, lowestMarketIndex, _timestamp] = await fetcher.fetchInitial(
      marketFactory.address,
      ammFactory.address,
      masterChef.address,
      offset,
      bundleSize
    );
console.log('contract calls2',   rawFactoryBundle, rawMarketBundles, lowestMarketIndex.toString(), _timestamp)

    if (timestamp === null || _timestamp < timestamp) timestamp = _timestamp;

    if (!factoryBundle) factoryBundle = createMarketFactoryBundle(rawFactoryBundle._super);
    markets = markets.concat(rawMarketBundles.map(createStaticTrustedMarketBundle));

    if (lowestMarketIndex.lte(1)) break; // don't grab the 0th market, which is fake
    offset = marketCount.sub(lowestMarketIndex);
  }

  return { factoryBundle, markets, timestamp };
}

export async function fetchDynamicTrusted(
  fetcher: TrustedFetcher,
  marketFactory: TrustedMarketFactoryV3,
  ammFactory: AMMFactory,
  // masterChef: MasterChef,
  initialOffset: BigNumberish = 0,
  bundleSize: BigNumberish = 50
): Promise<{ markets: DynamicTrustedMarketBundle[]; timestamp: BigNumber | null }> {
  const marketCount = await marketFactory.marketCount();

  let markets: DynamicTrustedMarketBundle[] = [];
  let timestamp: BigNumber | null = null;

  for (let offset = BigNumber.from(initialOffset); ; ) {
    const [rawMarketBundles, lowestMarketIndex, _timestamp] = await fetcher.fetchDynamic(
      marketFactory.address,
      ammFactory.address,
      // masterChef.address,
      offset,
      bundleSize
    );

    if (timestamp === null || _timestamp < timestamp) timestamp = _timestamp;

    markets = markets.concat(rawMarketBundles.map(createDynamicTrustedMarketBundle));

    if (lowestMarketIndex.lte(1)) break;
    offset = marketCount.sub(lowestMarketIndex);
  }

  return { markets, timestamp };
}

export interface InitialTrustedMarket extends StaticMarketBundle {
  // coinIndex: BigNumberish;
  // creationValue: BigNumberish;
  // resolutionValue: BigNumberish;
  // resolutionTime: BigNumberish;
  description: string;
}

function createStaticTrustedMarketBundle(
  raw: RawStaticTrustedMarketBundle
): StaticTrustedMarketBundle {
  return {
    ...createStaticMarketBundle(raw._super),
    // coinIndex: raw.coinIndex,
    // creationValue: raw.creationValue,
    // resolutionValue: raw.resolutionValue,
    // resolutionTime: raw.resolutionTime,
    description: raw.description
  };
}

interface StaticTrustedMarketBundle extends StaticMarketBundle {
  // coinIndex: BigNumberish;
  // creationValue: BigNumberish;
  // resolutionValue: BigNumberish;
  // resolutionTime: BigNumberish;
    description: string;

}

interface RawStaticTrustedMarketBundle {
  _super: RawStaticMarketBundle;
  // coinIndex: BigNumberish;
  // creationValue: BigNumberish;
  // resolutionValue: BigNumberish;
  // resolutionTime: BigNumberish;
    description: string;

}

export interface DynamicTrustedMarketBundle extends DynamicMarketBundle {
  //resolutionValue: BigNumberish;
    description: string;

}

interface RawDynamicTrustedMarketBundle {
  _super: RawDynamicMarketBundle;
  // resolutionValue: BigNumberish;
      description: string;

}

function createDynamicTrustedMarketBundle(
  raw: RawDynamicTrustedMarketBundle
): DynamicTrustedMarketBundle {
  return {
    ...createDynamicMarketBundle(raw._super),
    description: raw.description,
  };
}
