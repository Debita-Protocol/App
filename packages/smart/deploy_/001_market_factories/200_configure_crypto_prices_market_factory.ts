import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { PriceFeedConfig } from "../../tasks";
import { CryptoCurrencyMarketFactoryV3, CryptoCurrencyMarketFactoryV3__factory } from "../../typechain";
import { PRICE_FEEDS } from "../../src";
import { DeploymentsExtension } from "hardhat-deploy/dist/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deployer, owner } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);

  const marketFactory = CryptoCurrencyMarketFactoryV3__factory.connect(
    (await deployments.get("CryptoCurrencyMarketFactoryV3")).address,
    signer
  );

  if (await shouldAddCoins(marketFactory)) {
    for (const { symbol, priceFeedAddress, imprecision } of await getCoinList(deployments)) {
      if (hre.network.config.live)
        console.log(`Adding coin "${symbol}" to crypto market factory, with feed "${priceFeedAddress}"`);
      await marketFactory.addCoin(symbol, priceFeedAddress, imprecision);
    }
  } else {
    console.log("Not configuring coins for crypto market factory because it already has coins");
  }

  // finished with setup so can now set owner
  if (owner !== deployer) {
    const currentOwner = await marketFactory.getOwner();
    if (currentOwner !== deployer) {
      console.log(
        `Not transferring ownership of crypto market factory because deployer (${deployer}) is not owner (${currentOwner})`
      );
    } else {
      console.log(
        `Transferring ownership of crypto market factory ${marketFactory.address} from ${deployer} to ${owner}`
      );
      await marketFactory.transferOwnership(owner);
    }
  }
};

async function shouldAddCoins(marketFactory: CryptoCurrencyMarketFactoryV3): Promise<boolean> {
  const coinCount = (await marketFactory.getCoins()).length;
  // 1 because index 0 is fake coin, so length of 1 means there are no added coins
  return coinCount == 1;
}

// If the price feeds are specified then use them. Else, use fake coins.
async function getCoinList(deployments: DeploymentsExtension): Promise<PriceFeedConfig[]> {
  return await Promise.all(
    PRICE_FEEDS.map(async (coin) => ({
      symbol: coin.symbol,
      priceFeedAddress: (await deployments.get(coin.deploymentName)).address,
      imprecision: coin.imprecision,
    }))
  );
}

func.tags = ["ConfigureCryptoMarketFactory"];
func.dependencies = ["CryptoMarketFactory"];

export default func;
