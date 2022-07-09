import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"
const { expect } = require("chai");
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import type {
  LendingPool__factory,
  LendingPool,
  DS,
  DSS,
  DS__factory,
  DSS__factory,
  Cash__factory,
  Cash
} from "../typechain";

import { BigNumber } from "ethers";


describe.only("LendingPool", function () {
    let LPool_Factory: LendingPool__factory;
    let Cash_Factory: Cash__factory;
    let DS_Factory: DS__factory;
    let DSS_Factory: DSS__factory;
    let LPool: LendingPool;
    let ds_token: DS;
    let dss_token: DSS;
    let collateral_token: Cash;

    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;
    let owner : SignerWithAddress;

    before(async () => {
      [owner, signer1, signer2] = await ethers.getSigners();
      const deployer_address = owner.address;
      const timelock_addr = signer2.address;
      console.log(deployer_address);
      console.log(timelock_addr);

      DS_Factory = await ethers.getContractFactory("DS");
      
      DSS_Factory = await ethers.getContractFactory("DSS");
      Cash_Factory = await ethers.getContractFactory("Cash");
      
      ds_token = await DS_Factory.deploy(signer1.address, timelock_addr);
      await ds_token.deployed();
      
      dss_token = await DSS_Factory.deploy(signer1.address, timelock_addr);
      await dss_token.deployed();

      collateral_token = await Cash_Factory.deploy("Test Collateral", "CLT", 18);

      LPool_Factory = await ethers.getContractFactory("LendingPool");
      LPool = await LPool_Factory.deploy(
        ds_token.address, 
        dss_token.address, 
        collateral_token.address,
        deployer_address,
        timelock_addr
      );
      await LPool.deployed();
      });
    it("Should allow someone to register and then be approved", async function () {

      const proposal_fee: BigNumber = await LPool.proposal_fee();
      await collateral_token.connect(signer1).increaseAllowance(LPool.address, proposal_fee);
      await collateral_token.connect(signer1).faucet(ethers.utils.parseEther("10"));

      let tx = await LPool.connect(signer1).registerBorrower();
      await tx.wait();

      const user_addr = signer1.address;
      expect(await LPool.isRegistered(user_addr)).to.equal(true);
      
      
      const principal = ethers.utils.parseEther("1.0");
      const total_debt = ethers.utils.parseEther("2.0");
      const duration = BigNumber.from(60*60*24*7);
      tx = await LPool.submitProposal(
        user_addr, 
        principal,
        total_debt,
        duration,
        ds_token.address 
      );

      await tx.wait();

      const borrowerData = await LPool.getBorrowerData(user_addr);
      let borrowStatus = await LPool.isBorrower(user_addr);

      expect(borrowerData.duration).to.equal(duration);
      expect(borrowerData.principal).to.equal(principal);
      expect(borrowStatus).to.equal(false);

      tx = await LPool.connect(owner).approveBorrower(user_addr);
      await tx.wait();

      borrowStatus = await LPool.isBorrower(user_addr);
      expect(borrowStatus).to.equal(true);
    });
})