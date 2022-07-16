
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
  const owners = await ethers.getSigners();
  console.log('manager/collateral/ds/lendingpool address,', manager.address, collateral.address,
  	ds.address,lendingpool.address, owners[0].address)

  //Faucet 
  // await collateral.connect(owners[0]).faucet(100000000000)
  // await collateral.connect(owners[0]).approve(lendingpool.address, 100000000000)
  // await lendingpool.mintDS(50000000000 ,1)
  const initial_c_balance = await collateral.balanceOf(owners[0].address) 
  const initial_ds_balance = await ds.balanceOf(owners[0].address)
  console.log("initial balances", initial_c_balance.toString(), initial_ds_balance.toString())

  //Initiate market 
  await collateral.connect(owners[0]).approve(ammFactory.address, 10000000000)
  var exp  = BigNumber.from("10").pow(18)
  const weight1 = BigNumber.from("2").mul(exp)
  const weight2 = BigNumber.from("48").mul(exp)
  await ds.connect(owners[0]).addPool(lendingpool.address)
  console.log('added to pool')
  await manager.addPool(lendingpool.address)
  await lendingpool.addValidator(owners[0].address, manager.address) 
  console.log(owners[0].address)
  console.log('added validator')
  // await lendingpool.setController(manager.address)
  await masterchef.trustAMMFactory(ammFactory.address)
  // await manager.initiateMarket(ammFactory.address, marketFactory.address, 100000000000,  
  // 	"testCDS", ['longCDS', 'shortCDS'], [weight1, weight2] )
  // console.log('initiated market')
  // var pooltokenamount = await masterchef.getPoolTokenBalance(ammFactory.address, 
  // 	marketFactory.address, 1, manager.address)
  // console.log('Pool added', pooltokenamount.toString())

 await collateral.connect(owners[0]).faucet(1000000000000)
 console.log('faucet')
   const balance = await collateral.balanceOf(owners[0].address) 
  const dsbalance = await ds.balanceOf(owners[0].address)
  console.log("balances", balance.toString(), dsbalance.toString())

// await collateral.connect(owners[0]).approve(lendingpool.address, 5000000000000)
// console.log('owners approved')

//  await lendingpool.mintDS(5000000000000, 0)

//   await manager.resolveMarket(ammFactory.address, marketFactory.address, 1, false)
//    pooltokenamount = await masterchef.getPoolTokenBalance(ammFactory.address, 
//   	marketFactory.address, 1, manager.address)
//    console.log('changed pooltokenamount', pooltokenamount.toString())


// const market = await marketFactory.getMarket(1)
// console.log('market',market)
// const {shareTokens} = market 
// console.log('sharetokens',shareTokens)


// const _totalDesiredOutcome = await ammFactory.buy(
//        marketFactory.address, 1, 0, 100000, 1
      
//     ) 

// console.log('totaldesieredoutcome', _totalDesiredOutcome)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
