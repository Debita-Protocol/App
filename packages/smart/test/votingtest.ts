
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { BigNumber } from "ethers";


export async function main() {

  const collateral = await ethers.getContract("Collateral")
  const voter = await ethers.getContract("VoteTracker")

  const owners = await ethers.getSigners();
  await collateral.connect(owners[0]).faucet(100000000000)

  const _voteSessionKey =  ethers.utils.formatBytes32String('key')
  const _nonce = 1
  const _totalVotes = 20000000000
  const reactorKeys = [ethers.utils.formatBytes32String('one'),
  ethers.utils.formatBytes32String('two')]
  const amounts = [10000000000, 10000000000]
  console.log('params', _voteSessionKey, _nonce, _totalVotes, reactorKeys, amounts)
  await voter.vote(_voteSessionKey, _nonce,_totalVotes, reactorKeys, amounts)

  const votes = await voter.getVotes(reactorKeys[0])
  console.log('votes', votes.toString())

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
