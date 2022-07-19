import { ethers } from "hardhat";
const { expect } = require("chai");
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/src/signers";
import type {
  LendingPool,
  DS,
  DSS,
  Controller,
  Cash
} from "../typechain";

import { BigNumber, ContractFactory } from "ethers";


describe.only("LendingPool", function () {

    let LPool: LendingPool;
    let ds_token: DS;
    let dss_token: DSS;
    let collateral_token: Cash;
    let controller: Controller;

    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;
    let owner : SignerWithAddress;

    before(async () => {
      [owner, signer1, signer2] = await ethers.getSigners();
      const deployer_address = owner.address;
      const timelock_addr = signer2.address;
      console.log(deployer_address);
      console.log(timelock_addr);


      });
})