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


  TToken__factory, 
  TestVault__factory, 
  TestVault, 
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



// async function reset( ): Promise<boolean>   
// async function buy(): Promise<boolean>
// async function sell(): Promise<boolean>

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

  it("can create a superVault", async()=>{
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

  }); 


}); 