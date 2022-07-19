
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { BigNumber } from "ethers";

//owner[0] is going to be Debita(lendingpool)
//owner[1] is going to be the 
export async function main() {
  const ds = await ethers.getContractFactory("DS")
  const dss = await ethers.getContractFactory("DSS")

    const collateral = await ethers.getContractFactory("Collateral")

 //  const ammFactory = await ethers.getContract("AMMFactory")
 //  const marketFactory = await ethers.getContract("TrustedMarketFactoryV3")
 //  const collateral = await ethers.getContract("Collateral")
 //  console.log('collateral address', collateral.address)
  const owners = await ethers.getSigners()
  const lendingpool = await ethers.getContractFactory("LendingPool")
  // await dss.connect(owners[0]).addPool(lendingpool.address)
  // console.log('???')
//   await ds.connect(owners[0]).addPool(lendingpool.address)
//   console.log('added pool')


//  await collateral.connect(owners[0]).faucet(1000000000000)
//  console.log('faucet')
// await collateral.connect(owners[0]).approve(lendingpool.address, 1000000000000)
// console.log('owners approved')

//  await lendingpool.mintDS(1000000000000, 0)

 // console.log('owners', owners[0].address, owners[1].address)
 // console.log('marketfactoryaddress', marketFactory.address)

 // await ds.connect(owners[0]).approve(ammFactory.address,10000000000000)
 // await ds.connect(owners[1]).approve(ammFactory.address,10000000000000)
 // await ds.connect(owners[0]).approve(marketFactory.address, 10000000000000)
 //  await ds.connect(owners[1]).approve(marketFactory.address, 10000000000000)

  //await ds.addPool(lendingpool.address)
//console.log('Approved')
 // await lendingpool.connect(owners[0]).mintDS(10000000000, 0)

// const _totalDesiredOutcome = await ammFactory.buy(
//        marketFactory.address, 1, 0, 100000, 1
      
//     )     function removeLiquidity(


// console.log('totaldesieredoutcome', _totalDesiredOutcome)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
