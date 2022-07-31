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
  const marketmanager = await ethers.getContract("MarketManager")
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
  await ammFactory.buyZCB(marketFactory.address,owners[0].address,
   bondingcurve.address, 1, amountIn)
  zcb_balance = await bondingcurve.getZCB_balance(0, owners[0].address)
  console.log('balance', zcb_balance.toString())
  await ammFactory.sellZCB(marketFactory.address, owners[0].address, 
  	bondingcurve.address, 1, zcb_balance-15000000) 
  zcb_balance = await bondingcurve.getZCB_balance(0, owners[0].address)
  console.log('balance', zcb_balance.toString())

  var canbuy = await marketmanager.canBuy(owners[0].address,ammFactory.address, 
  marketFactory.address, 100, 1 )
  console.log(canbuy)
  var bcbalance = await collateral.balanceOf(bondingcurve.address)
  console.log('bcbalance', bcbalance.toString())


  //MATURITY TESTS
  await bondingcurve.addManager(marketmanager.address)
  await bondingcurve.curve_init(1)
  await collateral.approve(ammFactory.address,100000000 )
  for(let i=0; i< 5; i++){
  	var amount = 1000000 * (i+1)

  	await ammFactory.buyZCB(marketFactory.address,owners[0].address,
   bondingcurve.address, 1, amount)
  }
  var totalPurchased = await bondingcurve.getTotalPurchased(1)
  var totalCollateral = await bondingcurve.getBondFunds(1)
  zcb_balance = await bondingcurve.getZCB_balance(1, owners[0].address)
  console.log('my zcb balance', zcb_balance.toString())
  var principal_loss = 2000000
  console.log("totalpurchased, totalcollateral", totalPurchased.toString(), totalCollateral.toString())
  //await marketmanager.initiate_bonding_curve(1) 
  await marketmanager.update_redemption_price(1, true, 0,principal_loss)
  var redemptionprice = await marketmanager.get_redemption_price(1)
  console.log('redemptionprice', redemptionprice.toString())

  bcbalance = await collateral.balanceOf(bondingcurve.address)
  console.log('bcbalance before burn', bcbalance.toString())
  await marketmanager.handle_maturity(1, true, principal_loss)
  bcbalance = await collateral.balanceOf(bondingcurve.address)
  console.log('bcbalance after', bcbalance.toString()) 

  var mybalance = await collateral.balanceOf(owners[0].address)
  console.log('mybalance before redeem',mybalance.toString() )
  await marketmanager.redeem(1, marketFactory.address, owners[0].address, zcb_balance/2)
  mybalance = await collateral.balanceOf(owners[0].address)
  zcb_balance = await bondingcurve.getZCB_balance(1, owners[0].address)

  console.log("zcbbalance,mybalance now", zcb_balance.toString(),mybalance.toString())


  
  
 



// bondingcurve.on('Bought', (buyer, amountOut) => console.log(buyer, amountOut.toString()))

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
