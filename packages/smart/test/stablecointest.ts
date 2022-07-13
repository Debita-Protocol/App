
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { BigNumber } from "ethers";


export async function main() {

  const ds = await ethers.getContract("DS")
  const dss = await ethers.getContract("DSS")
  const lendingpool = await ethers.getContract("LendingPool")
  const collateral = await ethers.getContract("Collateral")
  const owners = await ethers.getSigners();
  console.log('ownerad', owners[0].address)
  console.log('dsaddress', ds.address)
  console.log('dssaddress,', dss.address)
  console.log('collateraladdress', collateral.address)
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
