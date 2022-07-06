import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types"
const { expect } = require("chai");
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import type {
  ERC20__factory,
  LendingPool__factory,
  LendingPool,
  DS,
  DSS,
  DS__factory,
  DSS__factory,
  ERC20
} from "../typechain";

import { BigNumber } from "ethers";


describe.only("LendingPool", function () {
    let LPool_Factory: LendingPool__factory;
    let ERC20_Factory: ERC20__factory;
    let DS_Factory: DS__factory;
    let DSS_Factory: DSS__factory;
    let collateral_token: ERC20;
    let LPool: LendingPool;
    let ds_token: DS;
    let dss_token: DSS;

    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;
    let owner : SignerWithAddress;

    before(async () => {
      console.log("hello world");
      [owner, signer1, signer2] = await ethers.getSigners();
      const deployer_address = owner.address;
      const timelock_addr = signer2.address;
      console.log(deployer_address);
      console.log(timelock_addr);

      DS_Factory = await ethers.getContractFactory("DS");
      
      DSS_Factory = await ethers.getContractFactory("DSS");
      
      ds_token = await DS_Factory.deploy("Debita Stablecoin", "DS", signer1.address, timelock_addr);
      await ds_token.deployed();
      
      dss_token = await DSS_Factory.deploy("Debita Share Token", "DSS", signer1.address, timelock_addr);
      await dss_token.deployed();

      LPool_Factory = await ethers.getContractFactory("LendingPool");
      LPool = await LPool_Factory.deploy(
        ds_token.address, 
        dss_token.address, 
        dss_token.address,
        deployer_address,
        timelock_addr
      );
      await LPool.deployed();
      });
    it("Should allow someone to register and then be approved", async function () {

      const proposal_fee: BigNumber = await LPool.getProposalFee();
      await dss_token.connect(signer1).increaseAllowance(LPool.address, proposal_fee);

      let tx = await LPool.connect(signer1).registerBorrower();
      await tx.wait();

      const user_addr = signer1.address;
      expect(await LPool._isRegistered(user_addr)).to.equal(true);
      
      
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

      expect(borrowerData.duration).to.equal(duration);
      expect(borrowerData.principal).to.equal(principal);
    });
})