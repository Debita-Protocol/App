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
  StableSwap__factory, 
  StableSwap, 
  TrancheAMMFactory__factory,
  TrancheAMMFactory, 
  TrancheMaster 



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


  let trancheAMMFactory: TrancheAMMFactory; 
  let trancheMaster: TrancheMaster; 
  //let LinearBondingCurve__factory: LinearBondingCurve__factory; 

  const principal = pp_.mul(1000);
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
    trancheAMMFactory = (await ethers.getContract("TrancheAMMFactory")) as TrancheAMMFactory; 
    trancheMaster = (await ethers.getContract("TrancheMaster"))
    testVault__factory = (await ethers.getContractFactory("testVault")) as TestVault__factory; 

    testVault1 = await testVault__factory.deploy(collateral.address) as TestVault;
    testVault2 = await testVault__factory.deploy(collateral.address) as TestVault; 
    
  
    await collateral.connect(owner).faucet(5000000000000);
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

  // it("can split and merge", async()=>{

  //   const splitter_ad = await trancheFactory.getSplitter(0); 
  //   const splitter = Splitter__factory.connect(splitter_ad,owner ); 
  //   const tVault_ad = await trancheFactory.getSuperVault(0);
  //   const tVault = TVault__factory.connect(tVault_ad, owner); 

  //   const assets = await tVault.previewMint(principal); 
  //   await collateral.approve(tVault.address, assets); 
  //   await tVault.mint(principal, owner.address); 
  //   const tVaultbalanceBeforeSplit = await tVault.balanceOf(owner.address); 
  //   console.log('tvalut balance now', tVaultbalanceBeforeSplit.toString()); 

  //   await tVault.approve(splitter_ad, principal); 
  //   await splitter.split(tVault.address,principal);
  //   const tranches = await splitter.getTrancheTokens(); 
  //   const senior = await TToken__factory.connect(tranches[0], owner); 
  //   const junior = await TToken__factory.connect(tranches[1], owner); 
  //   const senior_balances = await senior.balanceOf(owner.address); 
  //   const junior_balances = await junior.balanceOf(owner.address); 
  //   const tVaultbalanceAfterSplit = await tVault.balanceOf(owner.address); 
  //   console.log('tranche balances', senior_balances.toString(), junior_balances.toString()); 
  //   console.log('tvault balance after split', tVaultbalanceAfterSplit.toString()); 

  //   await splitter.merge(tVault.address, junior_balances);
  //   const tVaultbalanceAfterMerge = await tVault.balanceOf(owner.address); 
  //   const junior_balances2= await junior.balanceOf(owner.address); 
  //   const senior_balances2 = await senior.balanceOf(owner.address); 
  //   // expect(tVaultbalanceAfterMerge).to.equal(tVaultbalanceBeforeSplit); 
  //   // expect(junior_balances2).to.equal(0);
  //   // expect(senior_balances2).to.equal(0); 

  //   console.log('tranche balances again',senior_balances2.toString(),  junior_balances2.toString()); 
  //   // expect(junior.balanceOf(owner.address)).to.equal(0);
  //   // await expect(senior.balanceOf(owner.address)).to.equal(0); 

  //   console.log('tvaultbalances',tVaultbalanceBeforeSplit.toString(), tVaultbalanceAfterSplit.toString(), 
  //    tVaultbalanceAfterMerge.toString()); 


  // }); 

  // it("can add liquidity", async()=>{
  //   const amm_ad = await trancheFactory.getAmm(0);
  //   const amm = StableSwap__factory.connect(amm_ad, owner);
  //   const splitter_ad = await trancheFactory.getSplitter(0); 
  //   const splitter = Splitter__factory.connect(splitter_ad,owner ); 
  //   const tVault_ad = await trancheFactory.getSuperVault(0);
  //   const tVault = TVault__factory.connect(tVault_ad, owner);
  //   const isammpool = await trancheAMMFactory.isPool(amm_ad);
  //   console.log('isammpool', isammpool);
  //   //first mint and split 
  //   const assets = await tVault.previewMint(principal); 
  //   await collateral.approve(tVault.address, assets); 
  //   await tVault.mint(principal, owner.address); 
  //   const tVaultbalanceBeforeSplit = await tVault.balanceOf(owner.address); 
  //   await tVault.approve(splitter_ad, principal); 
  //   await splitter.split(tVault.address,principal);

  //   //GEt balances
  //   const tranches = await splitter.getTrancheTokens(); 
  //   const senior = await TToken__factory.connect(tranches[0], owner); 
  //   const junior = await TToken__factory.connect(tranches[1], owner); 
  //   const senior_balances = await senior.balanceOf(owner.address); 
  //   const junior_balances = await junior.balanceOf(owner.address); 
  //   console.log('tranche balances', senior_balances.toString(), junior_balances.toString()); 

  //   const amounts = [junior_balances, junior_balances] as [BigNumberish,BigNumberish]; 
  //   await senior.approve(amm_ad, junior_balances);
  //   await junior.approve(amm_ad, junior_balances); 
  //   const xp_before = await amm.xp(); 
  //   const lpbalance_before = await amm.balanceOf(owner.address); 

  //   console.log('xpbefore', xp_before[0].toString(), xp_before[1].toString()); 
  //   console.log('lpbalance_before', lpbalance_before.toString()); 
  //   console.log('amount', amounts); 

  //   await amm.addLiquidity(amounts, 0);

  //   const xp_after = await amm.xp(); 
  //   const lpbalance_after = await amm.balanceOf(owner.address); 
  //   console.log('xpafter', xp_after[0].toString(), xp_after[1].toString()); 
  //   console.log('lpbalance_before', lpbalance_after.toString()); 


  // }); 

  // it("can swap ", async()=>{

  //   const amm_ad = await trancheFactory.getAmm(0);
  //   const amm = StableSwap__factory.connect(amm_ad, owner);
  //   const splitter_ad = await trancheFactory.getSplitter(0); 
  //   const splitter = Splitter__factory.connect(splitter_ad,owner ); 
  //   const tVault_ad = await trancheFactory.getSuperVault(0);
  //   const tVault = TVault__factory.connect(tVault_ad, owner);

  //   //first mint and split  
  //   const assets = await tVault.previewMint(principal); 
  //   await collateral.approve(tVault.address, assets.mul(3)); 
  //   await tVault.mint(principal, owner.address); 
  //   const tVaultbalanceBeforeSplit = await tVault.balanceOf(owner.address); 
  //   await tVault.approve(splitter_ad, principal); 
  //   await splitter.split(tVault.address,principal);

  //   const tranches = await splitter.getTrancheTokens(); 
  //   const senior = await TToken__factory.connect(tranches[0], owner); 
  //   const junior = await TToken__factory.connect(tranches[1], owner); 
  //   const senior_balances = await senior.balanceOf(owner.address); 
  //   const junior_balances = await junior.balanceOf(owner.address); 
  //   console.log('tranche balances before', senior_balances.toString(), junior_balances.toString()); 

  //   await senior.approve(amm_ad, junior_balances);
  //   await junior.approve(amm_ad, junior_balances); 
  //   const xp_before = await amm.xp(); 
  //   console.log('xp_before', xp_before.toString()); 

  //   //0 is senior, 1 is junior, swap junior to senior 
  //   const tokenInAmount = junior_balances.div(5); 
  //   await amm.swap(0, 1, tokenInAmount, 0); //this will give this contract tokenOut

  //   const senior_balances_after = await senior.balanceOf(owner.address); 
  //   const junior_balances_after = await junior.balanceOf(owner.address); 
  //   console.log('tranche balances after', senior_balances_after.toString(), junior_balances_after.toString());

  //   const xp_after = await amm.xp(); 
  //   console.log('xp_before', xp_after.toString()); 
  // }); 

  // it("can remove liquidity", async()=>{


  //   const amm_ad = await trancheFactory.getAmm(0);
  //   const amm = StableSwap__factory.connect(amm_ad, owner);
  //   const splitter_ad = await trancheFactory.getSplitter(0); 
  //   const splitter = Splitter__factory.connect(splitter_ad,owner ); 
  //   const tVault_ad = await trancheFactory.getSuperVault(0);
  //   const tVault = TVault__factory.connect(tVault_ad, owner);


  //   const tranches = await splitter.getTrancheTokens(); 
  //   const senior = await TToken__factory.connect(tranches[0], owner); 
  //   const junior = await TToken__factory.connect(tranches[1], owner); 

  //   const shares = await amm.balanceOf(owner.address); 
  //   const senior_balances = await senior.balanceOf(owner.address); 
  //   const junior_balances = await junior.balanceOf(owner.address); 
  //   await amm.removeLiquidity(shares,[BigNumber.from(0), BigNumber.from(0)]); 
  //   const senior_balances_after = await senior.balanceOf(owner.address); 
  //   const junior_balances_after = await junior.balanceOf(owner.address); 

  //   console.log('tranche balances, ',senior_balances.toString(),junior_balances.toString(),  
  //     senior_balances_after.toString(), 
  //     junior_balances_after.toString())


  // });

  it("can split/add liquidity for LPs", async()=>{
    const amm_ad = await trancheFactory.getAmm(0);
    const amm = StableSwap__factory.connect(amm_ad, owner);
    const splitter_ad = await trancheFactory.getSplitter(0); 
    const splitter = Splitter__factory.connect(splitter_ad,owner ); 
    const tVault_ad = await trancheFactory.getSuperVault(0);
    const tVault = TVault__factory.connect(tVault_ad, owner);

    //first mint and split 
    const assets = await tVault.previewMint(principal); 
    await collateral.approve(tVault.address, assets); 
    console.log('assets here', assets.toString(), principal.toString()); 
    await tVault.mint(assets, owner.address); 
    const tVaultbalanceBeforeSplit = await tVault.balanceOf(owner.address); 
    await tVault.approve(splitter_ad, principal); 
    await splitter.split(tVault.address,principal); 

    //then addLiquidity
    const tranches = await splitter.getTrancheTokens(); 
    const senior = await TToken__factory.connect(tranches[0], owner); 
    const junior = await TToken__factory.connect(tranches[1], owner); 
    const senior_balances = await senior.balanceOf(owner.address); 
    const junior_balances = await junior.balanceOf(owner.address); 
    console.log('tranche balances', senior_balances.toString(), junior_balances.toString()); 

    const amounts = [junior_balances, junior_balances] as [BigNumberish,BigNumberish]; 
    await senior.approve(amm_ad, junior_balances);
    await junior.approve(amm_ad, junior_balances); 
    const xp_before = await amm.xp(); 
    const lpbalance_before = await amm.balanceOf(owner.address); 

    console.log('xpbefore', xp_before[0].toString(), xp_before[1].toString()); 
    console.log('lpbalance_before', lpbalance_before.toString()); 
    console.log('amount', amounts); 

    await amm.addLiquidity(amounts, 0);

    const xp_after = await amm.xp(); 
    const lpbalance_after = await amm.balanceOf(owner.address); 
    console.log('xpafter', xp_after[0].toString(), xp_after[1].toString()); 
    console.log('lpbalance_after', lpbalance_after.toString()); 



  }); 


  it("can buy in one go in added liquidity ", async()=>{
    const amm_ad = await trancheFactory.getAmm(0);
    const amm = StableSwap__factory.connect(amm_ad, owner);
    const splitter_ad = await trancheFactory.getSplitter(0); 
    const splitter = Splitter__factory.connect(splitter_ad,owner ); 
    const tVault_ad = await trancheFactory.getSuperVault(0);
    const tVault = TVault__factory.connect(tVault_ad, owner);

    const assets = await tVault.previewMint(pp_.mul(50)); 
    console.log('asssets should be 10?', assets.toString()); 
    await collateral.connect(trader).approve(trancheMaster.address, pp_.mul(50)); 
    await trancheMaster.connect(trader).buy_tranche(0, pp_.mul(50),false); 

    const tranches = await splitter.getTrancheTokens(); 
    const senior = await TToken__factory.connect(tranches[0], owner); 
    const junior = await TToken__factory.connect(tranches[1], owner); 
    const senior_balances = await senior.connect(trader).balanceOf(trader.address); 
    const junior_balances = await junior.connect(trader).balanceOf(trader.address); 
    console.log('tranche balances', senior_balances.toString(), junior_balances.toString()); 

    const xp_before = await amm.xp(); 
    console.log('xp', xp_before[0].toString(), xp_before[1].toString()); 

  }); 

  it("can redeem after maturity for both LPs and trader ", async()=>{
    const amm_ad = await trancheFactory.getAmm(0);
    const amm = StableSwap__factory.connect(amm_ad, owner);
    const splitter_ad = await trancheFactory.getSplitter(0); 
    const splitter = Splitter__factory.connect(splitter_ad,owner ); 
    const tVault_ad = await trancheFactory.getSuperVault(0);
    const tVault = TVault__factory.connect(tVault_ad, owner);    

    const tranches = await splitter.getTrancheTokens(); 
    const senior = await TToken__factory.connect(tranches[0], owner); 
    const junior = await TToken__factory.connect(tranches[1], owner); 
    const senior_balances = await senior.connect(trader).balanceOf(trader.address); 
    const junior_balances = await junior.connect(trader).balanceOf(trader.address); 
    //let trader redeem first

    await splitter.calcRedemptionPrice(); 
    const prices = await splitter.getRedemptionPrices(); 
    console.log('redemption prices', prices[0].toString(), prices[1].toString());

    //first trader redeem
    await splitter.connect(trader).redeem_after_maturity(junior.address, junior_balances); 
    const trader_junior_balance = await junior.connect(trader).balanceOf(trader.address);
    const trader_vault_balance = await tVault.connect(trader).balanceOf(trader.address); 
    console.log('trader_junior_balance', trader_junior_balance.toString(), trader_vault_balance.toString()); 

    //now LP should remove liquidity and redeem 
    const shares = await amm.balanceOf(owner.address); 
    const senior_balances_lp = await senior.balanceOf(owner.address); 
    const junior_balances_lp = await junior.balanceOf(owner.address); 
    await amm.removeLiquidity(shares,[BigNumber.from(0), BigNumber.from(0)]); 
    const senior_balances_after = await senior.balanceOf(owner.address); 
    const junior_balances_after = await junior.balanceOf(owner.address); 

    console.log('tranche balances, for LP ',senior_balances_lp.toString(),junior_balances_lp.toString(),  
      senior_balances_after.toString(), 
      junior_balances_after.toString()); 
    const o_senior_balances = await senior.connect(owner).balanceOf(owner.address); 
    const o_junior_balances = await junior.connect(owner).balanceOf(owner.address); 
    await splitter.connect(owner).redeem_after_maturity(senior.address, o_senior_balances);
    await splitter.connect(owner).redeem_after_maturity(junior.address, o_junior_balances);

    const owner_junior_balance = await junior.connect(owner).balanceOf(owner.address); 
    const owner_senior_balance = await senior.connect(owner).balanceOf(owner.address); 
    const owner_vault_balance = await tVault.connect(owner).balanceOf(owner.address); 
    console.log("owners", owner_junior_balance.toString(),owner_senior_balance.toString(),owner_vault_balance.toString()  )







    //await splitter.redeem_after_maturity(junior.address,junior_balances); 


  }); 

  it("can change exchange rates for each ", async()=>{
    
  }); 



  it("can sell in one go in added liquidity, and get back money ")


}); 