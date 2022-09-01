import { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use as chaiUse } from "chai";

import chaiAsPromised from "chai-as-promised";
import {
  AMMFactory,

  Cash,
  OwnedERC20,
  OwnedERC20__factory,
  TrustedMarketFactoryV3,
  TrustedMarketFactoryV3__factory,
  Controller, 
  BondingCurve, 
  MarketManager, 
  ReputationNFT ,

  Vault,
  Vault__factory, 
  CreditLine, 
  CreditLine__factory, 
  LinearBondingCurve, 
  LinearBondingCurve__factory,
  MarketManager__factory, 
  LinearShortZCB__factory, 
  LinearShortZCB,
  VaultFactory 


} from "../typechain";

import { BigNumber,BigNumberish  } from "ethers";

const pp = BigNumber.from(10).pow(18);
const pp__ = BigNumber.from(10).pow(12);
const pp_ = BigNumber.from(10).pow(6);

interface InstrumentData {
  trusted: boolean; 
  balance: BigNumberish; 
  faceValue: BigNumberish;
  marketId: BigNumberish; 
  principal: BigNumberish; 
  expectedYield: BigNumberish; 
  duration: BigNumberish;
  description: string; 
  Instrument_address: string; 

}

interface InstrumentData_ {
  trusted: boolean; 
  balance: string; 
  faceValue: string;
  marketId: string; 
  principal: string; 
  expectedYield: string; 
  duration: string;
  description: string; 
  Instrument_address: string; 
  instrument_type: string;
  maturityDate:string; 
}; 

interface DefaultParams {

  N: string;
  sigma: BigNumberish;
  alpha: BigNumberish; 
  omega: BigNumberish; 
  delta: BigNumberish; 
  r: string; 

}

// async function reset( ): Promise<boolean>   
// async function buy(): Promise<boolean>
// async function sell(): Promise<boolean>

export async function validator_approve(
  validator: SignerWithAddress,
  validator_address: string, 
  controller: Controller, 
  vault: Vault, 
  collateral: Cash,
  marketmanager: MarketManager, 
  marketId: BigNumber,
  amount: BigNumber
  ) {

  await collateral.connect(validator).approve(vault.address, amount.mul(20)); 
  await vault.connect(validator).mint(amount.mul(10), validator_address);
  await vault.connect(validator).approve(marketmanager.address, amount.mul(10)); 

  await controller.connect(validator).confirmMarket(marketId); 
  await controller.connect(validator).approveMarket(marketId); 

}

describe("Cycle", ()=>{
  let owner: SignerWithAddress; 
  let trader: SignerWithAddress; 
  let manager1: SignerWithAddress; 
  let manager2: SignerWithAddress; 
  let manager3: SignerWithAddress; 
  let manager4: SignerWithAddress; 
  let manager5: SignerWithAddress; 
  let manager6: SignerWithAddress; 


  let collateral: Cash; 
  let marketFactory: TrustedMarketFactoryV3; 
  let vault: Vault;
  let creditline: CreditLine; 
  let controller: Controller; 
  let rep: ReputationNFT; 
  let bc: LinearBondingCurve; 
  let marketmanager: MarketManager; 
  let vaultFactory: VaultFactory; 

  let CreditLine__factory: CreditLine__factory; 
  // let Vault__factory: Vault__factory; 
  let MarketManager__factory: MarketManager__factory; 
  //let LinearBondingCurve__factory: LinearBondingCurve__factory; 
  let vault_ad: string;
  let vaultId: string; 

  const principal = 10000000;
  const drawdown = 5000000; 
  const interestAPR = 100000; 
  const duration = 10000000; 
  const faceValue = 12000000; 

  const data = {} as InstrumentData_;
  const params = {} as DefaultParams; 

  params.N = "1"; 
  params.sigma = pp_.mul(5).div(100); 
  params.alpha = pp_.mul(4).div(10); 
  params.omega = pp_.mul(2).div(10);
  params.delta = pp_.mul(1).div(10); 
  params.r = "10"; 


  before(async() =>{
    [owner, trader, manager1, manager2, manager3, manager4] = await ethers.getSigners();
    controller = (await ethers.getContract("Controller")) as Controller; 

    marketmanager = (await ethers.getContract("MarketManager")) as MarketManager; 
    collateral = (await ethers.getContract("Collateral")) as Cash; 
    // vault = (await ethers.getContract("Vault")) as Vault;
    marketFactory = (await ethers.getContract("TrustedMarketFactoryV3")) as TrustedMarketFactoryV3; 
    CreditLine__factory = (await ethers.getContractFactory("CreditLine")) as CreditLine__factory; 

    rep = (await ethers.getContract("ReputationNFT")) as ReputationNFT; 
    vaultFactory = (await ethers.getContract("VaultFactory")) as VaultFactory; 

    await controller.setMarketManager(marketmanager.address);
    await controller.setVaultFactory(vaultFactory.address)
    await controller.setMarketFactory(marketFactory.address);
    await controller.setReputationNFT(rep.address); 

    await controller.createVault(
     collateral.address, 
     controller.address, 
     false, 1, 0, 0, params
    )
    const vault_ad = await controller.getVaultfromId(1); 

    vault = Vault__factory.connect(vault_ad, owner) as Vault; 

    creditline = await CreditLine__factory.deploy(
    vault.address, trader.address, principal, interestAPR, duration, faceValue) as CreditLine;


    ///SETTINGS
 

    await collateral.connect(owner).faucet(500000000000);
    await collateral.connect(trader).faucet(200000000000); 
    const manager = [manager1, manager2, manager3, manager4];
    for (let i=0; i< manager.length; i++){
      await collateral.connect(manager[i]).faucet(200000000000); 

    }
    //1 collateral is 1e12 other 
    await creditline.setUtilizer(owner.address); 
    const repbalance = await rep.balanceOf(owner.address); 
    if (repbalance.toString() == "0"){
      await rep.mint(owner.address); 
      for (let i=0; i< manager.length; i++){
        await controller.connect(manager[i]).testVerifyAddress()

        await rep.connect(manager[i]).mint(manager[i].address); 
      }

    }

  }); 

  // it("can deposit", async()=>{
  //   const vaultBalance = await vault.balanceOf(trader.address); 

  //   await collateral.connect(trader).faucet(principal); 
  //   await collateral.approve(vault.address, principal); 
  //   await vault.deposit(principal.toString(), trader.address);
  //   const vaultBalanceAfter = await vault.balanceOf(trader.address); 

  //   console.log('VaultBalances', vaultBalance.toString(), vaultBalanceAfter.toString()); 

  //  // expect(await vault.totalAssets()).to.equal(principal); 

  // }); 

  it("can add proposal and create market", async()=> {
    data.trusted = false; 
    data.balance = pp_.mul(0).toString();
    data.faceValue = pp_.mul(1100).toString();
    data.marketId = pp_.mul(0).toString(); 
    data.principal = pp_.mul(1000).toString();
    data.expectedYield = pp_.mul(100).toString();
    data.duration = pp_.mul(10).toString();
    data.description = "test";
    data.Instrument_address = creditline.address;
    data.instrument_type = String(0);
    data.maturityDate = String(10); 
    console.log('data', data)
    await controller.initiateMarket(trader.address, data, 1); 
    const marketId = await controller.getMarketId(trader.address); 
    const instrumentdata = await vault.fetchInstrumentData(marketId); 
    console.log("marketId", marketId.toString())
    expect(instrumentdata.balance).to.equal(data.balance); 
    expect(instrumentdata.principal).to.equal(data.principal); 

  });

  



  // it("can approve", async()=>{
  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner);
  //   //Check that the supply of the bondingcurve is 0, 
  //   // await expect(bc.getTotalZCB()).to.equal(0); 
  //   // await expect(bc.getTotalCollateral()).to.equal(0);

  //   //first need to see if market reverts approving when not enough colalteral bought 
  //   await expect(controller.approveMarket(marketId)).to.be.reverted; 

  //   //then buy 0.6 * principal amount for the instrument 
  //   const instrumentdata = await vault.fetchInstrumentData(marketId); 
  //   const amountToBuy = instrumentdata.principal.div(2); 
  //   const amount = instrumentdata.principal.div(2); 
  //   const preview = await vault.previewMint( amount); 
  //   console.log('preview', preview.toString()); 
  //   await collateral.connect(owner).faucet(amount); 
  //   await collateral.approve(vault.address, amount.mul(20)); 
  //   await vault.mint(amount.mul(10).toString(), owner.address);

  //   await vault.approve(bc_address, amount); 
  //   await marketmanager.buy(marketId, amount); 
  //   const canapprove = await marketmanager.validator_can_approve( marketId ) ;
  //   console.log('canapprove', canapprove)
  //   //Then approve this market again after chaning phase, now the instrument should be 
  //   //credited with the proposed principal 
  //   // await marketmanager.setAssessmentPhase(marketId, true, false); 
  //   await collateral.connect(trader).approve(vault.address, amount.mul(20)); 
  //   await vault.connect(trader).mint(amount.mul(10), trader.address);
  //   await vault.connect(trader).approve(marketmanager.address, amount.mul(10)); 
  //   const validator_vault_balance_before_approve = await vault.connect(trader).balanceOf(trader.address); 
  //   console.log('validator_vault_balance_before_approve', validator_vault_balance_before_approve.toString()); 

  //   await controller.connect(trader).confirmMarket(marketId); 
  //   await controller.connect(trader).approveMarket(marketId); 
  //   const creditline_balance = await collateral.balanceOf(creditline.address); 
  //   expect(creditline_balance).to.equal(instrumentdata.principal); 
  //   const validator_vault_balance_after_approve = await vault.connect(trader).balanceOf(trader.address); 
  //   const validator_balance = await bc.balanceOf(trader.address); 

  //   console.log('after_approve', validator_vault_balance_after_approve.toString(),validator_balance.toString() ); 

  //   });


  it("everyone can buy and all redeem with increased reputation based on winnings", async()=>{

    //Lets have winners who buys at assessment and market is approved
    const managers = [manager1, manager2, manager3, manager4]; 
    const marketId = await controller.getMarketId(trader.address);
    const bc_address = await controller.getZCB_ad(marketId);
    const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
    const amount = pp_.mul(1000); 
    const price_before = await bc.calculateExpectedPrice(0); 
    let marketphase; 
    let manager_bc_bal; 
    let bc_col_bal; 
    console.log("price_before", price_before.toString()); 
    for (let i=0; i<managers.length; i++){
      await collateral.connect(managers[i]).approve(vault.address, amount); 
      await vault.connect(managers[i]).mint( amount, managers[i].address); 
      await vault.connect(managers[i]).approve(bc_address, amount); 
      await marketmanager.connect(managers[i]).buy(marketId, amount.div(10)); 

      bc_col_bal = await bc.getTotalCollateral(); 
      marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
      manager_bc_bal = await bc.balanceOf(managers[i].address); 
      console.log('marketphase/manager_bc_bal/bc_col_bal', marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString() ); 

    }

    expect(await vault.balanceOf(bc_address)).to.equal(amount.div(10).mul(managers.length)); 
    const price_after = await bc.calculateExpectedPrice(0); 
    console.log("price_after", price_after.toString()); 

    //approve market 
    await validator_approve( trader, trader.address, controller, vault, collateral, marketmanager, marketId, amount);
    const price_after_approved = await bc.calculateExpectedPrice(0);  
    marketphase = await marketmanager.getCurrentMarketPhase( marketId); 

    console.log("approved, priceshouldn't change, marketphase", price_after_approved.toString(), marketphase.toString()); 
    //close market 
    // await 


  })





  // it("can close market from controller and redeem", async()=>{
  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner);
  //   const shortzcb_ad = await controller.getshortZCB_ad(marketId);
  //   const sbc = LinearShortZCB__factory.connect(shortzcb_ad, owner); 

  //   const vaultbalancebeforeredemption = await vault.balanceOf(owner.address); 
  //   console.log('vaultbalancebeforeredemption ', vaultbalancebeforeredemption.toString()); 
  //   await controller.resolveMarket(marketId); 
  //   const redemption_price = await marketmanager.get_redemption_price( marketId); 
  //   const longzcb_balance_before = await bc.balanceOf(owner.address);
  //   const shortzcb_balance_before = await sbc.balanceOf(owner.address); 

  //   await marketmanager.redeem(marketId, owner.address); 
  //   console.log('redemptionpriece', redemption_price.toString()); 

  //   const longzcb_balance = await bc.balanceOf(owner.address);
  //   const shortzcb_balance = await sbc.balanceOf(owner.address); 
  //   const vaultBalanceAfterShort = await vault.balanceOf(owner.address);
  //   const sbc_vaultBalance = await vault.balanceOf(shortzcb_ad); 
  //   // expect(shortzcb_balance).to.equal(longzcb_balance); 
  //   expect(longzcb_balance).to.equal(0); 
  //   expect(sbc_vaultBalance).to.equal(0);

  //   console.log('should equal roughly ',vaultBalanceAfterShort.sub(vaultbalancebeforeredemption).toString(),
  //     (shortzcb_balance_before.add(longzcb_balance_before)).div(10**12).toString()  );

  //   console.log(' balances after redemption', longzcb_balance.toString(), shortzcb_balance.toString(),vaultBalanceAfterShort.toString(), sbc_vaultBalance.toString()); 

  //   const vaultBalancebefore = await vault.balanceOf(owner.address);
  //   await marketmanager.redeemShortZCB(marketId,owner.address); 
  //   const vaultBalanceafter = await vault.balanceOf(owner.address); 
  //   console.log('before and after redeem', vaultBalancebefore.toString(), vaultBalanceafter.toString()); 
  //   console.log('shortredemption_price and zcb balnace times redemption price',pp_.sub(redemption_price).toString(),
  //     ((pp_.sub(redemption_price)).mul(shortzcb_balance)).div(10**12).div(10**6).toString() ); 

  // });

  // it("some people will long some will short ")




})

// export async function closeMarket(
//   closer: SignerWithAddress,
//   closer_address: string, 
//   controller: Controller, 
//   vault: Vault, 
//   collateral: Cash,
//   marketmanager: MarketManager, 
//   marketId: string, 
//   bc: BondingCurve, 

//   ){
//   const 
// }




