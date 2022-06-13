// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"
//import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

// import { DeployFunction } from "hardhat-deploy/types";
// import { MasterChef__factory } from "../../typechain";
import { BigNumber } from "ethers";


export async function main() {

  const masterChef = await ethers.getContract("MasterChef")
  const ammFactory = await ethers.getContract("AMMFactory")
  const marketFactory = await ethers.getContract("TrustedMarketFactoryV3")
  const marketFactory2 = await ethers.getContract("CryptoCurrencyMarketFactoryV3")
  const collateral = await ethers.getContract("Collateral")
  console.log('collateral address', collateral.address)

 // const fetcher = await ethers.getContract("TrustedFetcher")
  const fetcher2 = await ethers.getContract("CryptoCurrencyFetcher")
  const randomfetcher = await ethers.getContract("TrustedFetcher")
 const owners = await ethers.getSigners();
 console.log('owner address', owners)
console.log('ownerad', owners[1].address)
  await collateral.connect(owners[0]).faucet(100000000000)
await collateral.connect(owners[0]).approve(ammFactory.address, 10000000000)

const market = await marketFactory.getMarket(1)
console.log('market',market)
const {shareTokens} = market 
console.log('sharetokens',shareTokens)
console.log(shareTokens.address)
const _totalDesiredOutcome = await ammFactory.buy(
       marketFactory.address, 1, 0, 100000, 1
      
    ) 

console.log('totaldesieredoutcome', _totalDesiredOutcome)
//   //console.log('owner ad', owner1.address)
//console.log('addresses', fetcher.address, fetcher2.address)

// const bundle = await randomfetcher.getMarket(marketFactory.address, 
//   ammFactory.address, masterChef.address, 0)
// console.log('bundle1', bundle)
// const marketdetails0 = await marketFactory.getMarketDetails(0)
// console.log('marketdetail0', marketdetails0)
// const marketcount = await marketFactory.marketCount()
// console.log('marketcount', marketcount)
// const market0 = await marketFactory.getMarket(0)
// console.log('market0',market0)
// const market1 = await marketFactory.getMarket(1)
// console.log('market1', market1)





// const [rawFactoryBundle, rawMarketBundles, lowestMarketIndex, _timestamp]= await randomfetcher.fetchInitial(marketFactory.address, 
//   ammFactory.address, masterChef.address, 0, 2)
// console.log('bundle', rawFactoryBundle, rawMarketBundles, lowestMarketIndex, _timestamp)


// const marketcount = await marketFactory.marketCount()
// console.log('marketcount', marketcount.toString())
// const market = await marketFactory.getMarket(0)
// console.log('market', market)

// var exp  = BigNumber.from("10").pow(18)
// const weight = BigNumber.from("25").mul(exp)


//     const index = await marketFactory.createMarket(owners[0].address, "market", ['long', 'short'], [weight, weight]
//     	)
//     const marketcount = await marketFactory.marketCount()
//     console.log('market index, count', index.toString(), marketcount.toString())

// const marketdetails = await marketFactory.getMarketDetails(0)

// console.log('marketdetail', marketdetails)
   // const [rawFactoryBundle, rawMarketBundles, lowestMarketIndex, _timestamp] = await fetcher2.connect(owners[1]).fetchInitial(
   //    marketFactory2.address,
   //    ammFactory.address,
   //    masterChef.address,
   //    0,
   //    100,
   //  );

// const bundle = await fetcher.getMarket( marketFactory.address,
//       ammFactory.address,
//       masterChef.address,1)
// console.log(bundle)

//     const [rawFactoryBundle, rawMarketBundles, lowestMarketIndex, _timestamp] = await fetcher.connect(owners[1]).fetchInitial(
//       marketFactory.address,
//       ammFactory.address,
//       masterChef.address,
//       0,
//       100,{ gasLimit: 250000 }
//     );
// console.log(rawFactoryBundle, rawMarketBundles, lowestMarketIndex, _timestamp)

//     const [rawbundles, index, timestamp] = await fetcher.fetchDynamic(      marketFactory.address
//       ,ammFactory.address, 0, 2)

// console.log(rawbundles, index, timestamp)

//   const collateral = await ethers.getContract("Collateral")
//   const owner = await ethers.getSigners()
//   await collateral.connect(owner[0]).faucet(1000000000)
//   await collateral.connect(owner[1]).faucet(1000000000)
//   const usdcbalance1 = await collateral.balanceOf(owner[0].address)
//   var exp  = BigNumber.from("10").pow(18)
//   const weight = BigNumber.from("25").mul(exp)
//   const index = await marketfactory.createMarket(owner[0].address, 
//     "market", ['long', 'short'], [weight, weight])
//     ethers.BigNumber.from("10").pow(18);
// const number = await marketfactory.marketCount()
//   console.log('usdcbalance',usdcbalance1.toString(), 'index', index.toString(), number.toString())

//   await collateral.connect(owner[0]).approve(ammFactory.address, 1000000000)
//   const shares = await marketfactory.calcShares(100000)
//   console.log(shares.toString())
//   ammFactory.connect(owner[0]).createPool(
//     marketfactory.address, 1,
//     1000000000, owner[0].address)

   
// const balances = await ammFactory.getPoolBalances(marketfactory.address, 1)
// console.log(balances.toString())

// await collateral.connect(owner[1]).approve(ammFactory.address, 100000)
// await ammFactory.connect(owner[1]).buy(marketfactory.address, 1, 0, 100000, 1)

// const balances2 = await ammFactory.getPoolBalances(marketfactory.address, 1)
// console.log(balances2.toString())
// const lpbalance = await ammFactory.getPoolTokenBalance(marketfactory.address, 1, owner[0].address)
// console.log('lpbalance', lpbalance.toString())
//await marketfactory.trustedResolveMarket( 7, 0)  

//const addresses = await marketfactory.get_sharetoken_address(1)
//console.log(addresses);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
