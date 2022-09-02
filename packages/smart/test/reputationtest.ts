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
  params.alpha = pp_.mul(3).div(10); 
  params.omega = pp_.mul(2).div(10);
  params.delta = pp_.mul(1).div(10); 
  params.r = "10"; 


  before(async() =>{
    [owner, trader, manager1, manager2, manager3, manager4, manager5] = await ethers.getSigners();
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
    await marketmanager.testSetValidator(marketId, trader.address); 

  });

  
  // it("can drawdown/repay", async()=>{
  //   const marketId = await controller.getMarketId(trader.address);
  //   const instrumentdata = await vault.fetchInstrumentData(marketId); 

  //   const bal_before = await collateral.balanceOf(creditline.address);
  //   expect(bal_before).to.equal(instrumentdata.principal); 
  //   // await creditline.drawdown(instrumentdata.principal.div(10));
  //   await collateral.approve(creditline.address,instrumentdata.principal );
  //   await creditline.repay(0, instrumentdata.principal.div(10));

  //   const bal = await collateral.balanceOf(creditline.address);  
  //  // expect(bal).to.equal(instrumentdata.principal.mul(9).div(10)); 

  // }); 


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

    // //Lets have winners who buys at assessment and market is approved
    // const managers = [manager1, manager2, manager3, manager4]; 
    // const marketId = await controller.getMarketId(trader.address);
    // const bc_address = await controller.getZCB_ad(marketId);
    // const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
    // const amount = pp_.mul(1000); 
    // const price_before = await bc.calculateExpectedPrice(0); 
    // let marketphase; 
    // let manager_bc_bal; 
    // let bc_col_bal; 
    // console.log("price_before", price_before.toString()); 
    // for (let i=0; i<managers.length; i++){
    //   await collateral.connect(managers[i]).approve(vault.address, amount.mul(2)); 
    //   await vault.connect(managers[i]).mint( amount, managers[i].address); 
    //   await vault.connect(managers[i]).approve(bc_address, amount); 
    //   await marketmanager.connect(managers[i]).buy(marketId, amount.div(10)); 

    //   bc_col_bal = await bc.getTotalCollateral(); 
    //   marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
    //   manager_bc_bal = await bc.balanceOf(managers[i].address); 
    //   console.log('marketphase/manager_bc_bal/bc_col_bal', marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString() ); 

    // }

    // expect(await vault.balanceOf(bc_address)).to.equal(amount.div(10).mul(managers.length)); 
    // const price_after = await bc.calculateExpectedPrice(0); 
    // console.log("price_after", price_after.toString()); 


    // const vault_balance_before_approve = await collateral.balanceOf(vault.address); 
    // //approve market 
    // await validator_approve( trader, trader.address, controller, vault, collateral, marketmanager, marketId, amount);
    // const price_after_approved = await bc.calculateExpectedPrice(0);  
    // marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
    // expect(price_after_approved).to.equal(price_after); 
    // console.log("approved, priceshouldn't change, marketphase", price_after_approved.toString(), marketphase.toString()); 

    // const vault_balance_after_approve = await collateral.balanceOf(vault.address); 

    // //Creditline repay 
    // const instrumentdata = await vault.fetchInstrumentData(marketId); 
    // const bal_before = await collateral.balanceOf(creditline.address);
    // expect(bal_before).to.equal(instrumentdata.principal); 
    // // await creditline.drawdown(instrumentdata.principal.div(10));
    // await collateral.approve(creditline.address,instrumentdata.principal );
    // await creditline.repay(0, instrumentdata.principal.div(10));
    // expect(await collateral.balanceOf(creditline.address)).to.equal(instrumentdata.faceValue); 

    // const vault_totalAsset_before_resolve = await vault.totalAssets(); 
    // const vault_supply_before_resolve = await vault.totalSupply(); 
    // //close market 
    // await controller.resolveMarket(marketId); 
    // const redemption_price = await marketmanager.get_redemption_price( marketId)
    // console.log('redemption_price', redemption_price.toString())

    // let manager_vault_bal; 
    // let manager_reputation; 
    // let manager_vault_bal_after;
    // var total_profits =  BigNumber.from(0); 
    // const vault_balance_after_close = await collateral.balanceOf(vault.address); 
    // const vault_totalAsset_after_resolve = await vault.totalAssets(); 
    // const vault_supply_after_resolve = await vault.totalSupply(); 

    // for (let i=0; i<managers.length; i++){
    //   manager_reputation = await rep.getReputationScore(managers[i].address);
    //   manager_vault_bal = await vault.balanceOf(managers[i].address); 
    //   console.log('Before redeem vault_bal,reputation', manager_vault_bal.toString(), manager_reputation.toString());
    //   await marketmanager.connect(managers[i]).redeem(marketId, managers[i].address); 

    //   expect(await bc.balanceOf(managers[i].address)).to.equal(0);
    //   manager_reputation = await rep.getReputationScore(managers[i].address);
    //   manager_vault_bal_after = await vault.balanceOf(managers[i].address); 
    //   total_profits.add(manager_vault_bal_after.sub(manager_vault_bal))
    //   console.log('After redeem vault_bal,reputation', manager_vault_bal_after.toString(), manager_reputation.toString());
    // }
    // expect(await marketmanager._isValidator( marketId,  trader.address) ).to.be.true; 
    // const validator_redeem_before = await vault.balanceOf(trader.address);
    // await marketmanager.connect(trader).redeem(marketId, trader.address); 
    // const validator_redeem_after = await vault.balanceOf(trader.address); 
    // total_profits.add(validator_redeem_after.sub(validator_redeem_before)); 

    // await rep.testStore(); 
    // expect(await rep.getAvailableTopX()).to.equal(managers.length); 
    // console.log('vaultbalances',vault_balance_before_approve.toString(),vault_balance_after_approve.toString(),vault_balance_after_close.toString());
    // const vault_totalAsset_after_redeem = await vault.totalAssets(); 
    // const vault_supply_after_redeem = await vault.totalSupply(); 

    // console.log('vaults totalAssets',vault_totalAsset_before_resolve.toString(),vault_totalAsset_after_resolve.toString(), vault_totalAsset_after_redeem.toString());
    // console.log('vaults totalsupply',vault_supply_before_resolve.toString(),vault_supply_after_resolve.toString(), vault_supply_after_redeem.toString());
    // console.log('total_profits', total_profits.toString(), )
  })

  // it("can do accounting at maturity with vault")



  it("some people will long some will short, and market is denied  ", async()=>{
      // doLong = (Math.random() > 0.5);

    const managers = [manager1, manager2, manager3, manager4]; 
    const marketId = await controller.getMarketId(trader.address);
    const bc_address = await controller.getZCB_ad(marketId);
    const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
    const shortzcb_ad = await controller.getshortZCB_ad(marketId);
    const sbc = LinearShortZCB__factory.connect(shortzcb_ad, owner); 

    const amount = pp_.mul(1000); 
    const price_before = await bc.calculateExpectedPrice(0); 
    let marketphase; 
    let manager_bc_bal; 
    let bc_col_bal; 
    let doLong; 
    let price_now; 
    console.log("price_before", price_before.toString()); 
    for (let i=0; i<managers.length; i++){
      await collateral.connect(managers[i]).approve(vault.address, amount.mul(2)); 
      await vault.connect(managers[i]).mint( amount, managers[i].address); 
      await vault.connect(managers[i]).approve(bc_address, amount); 
      await vault.connect(managers[i]).approve(shortzcb_ad, amount); 
      if (i==0){

        await marketmanager.connect(managers[i]).buy(marketId, amount.div(7)); 
      }
      else if(i==1){
        await marketmanager.connect(managers[i]).sellShort(marketId, amount.div(200));
      }

      else if(i==2){
        await marketmanager.connect(managers[i]).buy(marketId, amount.div(7)); 

      }

      else if(i==3){
        await marketmanager.connect(managers[i]).buy(marketId, amount.div(7));
      }

      else if(i==4){
        await marketmanager.connect(managers[i]).buy(marketId, amount.div(6)); 



      }

      price_now = await bc.calculateExpectedPrice(0); 
      bc_col_bal = await bc.getTotalCollateral(); 
      marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
      manager_bc_bal = await bc.balanceOf(managers[i].address); 
      console.log('marketphase/manager_bc_bal/bc_col_bal/pricenow', marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString(), price_now.toString()); 
      
    }



  })

  it("can do trade post assessment with boundaries", async()=> {
    //need to run above test, then approve 
    const managers = [manager1, manager2, manager3, manager4]; 
    const marketId = await controller.getMarketId(trader.address);
    const bc_address = await controller.getZCB_ad(marketId);
    const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
    const shortzcb_ad = await controller.getshortZCB_ad(marketId);
    const sbc = LinearShortZCB__factory.connect(shortzcb_ad, owner); 
    const amount = pp_.mul(1000); 

    await validator_approve( trader, trader.address, controller, vault, collateral, marketmanager, marketId, amount);

    const upper = await bc.getUpperBound(); 
    const lower = await bc.getLowerBound();
    console.log('Upper/lower', upper.toString(), lower.toString());

    await collateral.connect(owner).approve(vault.address, amount.mul(2)); 
    await vault.connect(owner).mint( amount, owner.address); 
    await vault.connect(owner).approve(bc_address, amount); 

    await marketmanager.connect(owner).buy(marketId, amount.div(1000)); 
    await marketmanager.connect(owner).buy(marketId, amount.div(5)); 



  })




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




