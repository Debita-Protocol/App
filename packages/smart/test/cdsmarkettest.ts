
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { BigNumber } from "ethers";

//owner[0] is going to be Debita(lendingpool)
//owner[1] is going to be the 
export async function main() {
  const ds_factory = await ethers.getContractFactory("DS")
  const ds = await ds_factory.deploy()
  const ammFactory_factory = await ethers.getContractFactory("AMMFactory")
  const ammFactory = await ammFactory_factory.deploy()
  const marketFactory_factory = await ethers.getContractFactory("CDSMarketFactory")
  const marketFactory = await marketFactory_factory.deploy()
  const collateral_factory = await ethers.getContractFactory("Collateral")
  const collateral = await collateral_factory.deploy();
  console.log('collateral address', collateral.address)
  const lendingpool_factory = await ethers.getContractFactory("LendingPool")
  const lendingpool = await lendingpool_factory.deploy()

 const owners = await ethers.getSigners()
 console.log('owners', owners[0].address, owners[1].address)

//await ds.addPool(lendingpool.address)
await collateral.connect(owners[0]).faucet(100000000000)
await collateral.connect(owners[1]).faucet(100000000000)
//await collateral.connect(owners[1]).faucet(600000000)
//await collateral.connect(owners[0]).approve(lendingpool.address, 100000000000)
//await lendingpool.mintDS(10000000000 ,1) 



var exp  = BigNumber.from("10").pow(18)
const weight1 = BigNumber.from("2").mul(exp)
const weight2 = BigNumber.from("48").mul(exp)

// const index = await marketFactory.createMarket(owners[0].address, 
//   "testCDS", ['longCDS', 'shortCDS'], [weight1, weight2] )

//console.log('Market Created', index.toString())


const market = await marketFactory.getMarket(1)
console.log('market',market)
const {shareTokens} = market 
console.log('sharetokens',shareTokens)
console.log(shareTokens.address)

await collateral.connect(owners[0]).approve(ammFactory.address, 100000000000)
await collateral.connect(owners[1]).approve(ammFactory.address, 100000000000)
//const lptokenbalance = await ammFactory.createPool( marketFactory.address, 1, 100000000000, owners[0].address)
const lptokenbalance2 = await ammFactory.getPoolTokenBalance(
        marketFactory.address, 1, owners[0].address
    )
console.log('lptokenbalance',  lptokenbalance2.toString())

const tokenratio1 = await ammFactory.tokenRatios(marketFactory.address, 1)
const poolbalance1 = await ammFactory.getPoolBalances(marketFactory.address, 1)
//await ammFactory.connect(owners[1]).buy(marketFactory.address, 1, 1, 1000000000, 0)
const tokenratio2 = await ammFactory.tokenRatios(marketFactory.address, 1)
const poolbalance2 = await ammFactory.getPoolBalances(marketFactory.address, 1)

console.log('tokenratios', tokenratio1[0].toString(), tokenratio1[1].toString(),
	tokenratio2[0].toString(),tokenratio2[1].toString())

console.log('poolbalances', poolbalance1[0].toString(), poolbalance1[1].toString(),
	poolbalance2[0].toString(),poolbalance2[1].toString())

const amount = BigNumber.from("99").mul(exp)
await ammFactory.removeLiquidity(marketFactory.address,1,amount, 0,owners[0].address )

// const _totalDesiredOutcome = await ammFactory.buy(
//        marketFactory.address, 1, 0, 100000, 1
      
//     )     function removeLiquidity(


// console.log('totaldesieredoutcome', _totalDesiredOutcome)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
