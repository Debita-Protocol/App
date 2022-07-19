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

//await ds.addPool(lendingpool.address)
await collateral.connect(owners[0]).faucet(100000000000)
//await collateral.connect(owners[1]).faucet(600000000)
await collateral.connect(owners[0]).approve(lendingpool.address, 100000000000)
await lendingpool.mintDS(10000000000 ,1) 

const prior_balance = await collateral.balanceOf(lendingpool.address); 
console.log("priorbalance", prior_balance.toString())

const borrower_address = owners[1].address
await lendingpool.addBorrower(borrower_address, 5000000000, 5500000000, 1000, collateral.address )
const isborrower = await lendingpool.isBorrower(borrower_address)

const prior_data = await lendingpool.getBorrowerData(borrower_address) 
const {principal, totalDebt, amountRepaid, duration,repaymentDate, recipient  } = prior_data
console.log('PRIOR',isborrower.toString(), principal.toString(),  totalDebt.toString(),amountRepaid.toString())
await lendingpool.connect(owners[1]).borrow(5000000000)
const borrower_borrow_balance = await collateral.balanceOf(borrower_address)
console.log('borrower_borrow_balance ', borrower_borrow_balance.toString())


const loandata = await lendingpool.get_loan_data()
const {_total_borrowed_amount} = loandata
console.log('total_borrowed_amount', _total_borrowed_amount.toString())

await collateral.connect(owners[1]).approve(lendingpool.address, 5500000000)
await lendingpool.connect(owners[1]).repay(5000000000, 500000000)
const borrower_repay_balance = await collateral.balanceOf(borrower_address)
console.log('borrower_repay_balance ', borrower_repay_balance.toString())
const isborrower2 = await lendingpool.isBorrower(borrower_address)

const after_data = await lendingpool.getBorrowerData(borrower_address) 
const {principal2, totalDebt2, amountRepaid2, duration2,repaymentDate2, recipient2  } = prior_data
console.log('AFTER',isborrower2.toString())

const after_balance = await collateral.balanceOf(lendingpool.address); 
console.log("after_balance", after_balance.toString())

await collateral.connect(owners[0]).approve(ammFactory.address, 10000000000)

var exp  = BigNumber.from("10").pow(18)
const weight1 = BigNumber.from("5").mul(exp)
const weight2 = BigNumber.from("45").mul(exp)

// const index = await marketFactory.createMarket(owners[0].address, 
//   "testCDS", ['longCDS', 'shortCDS'], [weight1, weight2] )

// console.log('Market Created', index.toString())


const market = await marketFactory.getMarket(1)
console.log('market',market)
const {shareTokens} = market 
console.log('sharetokens',shareTokens)
console.log(shareTokens.address)
// const _totalDesiredOutcome = await ammFactory.buy(
//        marketFactory.address, 1, 0, 100000, 1
      
//     ) 

// console.log('totaldesieredoutcome', _totalDesiredOutcome)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
