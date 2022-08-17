import { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use as chaiUse } from "chai";

import chaiAsPromised from "chai-as-promised";
import {
  AMMFactory,

  Cash,


  Vault,

  TVault, 
  TVault__factory, 
  TToken, 
  TrancheFactory, 
  Splitter, 
  Splitter__factory, 


  TToken__factory, 
  TestVault__factory, 
  TestVault, 
  TrancheMaster,
  StableSwap__factory, 
  StableSwap, 



} from "../typechain";

import { BigNumber,BigNumberish  } from "ethers";

const pp = BigNumber.from(10).pow(18);
const pp__ = BigNumber.from(10).pow(12);
const pp_ = BigNumber.from(10).pow(6);



interface InitParams{
  _want: string; 
  _instruments: string[]; 
  _ratios: BigNumberish[];
  _junior_weight: BigNumberish;
  _promisedReturn: BigNumberish;
  _time_to_maturity: BigNumberish; 
  vaultId: BigNumberish; 
}


//user needs to be able to mint tVault, 
//provide liquidity, 
//see that there is liquidity and buy when there is liquidity 
//join the pool anytime by adding liquidity, buying 
//exit by redeeming anytime, but this is equivalent to merging + redeeming vault 

describe("Cycle", ()=>{
  let owner: SignerWithAddress; 
  let trader: SignerWithAddress; 

  let collateral: Cash; 
  let vault: Vault;
  let trancheFactory: TrancheFactory;

  /// these are instantiated by tranchefactory
  let superVault : TVault; 
  let trancheToken: TToken; 
  let splitter: Splitter; 

  let testVault__factory: TestVault__factory; 

  let testVault1 : TestVault; 
  let testVault2 : TestVault; 


  //let LinearBondingCurve__factory: LinearBondingCurve__factory; 

  const principal = pp_.mul(10);
  const drawdown = 5000000; 
  const interestAPR = 100000; 
  const duration = 10000000; 
  const faceValue = 12000000; 

  const params = {} as InitParams;

  before(async() =>{
    [owner, trader] = await ethers.getSigners();
    collateral = (await ethers.getContract("Collateral")) as Cash; 
    vault = (await ethers.getContract("Vault")) as Vault; 
    trancheFactory = (await ethers.getContract("TrancheFactory")) as TrancheFactory; 

    testVault__factory = (await ethers.getContractFactory("testVault")) as TestVault__factory; 

    testVault1 = await testVault__factory.deploy(collateral.address) as TestVault;
    testVault2 = await testVault__factory.deploy(collateral.address) as TestVault; 
   
  
    await collateral.connect(owner).faucet(500000000000);
    await collateral.connect(trader).faucet(200000000000); 

  }); 

  it("can create a superVault, mint/redeem", async()=>{
    params._want = collateral.address; 
    params._instruments = [testVault1.address, testVault2.address]; 
    params._ratios = [pp_.mul(7).div(10), pp_.mul(3).div(10)]; 
    params._junior_weight = pp_.mul(3).div(10); 
    params._promisedReturn = pp_.mul(1).div(10);
    params._time_to_maturity = pp_.mul(10);
    params.vaultId = pp_.mul(0); 

    await trancheFactory.createVault(params); 
    const tVault_ad = await trancheFactory.getSuperVault(0);
    const tVault = TVault__factory.connect(tVault_ad, owner); 

    const assets = await tVault.previewMint(principal); 
    await collateral.approve(tVault.address, assets); 
    console.log('assets', assets.toString(), principal.toString()); 
    await tVault.mint(principal, owner.address); 
    const tVaultbalance = await tVault.balanceOf(owner.address); 

    console.log('TvaultBalance', tVaultbalance.toString()); 

    const exchangerate = await tVault.getInitialExchangeRates(); 
    const realreturns = await tVault.getCurrentRealReturn();
    console.log('getInitialExchangeRates', exchangerate.toString(), realreturns.toString()); 

    await tVault.redeem(principal, owner.address, owner.address); 
    const b1 = await tVault.balanceOf(owner.address); 
    const b2 = await collateral.balanceOf(testVault1.address); 
    console.log('b1,b2', b1.toString(),b2.toString()); 


  }); 

  it("can split and merge", async()=>{

    const splitter_ad = await trancheFactory.getSplitter(0); 
    const splitter = Splitter__factory.connect(splitter_ad,owner ); 
    const tVault_ad = await trancheFactory.getSuperVault(0);
    const tVault = TVault__factory.connect(tVault_ad, owner); 

    const assets = await tVault.previewMint(principal); 
    await collateral.approve(tVault.address, assets); 
    await tVault.mint(principal, owner.address); 
    const tVaultbalanceBeforeSplit = await tVault.balanceOf(owner.address); 
    console.log('tvalut balance now', tVaultbalanceBeforeSplit.toString()); 

    await tVault.approve(splitter_ad, principal); 
    await splitter.split(tVault.address,principal);
    const tranches = await splitter.getTrancheTokens(); 
    const senior = await TToken__factory.connect(tranches[0], owner); 
    const junior = await TToken__factory.connect(tranches[1], owner); 
    const senior_balances = await senior.balanceOf(owner.address); 
    const junior_balances = await junior.balanceOf(owner.address); 
    const tVaultbalanceAfterSplit = await tVault.balanceOf(owner.address); 
    console.log('tranche balances', senior_balances.toString(), junior_balances.toString()); 
    console.log('tvault balance after split', tVaultbalanceAfterSplit.toString()); 

    await splitter.merge(tVault.address, junior_balances);
    const tVaultbalanceAfterMerge = await tVault.balanceOf(owner.address); 
    const junior_balances2= await junior.balanceOf(owner.address); 
    const senior_balances2 = await senior.balanceOf(owner.address); 
    // expect(tVaultbalanceAfterMerge).to.equal(tVaultbalanceBeforeSplit); 
    // expect(junior_balances2).to.equal(0);
    // expect(senior_balances2).to.equal(0); 

    console.log('tranche balances again',senior_balances2.toString(),  junior_balances2.toString()); 
    // expect(junior.balanceOf(owner.address)).to.equal(0);
    // await expect(senior.balanceOf(owner.address)).to.equal(0); 

    console.log('tvaultbalances',tVaultbalanceBeforeSplit.toString(), tVaultbalanceAfterSplit.toString(), 
     tVaultbalanceAfterMerge.toString()); 


  }); 
  it("can add liquidity", async()=>{


    
  })
  it("can swap ", async()=>{

    const amm_ad = await trancheFactory.getAmm(0);
    const amm = StableSwap__factory.connect(amm_ad, owner);
    const splitter_ad = await trancheFactory.getSplitter(0); 
    const splitter = Splitter__factory.connect(splitter_ad,owner ); 
    const tVault_ad = await trancheFactory.getSuperVault(0);
    const tVault = TVault__factory.connect(tVault_ad, owner);

    //first mint and split  
    const assets = await tVault.previewMint(principal); 
    await collateral.approve(tVault.address, assets); 
    await tVault.mint(principal, owner.address); 
    const tVaultbalanceBeforeSplit = await tVault.balanceOf(owner.address); 
    await tVault.approve(splitter_ad, principal); 
    await splitter.split(tVault.address,principal);

    //GEt balances
    const senior_balances = await senior.balanceOf(owner.address); 
    const junior_balances = await junior.balanceOf(owner.address); 

    //0 is senior, 1 is junior, swap junior to senior 
    const tokenInAmount = junior_balances; 

    amm.swap(0, 1, tokenInAmount, 0); //this will give this contract tokenOut


  }); 



}); 