import { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use as chaiUse } from "chai";

import chaiAsPromised from "chai-as-promised";
import {
  AMMFactory,
  BFactory,
  BPool,
  BPool__factory,
  Cash,
  FeePot,
  OwnedERC20,
  OwnedERC20__factory,
  TrustedMarketFactoryV3,
  TrustedMarketFactoryV3__factory,
  Controller, 
  BondingCurve, 
  MarketManager, 
  ReputationNFT,
  Vault,
  CreditLine, 
  CreditLine__factory
} from "../typechain";

import { BigNumber } from "ethers";

describe("Vault", ()=>{
  let owner: SignerWithAddress; 
  let trader: SignerWithAddress; 

  let collateral: Cash; 
  let vault: Vault;
  let creditline: CreditLine; 

  let CreditLine__factory: CreditLine__factory; 

  const principal = 10000000;
  const drawdown = 5000000; 
  const interestAPR = 100000; 
  const duration = 100; 
  const faceValue = 12000000; 
  const marketId = 1; 


  before(async() =>{
    [owner, trader] = await ethers.getSigners();
    collateral = (await ethers.getContract("Collateral")) as Cash; 
    vault = (await ethers.getContract("Vault")) as Vault; 
    CreditLine__factory = (await ethers.getContractFactory("CreditLine")) as CreditLine__factory; 
    creditline = await CreditLine__factory.deploy(
      vault.address, trader.address, principal, interestAPR, duration, faceValue) as CreditLine;

    await creditline.setUtilizer(owner.address); 


  }); 

  it("can deposit", async()=>{

    await collateral.connect(owner).faucet(principal); 
    await collateral.approve(vault.address, principal); 
    await vault.mint(principal.toString(), owner.address);
    expect(await vault.totalAssets()).to.equal(principal); 

  }); 

  it("add proposals", async()=>{
    await vault.addProposal(marketId, principal, interestAPR, duration, faceValue," ", creditline.address); 
  });

  //initiate market when proposal -> when approved, trustmarket, depositIntoInstrument-> 
  //withdraw from instrument 
  it("deposits into market", async()=> {
    await vault.trustInstrument(creditline.address); 
    await vault.depositIntoInstrument(creditline.address, principal ); 
    expect(await collateral.balanceOf(creditline.address)).to.equal(principal);

  });

  it("can drawdown from creditline", async()=>{
    await creditline.drawdown(drawdown); 
    expect(await collateral.balanceOf(owner.address)).to.equal(drawdown); 
    expect(await collateral.balanceOf(creditline.address)).to.equal(drawdown);
  });

  it("can repay to creditline", async()=>{
    await collateral.approve(creditline.address, drawdown); 
    await creditline.repay(drawdown, 0);
    expect(await collateral.balanceOf(creditline.address)).to.equal(principal); 
  });


  it ("withdraws from market", async()=> {
    await vault.withdrawFromInstrument(creditline.address, principal); 
    expect(await collateral.balanceOf(creditline.address)).to.equal(0);
  
  });
})