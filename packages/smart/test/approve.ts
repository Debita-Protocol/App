
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { BigNumber } from "ethers";

//owner[0] is going to be Debita(lendingpool)
//owner[1] is going to be the 
export async function main() {
  const ds = await ethers.getContract("DS")
  const ammFactory = await ethers.getContract("AMMFactory")
  const marketFactory = await ethers.getContract("TrustedMarketFactoryV3")
  const collateral = await ethers.getContract("Collateral")
  console.log('collateral address', collateral.address)
  const lendingpool = await ethers.getContract("LendingPool")

 const owners = await ethers.getSigners()
 console.log('owners', owners[0].address, owners[1].address)
 console.log('marketfactoryaddress', marketFactory.address)

 await ds.connect(owners[0]).approve(ammFactory.address,10000000000000)
 await ds.connect(owners[1]).approve(ammFactory.address,10000000000000)
 await ds.connect(owners[0]).approve(marketFactory.address, 10000000000000)
  await ds.connect(owners[1]).approve(marketFactory.address, 10000000000000)
console.log('Approved')

// const _totalDesiredOutcome = await ammFactory.buy(
//        marketFactory.address, 1, 0, 100000, 1
      
//     )     function removeLiquidity(


// console.log('totaldesieredoutcome', _totalDesiredOutcome)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
