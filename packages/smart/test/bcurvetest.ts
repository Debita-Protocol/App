// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { BigNumber } from "ethers";


export async function main() {

  const ammFactory = await ethers.getContract("AMMFactory")
  const marketFactory = await ethers.getContract("TrustedMarketFactoryV3")
  const bondingcurve =await ethers.getContract("BondingCurve")
  const owners = await ethers.getSigners();
  const collateral = await ethers.getContract("Collateral")
  await collateral.connect(owners[0]).faucet(100000000000)


  var zcb_balance = await bondingcurve.getZCB_balance(0, owners[0].address)
  console.log("Prior ZCB balance", zcb_balance.toString())

  const amountIn = 10000000000
  await collateral.approve(bondingcurve.address,amountIn )
  const num = await bondingcurve.callStatic.buy(marketFactory.address, owners[0].address, 
  	amountIn, 0)
  zcb_balance = await bondingcurve.getZCB_balance(0, owners[0].address)
  console.log('amountout', num.toString(), zcb_balance.toString())

  const n = await bondingcurve.getBondFunds(0)
  console.log(n.toString())

  const index = await marketFactory.createZCBMarket(owners[0].address, 
  	"ZCBtest", "zcb", [0,0], bondingcurve.address)
  const market = await marketFactory.getMarket(1)
  console.log(market)

  await collateral.approve(ammFactory.address,amountIn )
  await ammFactory.buyZCB(marketFactory.address, bondingcurve.address, 1, amountIn)
  zcb_balance = await bondingcurve.getZCB_balance(0, owners[0].address)
  console.log('balance', zcb_balance.toString())
  await ammFactory.sellZCB(marketFactory.address, bondingcurve.address, 1, zcb_balance) 
  zcb_balance = await bondingcurve.getZCB_balance(0, owners[0].address)
  console.log('balance', zcb_balance.toString())


 



// bondingcurve.on('Bought', (buyer, amountOut) => console.log(buyer, amountOut.toString()))

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
