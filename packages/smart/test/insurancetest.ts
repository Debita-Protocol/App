
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { BigNumber } from "ethers";


export async function main() {

//   const collateral = await ethers.getContract("Collateral")
//   const locker = await ethers.getContract("iDSLocker")
//   const insurance = await ethers.getContract('iDS')
//   const owners = await ethers.getSigners();
// await collateral.connect(owners[0]).faucet(100000000000)

//   console.log('hey', owners[0].address)
//   await collateral.connect(owners[0]).approve(locker.address, 10000000000)
//     console.log('hey2')

//   await locker.createLock(owners[0].address, 10000000000, 100)
//     console.log('hey3')

//   const balance = await insurance.balanceOf(owners[0].address)
//   console.log('balance', balance.toString())
  // await collateral.connect(owners[0]).faucet(100000000000)


  // await ds.addPool(lendingpool.address)
  // await dss.addPool(lendingpool.address)

  // await collateral.connect(owners[0]).approve(collateral.address, 100000000000)
  // await collateral.connect(owners[0]).approve(lendingpool.address, 100000000000)
  // await ds.connect(owners[0]).approve(lendingpool.address, 100000000000)
  // await lendingpool.mintDS(10000000000 ,1)
  // await lendingpool.mintDS(10000000000 ,1)

 //  await lendingpool.connect(owners[0]).redeemDS(10000000000, 1, 1)
 // await lendingpool.connect(owners[0]).collectRedemption(0)


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
