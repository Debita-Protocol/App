
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { BigNumber } from "ethers";


export async function main() {

  //Get contracts
  const ds = await ethers.getContract("DS")
  const ammFactory = await ethers.getContract("AMMFactory")
  const marketFactory = await ethers.getContract("TrustedMarketFactoryV3")
  const collateral = await ethers.getContract("Collateral")
  const lendingpool = await ethers.getContract("LendingPool")
  const manager = await ethers.getContract("Manager")
  const masterchef = await ethers.getContract("MasterChef")
  const indexCDS = await ethers.getContract("IndexCDS")
  const owners = await ethers.getSigners();
  console.log('indexCDS address', indexCDS.address)


//await ds.addPool(lendingpool.address)
await collateral.connect(owners[0]).faucet(300000000000)
await collateral.connect(owners[0]).approve(lendingpool.address, 300000000000)
await lendingpool.mintDS(250000000000 ,1) 
console.log('ds address', ds.address)

var exp  = BigNumber.from("10").pow(18)
const weight1 = BigNumber.from("2").mul(exp)
const weight2 = BigNumber.from("48").mul(exp)

// const index = await marketFactory.createMarket(owners[0].address, 
//   "testCDS", ['longCDS', 'shortCDS'], [weight1, weight2] )

// const index2 = await marketFactory.createMarket(owners[0].address, 
//   "testCDS", ['longCDS', 'shortCDS'], [weight1, weight2] )

const marketcount = await marketFactory.marketCount()
console.log('Market Created', marketcount.toString())

const market = await marketFactory.getMarket(2)
const market2 = await marketFactory.getMarket(3)
//console.log('market',market)
const {shareTokens} = market 
const {shareTokens2} = market2
console.log('sharetokens',shareTokens, shareTokens2)

//await collateral.connect(owners[0]).approve(ammFactory.address, 100000000000)
// await ds.approve(ammFactory.address, 250000000000)
// const lptokenbalance = await ammFactory.createPool( marketFactory.address, 2, 100000000000, owners[0].address)
// const lptokenbalance2 = await ammFactory.createPool( marketFactory.address, 3, 100000000000, owners[0].address)
// const lptokenbalance3 = await ammFactory.getPoolTokenBalance(
//         marketFactory.address, 1, owners[0].address
//     )
// console.log('lptokenbalance', lptokenbalance[0].toString(), lptokenbalance[1].toString())

var tokenratio1 = await ammFactory.tokenRatios(marketFactory.address, 2)
var poolbalance1 = await ammFactory.getPoolBalances(marketFactory.address, 2)
//await ammFactory.connect(owners[1]).buy(marketFactory.address, 1, 1, 1000000000, 0)
var tokenratio2 = await ammFactory.tokenRatios(marketFactory.address, 3)
var poolbalance2 = await ammFactory.getPoolBalances(marketFactory.address, 3)

console.log('tokenratios', tokenratio1[0].toString(), tokenratio1[1].toString(),
  tokenratio2[0].toString(),tokenratio2[1].toString())

console.log('poolbalances', poolbalance1[0].toString(), poolbalance1[1].toString(),
  poolbalance2[0].toString(),poolbalance2[1].toString())

await ds.approve(ammFactory.address, 250000000000)
await ds.approve(indexCDS.address, 250000000000)
const lockId = await indexCDS.buyBulk(owners[0].address, marketFactory.address, ammFactory.address,
  [2,3], [0,0], [1000000000,1000000000] )//ids,outcomes,amounts
console.log('lockID', lockId.toString())


tokenratio1 = await ammFactory.tokenRatios(marketFactory.address, 2)
poolbalance1 = await ammFactory.getPoolBalances(marketFactory.address, 2)
tokenratio2 = await ammFactory.tokenRatios(marketFactory.address, 3)
poolbalance2 = await ammFactory.getPoolBalances(marketFactory.address, 3)

console.log('tokenratios', tokenratio1[0].toString(), tokenratio1[1].toString(),
  tokenratio2[0].toString(),tokenratio2[1].toString())

console.log('poolbalances', poolbalance1[0].toString(), poolbalance1[1].toString(),
  poolbalance2[0].toString(),poolbalance2[1].toString())

await indexCDS.sellBulk(owners[0].address, 1, marketFactory.address, ammFactory.address)

tokenratio1 = await ammFactory.tokenRatios(marketFactory.address, 2)
poolbalance1 = await ammFactory.getPoolBalances(marketFactory.address, 2)
tokenratio2 = await ammFactory.tokenRatios(marketFactory.address, 3)
poolbalance2 = await ammFactory.getPoolBalances(marketFactory.address, 3)

console.log('tokenratios', tokenratio1[0].toString(), tokenratio1[1].toString(),
  tokenratio2[0].toString(),tokenratio2[1].toString())

console.log('poolbalances', poolbalance1[0].toString(), poolbalance1[1].toString(),
  poolbalance2[0].toString(),poolbalance2[1].toString())
// const amount = BigNumber.from("99").mul(exp)
// await ammFactory.removeLiquidity(marketFactory.address,1,amount, 0,owners[0].address )
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
