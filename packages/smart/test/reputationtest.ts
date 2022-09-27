import { network, deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use as chaiUse } from "chai";

import chaiAsPromised from "chai-as-promised";
import {

  Cash,
  OwnedERC20,
  OwnedERC20__factory,
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
  VaultFactory ,
  Proxy__factory, 

  MockBorrowerContract, 
MockBorrowerContract__factory
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
  s: BigNumberish; 

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
  let vault: Vault;
  let creditline: CreditLine; 
  let controller: Controller; 
  let rep: ReputationNFT; 
  let bc: LinearBondingCurve; 
  let marketmanager: MarketManager; 
  let vaultFactory: VaultFactory; 
  let borrowerContract: MockBorrowerContract; 
  let CreditLine__factory: CreditLine__factory; 
  let MockBorrowerContract__factory: MockBorrowerContract__factory; 

  // let Vault__factory: Vault__factory; 
  let MarketManager__factory: MarketManager__factory; 
  //let LinearBondingCurve__factory: LinearBondingCurve__factory; 
  let vault_ad: string;
  let vaultId: string; 

  const principal = 1000;
  const drawdown = 5000000; 
  const interestAPR = 100; 
  const duration = 1; 
  const faceValue = 1100; 


  const data = {} as InstrumentData_;
  const params = {} as DefaultParams; 

  params.N = "1"; 
  params.sigma = pp.mul(5).div(100); 
  params.alpha = pp.mul(4).div(10); 
  params.omega = pp.mul(2).div(10);
  params.delta = pp.mul(2).div(10); 
  params.r = "10"; 
  params.s = pp.mul(2); 


  before(async() =>{
    [owner, trader, manager1, manager2, manager3, manager4, manager5] = await ethers.getSigners();
    controller = (await ethers.getContract("Controller")) as Controller; 

    marketmanager = (await ethers.getContract("MarketManager")) as MarketManager; 
    collateral = (await ethers.getContract("Collateral")) as Cash; 
    // vault = (await ethers.getContract("Vault")) as Vault;
    CreditLine__factory = (await ethers.getContractFactory("CreditLine")) as CreditLine__factory; 
    MockBorrowerContract__factory = (await ethers.getContractFactory("MockBorrowerContract")) as MockBorrowerContract__factory; 
    rep = (await ethers.getContract("ReputationNFT")) as ReputationNFT; 
    vaultFactory = (await ethers.getContract("VaultFactory")) as VaultFactory; 

    // ControllerFactory = (await ethers.getContractFactory("Controller")) as Controller__factory; 

    await controller.setMarketManager(marketmanager.address);
    await controller.setVaultFactory(vaultFactory.address)
    await controller.setReputationNFT(rep.address); 

    await controller.createVault(
     collateral.address, 
     false, 1, 0, 0, params
    )
    const vault_ad = await controller.getVaultfromId(1); 

    vault = Vault__factory.connect(vault_ad, owner) as Vault; 

    creditline = await CreditLine__factory.deploy(
    vault.address, trader.address, pp.mul(principal), pp.mul(interestAPR), pp.mul(duration), 
      pp.mul(faceValue), collateral.address, 
    collateral.address, pp.mul(principal), 2) as CreditLine;

    borrowerContract = await MockBorrowerContract__factory.deploy() as MockBorrowerContract; 
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
    data.balance = pp.mul(0).toString();
    data.faceValue = pp.mul(faceValue).toString();
    data.marketId = pp.mul(0).toString(); 
    data.principal = pp.mul(principal).toString();
    data.expectedYield = pp.mul(interestAPR).toString();
    data.duration = pp.mul(duration).toString();
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
    // await marketmanager.testSetValidator(marketId, trader.address); 

  });


  it("can approve and lower and upper bound is set", async()=>{
    const marketId = await controller.getMarketId(trader.address);
    const bc_address = await marketmanager.getZCB(marketId);
    const bc = LinearBondingCurve__factory.connect(bc_address, owner);
    const shortzcb_ad = await marketmanager.getShortZCB(marketId);
    const sbc = LinearShortZCB__factory.connect(shortzcb_ad, owner); 
    const proxy_address = await creditline.getProxy(); 
    const proxy = Proxy__factory.connect(proxy_address, owner); 
    const wCollateral_ad = await bc.getCollateral(); 

    //Check that the supply of the bondingcurve is 0, 
    // await expect(bc.getTotalZCB()).to.equal(0); 
    // await expect(bc.getTotalCollateral()).to.equal(0);

    //Do proxy SETTINGS
    await borrowerContract.changeOwner(proxy.address); 
    await borrowerContract.autoDelegate(proxy.address);
    expect(await borrowerContract.owner()).to.equal(proxy.address); 

    const upper_bound_before = await bc.getUpperBound(); 
    const lower_bound_before = await bc.getLowerBound(); 
    console.log('bounds_before', upper_bound_before.toString(), lower_bound_before.toString()); 

    //first need to see if market reverts approving when not enough colalteral bought 
    await expect(controller.approveMarket(marketId)).to.be.reverted; 

    //then buy 0.6 * principal amount for the instrument 
    const instrumentdata = await vault.fetchInstrumentData(marketId); 
    const amountToBuy = instrumentdata.principal.div(2); 
    const amount = instrumentdata.principal.div(2); 
    const preview = await vault.previewMint( amount); 
    console.log('preview', preview.toString()); 
    await collateral.connect(owner).faucet(amount); 
    await collateral.approve(wCollateral_ad, amount.mul(20)); 

    await marketmanager.buy(marketId, amount, 0); 
    const canapprove = await marketmanager.validatorApprovalCondition( marketId ) ;
    console.log('canapprove', canapprove)
    const bal = await bc.balanceOf(owner.address); 
    console.log('bal', bal.toString(),amount); 

    //Then approve this market again after chaning phase, now the instrument should be 
    //credited with the proposed principal 
    // await marketmanager.setAssessmentPhase(marketId, true, false); 
    await collateral.connect(trader).approve(wCollateral_ad, amount.mul(20)); 

    // //This will automatically approve the market 
    await creditline.setValidator(owner.address); 
    await collateral.approve(vault.address, amount.mul(2)); 
    // console.log(' vault preview shares to assets', (await vault.previewMint(pp)).toString(), 
    //   (await collateral.balanceOf(owner.address)).toString()); 
    await vault.deposit(pp_.mul(1500), owner.address); 
    console.log('vaultbalance', (await collateral.balanceOf(vault.address)).toString(), (await vault.previewMint(pp)).toString()); 
    await marketmanager.validatorBuy(marketId); 

    const creditline_balance = await collateral.balanceOf(creditline.address); 
    expect(creditline_balance).to.equal(instrumentdata.principal.div(pp__)); 
    // const validator_vault_balance_after_approve = await vault.connect(trader).balanceOf(owner.address); 
    const validator_balance = await bc.balanceOf(trader.address); 
    // console.log('validatorbalance', validator_balance); 

    // console.log('after_approve', validator_vault_balance_after_approve.toString(),validator_balance.toString() ); 

    const upper_bound = await bc.getUpperBound(); 
    const lower_bound = await bc.getLowerBound(); 
    console.log('bounds', upper_bound.toString(), lower_bound.toString()); 
    // await vault.approve(shortzcb_ad, amount); 
    // // await expect(marketmanager.buy(marketId, amount.div(2), 0)).to.be.reverted; 

    // await marketmanager.openShort(marketId, amount.div(10), 0); 



    });


  it("can drawdown/repay", async()=>{
    const marketId = await controller.getMarketId(trader.address);
    const instrumentdata = await vault.fetchInstrumentData(marketId); 

    const bal_before = await collateral.balanceOf(creditline.address);
    console.log('balbefore', bal_before.toString()); 
    // expect(bal_before).to.equal(instrumentdata.principal); 
    await creditline.drawdown();
    expect(await collateral.balanceOf(creditline.address)).to.equal(0); 
    // expect(await collateral.balanceOf(owner.address)).to.equal(bal_before); 
    console.log('vault bal after drawdown',(await collateral.balanceOf(vault.address)).toString()); 

    var remaining = await creditline.getRemainingOwed(); 
    console.log('remaining before', remaining[0].toString(), remaining[1].toString()); 

    await collateral.approve(creditline.address,instrumentdata.principal );
    await creditline.repay(pp.mul(10));
    remaining = await creditline.getRemainingOwed(); 
    console.log('remaining', remaining[0].toString(), remaining[1].toString()); 

    // await creditline.repay(0, instrumentdata.principal.div(10));

    // const bal = await collateral.balanceOf(creditline.address);  
   // expect(bal).to.equal(instrumentdata.principal.mul(9).div(10)); 

  }); 


  // it ("can restrict by proxy and handle default", async()=>{
  //   const marketId = await controller.getMarketId(trader.address);
  //   const instrumentdata = await vault.fetchInstrumentData(marketId); 
  //   const proxy_address = await creditline.getProxy(); 
  //   const proxy = Proxy__factory.connect(proxy_address, owner); 
  //   const t = await proxy.getOwner(); 
  //   console.log('owner now', t, creditline.address); 
  //   await expect(borrowerContract.changeOwner(owner.address)).to.be.reverted; 

  //   await collateral.approve(creditline.address,instrumentdata.principal );
  //   await creditline.repay(pp.mul(1100));

  //   //const owner = await proxy.getOwner(); 

  // });

  // it( "can handle default and redeem", async()=>{

  //   const marketId = await controller.getMarketId(trader.address);
  //   const instrumentdata = await vault.fetchInstrumentData(marketId); 

  //   await collateral.approve(creditline.address, instrumentdata.principal); 
  //   await creditline.beginGracePeriod();
  //   await creditline.declareDefault(); 
  //   await creditline.onDefault(); 

  //   await controller.beforeResolve(marketId); 
  //   await controller.resolveMarket(marketId);  

  //   const redemptionPrice = await marketmanager.get_redemption_price(marketId); 
  //   console.log('redemption_price', redemptionPrice.toString()); 


  //   const beforeRedemptionBal = (await collateral.balanceOf(owner.address)); 
  //   const beforeRedemptionVault = (await collateral.balanceOf(vault.address));

  //   await marketmanager.redeem(marketId); 
  //   expect((await collateral.balanceOf(owner.address)).sub(beforeRedemptionBal)).to.equal(
  //     beforeRedemptionVault.sub(await collateral.balanceOf(vault.address))); 
  //   console.log("after redemption", (await collateral.balanceOf(owner.address)).sub(beforeRedemptionBal).toString(), 
  //    beforeRedemptionVault.sub(await collateral.balanceOf(vault.address)).toString() )



  // }); 

  it( "can pay back full and close market", async()=>{
    const marketId = await controller.getMarketId(trader.address);
    const instrumentdata = await vault.fetchInstrumentData(marketId); 
    const bc_address = await marketmanager.getZCB(marketId);
    const bc = LinearBondingCurve__factory.connect(bc_address, owner);

    await collateral.approve(creditline.address,instrumentdata.principal );
    await creditline.repay(pp.mul(1100));

    await creditline.onMaturity();
    await collateral.approve(creditline.address,instrumentdata.principal );

    await collateral.approve(creditline.address,instrumentdata.principal );
    await controller.resolveMarket(marketId);  

    console.log('redemption_price', (await marketmanager.get_redemption_price(marketId)).toString()); 
    console.log('myBCbal', (await bc.balanceOf(owner.address)).toString()); 
    const collateralBalBefore = await collateral.balanceOf(owner.address); 
    const collateralBalVault = await collateral.balanceOf(vault.address); 
    await marketmanager.redeem(marketId); 

    expect(await bc.balanceOf(owner.address)).to.equal(0);
    console.log('vault bal before and after rdeem', collateralBalVault.toString(), (await collateral.balanceOf(vault.address)).toString()); 
    console.log("dif", 
((await collateral.balanceOf(owner.address)).sub(collateralBalBefore)).toString(), 
(collateralBalVault.sub(await collateral.balanceOf(vault.address))).toString()
      )

    // expect((await marketmanager.get_redemption_price(marketId)).mul(bc.balanceOf(owner.address)).div(pp))

  }); 

  it("can handle vault accounting and split profit properly", async()=>{

  })
  it("can handle vault accounting after paying shorts as well")
  it( "can redeem from denied")
  it( "can redeem from prepayment")

//    it("everyone can buy and sell", async()=>{

//     //Lets have winners who buys at assessment and market is approved
//     const managers = [manager1, manager2, manager3, manager4]; 
//     const marketId = await controller.getMarketId(trader.address);
//     const bc_address = await controller.getZCB_ad(marketId);
//     const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
//     const amount = pp.mul(1000); 
//     const price_before = await bc.calculateExpectedPrice(0); 
//     let marketphase; 
//     let manager_bc_bal; 
//     let bc_col_bal; 
//     console.log("price_before", price_before.toString()); 
//     for (let i=0; i<managers.length; i++){
//       await collateral.connect(managers[i]).approve(vault.address, amount.mul(2)); 
//       await vault.connect(managers[i]).mint( amount, managers[i].address); 
//       await vault.connect(managers[i]).approve(bc_address, amount); 
//       await marketmanager.connect(managers[i]).buy(marketId, amount.div(10), 0); 

//       bc_col_bal = await bc.getTotalCollateral(); 
//       marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
//       manager_bc_bal = await bc.balanceOf(managers[i].address); 
//       console.log('marketphase/manager_bc_bal/bc_col_bal', marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString() ); 

//     }

//     expect(await vault.balanceOf(bc_address)).to.equal(amount.div(10).mul(managers.length)); 
//     const price_after = await bc.calculateExpectedPrice(0); 
//     console.log("price_after", price_after.toString()); 

//     for (let i=managers.length-1; i>=0; i--){
//       await collateral.connect(managers[i]).approve(vault.address, amount.mul(2)); 
//       await vault.connect(managers[i]).mint( amount, managers[i].address); 
//       manager_bc_bal = await bc.balanceOf(managers[i].address); 
//       await vault.connect(managers[i]).approve(bc_address, amount); 
//       await marketmanager.connect(managers[i]).sell(marketId, manager_bc_bal, 0); 

//       bc_col_bal = await bc.getTotalCollateral(); 
//       marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
//       expect(await bc.balanceOf(managers[i].address)).to.equal(0); 
//       console.log('marketphase/manager_bc_bal/bc_col_bal',
//         marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString() ); 

//     }

//     const price_after_sell = await bc.calculateExpectedPrice(0); 
//     console.log("price_after_sell", price_after_sell.toString()); 

// }); 


//   it("everyone can buy and sell in a loop ", async()=>{

//     //Lets have winners who buys at assessment and market is approved
//     const managers = [manager1, manager2, manager3, manager4]; 
//     const marketId = await controller.getMarketId(trader.address);
//     const bc_address = await controller.getZCB_ad(marketId);
//     const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
//     const amount = pp.mul(1000); 
//     const price_before = await bc.calculateExpectedPrice(0); 
//     let marketphase; 
//     let manager_bc_bal; 
//     let bc_col_bal; 
//     let manager_vault_bal; 
//     console.log("price_before", price_before.toString()); 

//     await vault.connect(managers[0]).mint( amount, managers[0].address); 
//     await vault.connect(managers[0]).approve(bc_address, amount); 

//     for (let i=0; i<=10; i++){
//       await collateral.connect(managers[0]).approve(vault.address, amount.mul(2)); 
 
//       await marketmanager.connect(managers[0]).buy(marketId, amount.div(10), 0); 

//       bc_col_bal = await bc.getTotalCollateral(); 
//       marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
//       manager_bc_bal = await bc.balanceOf(managers[0].address); 
//       console.log('marketphase/manager_bc_bal/bc_col_bal', marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString() ); 
      
//       // await collateral.connect(managers[0]).approve(vault.address, amount.mul(2)); 
//       // await vault.connect(managers[0]).mint( amount, managers[0].address); 
//       manager_bc_bal = await bc.balanceOf(managers[0].address); 
//       await vault.connect(managers[0]).approve(bc_address, amount); 
//       await marketmanager.connect(managers[0]).sell(marketId, manager_bc_bal, 0); 

//       bc_col_bal = await bc.getTotalCollateral(); 
//       marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
//       manager_vault_bal = await vault.balanceOf(managers[0].address); 

//       expect(await bc.balanceOf(managers[0].address)).to.equal(0); 
//       console.log('managervaultbal/manager_bc_bal/bc_col_bal',
//         manager_vault_bal.toString(), manager_bc_bal.toString(),bc_col_bal.toString() ); 


//     }

//     const price_after_sell = await bc.calculateExpectedPrice(0); 
//     console.log("price_after_sell", price_after_sell.toString()); 

// }); 



  // it("everyone can buy and all redeem with increased reputation based on winnings", async()=>{

  //   //Lets have winners who buys at assessment and market is approved
  //   const managers = [manager1, manager2, manager3, manager4]; 
  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
  //   const amount = pp.mul(1000); 
  //   const price_before = await bc.calculateExpectedPrice(0); 
  //   let marketphase; 
  //   let manager_bc_bal; 
  //   let bc_col_bal; 
  //   console.log("price_before", price_before.toString()); 
  //   for (let i=0; i<managers.length; i++){
  //     await collateral.connect(managers[i]).approve(vault.address, amount.mul(2)); 
  //     await vault.connect(managers[i]).mint( amount, managers[i].address); 
  //     await vault.connect(managers[i]).approve(bc_address, amount); 
  //     await marketmanager.connect(managers[i]).buy(marketId, amount.div(10), 0); 

  //     bc_col_bal = await bc.getTotalCollateral(); 
  //     marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
  //     manager_bc_bal = await bc.balanceOf(managers[i].address); 
  //     console.log('marketphase/manager_bc_bal/bc_col_bal', marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString() ); 

  //   }

  //   //expect(await vault.balanceOf(bc_address)).to.equal(amount.div(10).mul(managers.length)); 
  //   const price_after = await bc.calculateExpectedPrice(0); 
  //   console.log("price_after", price_after.toString()); 


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
    //   await marketmanager.connect(managers[i]).redeem(marketId); 

    //   expect(await bc.balanceOf(managers[i].address)).to.equal(0);
    //   manager_reputation = await rep.getReputationScore(managers[i].address);
    //   manager_vault_bal_after = await vault.balanceOf(managers[i].address); 
    //   total_profits.add(manager_vault_bal_after.sub(manager_vault_bal))
    //   console.log('After redeem vault_bal,reputation', manager_vault_bal_after.toString(), manager_reputation.toString());
    // }
    // expect(await marketmanager._isValidator( marketId,  trader.address) ).to.be.true; 
    // const validator_redeem_before = await vault.balanceOf(trader.address);
    // await marketmanager.connect(trader).redeem(marketId); 
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
  // })

  // it("can do accounting at maturity with vault")



  // it("some people will long some will short, and market is approved then redeemed   ", async()=>{

  //   const managers = [manager1, manager2, manager3, manager4]; 
  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
  //   const shortzcb_ad = await controller.getshortZCB_ad(marketId);
  //   const sbc = LinearShortZCB__factory.connect(shortzcb_ad, owner); 

  //   const amount = pp.mul(1000); 
  //   const price_before = await bc.calculateExpectedPrice(0); 
  //   let marketphase; 
  //   let manager_bc_bal; 
  //   let bc_col_bal; 
  //   let doLong; 
  //   let price_now; 
  //   let shortReserves; 
  //   let longReserves; 
  //   let totalSupply; 

  //   console.log("price_before", price_before.toString()); 
  //   for (let i=0; i<managers.length; i++){
  //     await collateral.connect(managers[i]).approve(vault.address, amount.mul(2)); 
  //     await vault.connect(managers[i]).mint( amount, managers[i].address); 
  //     await vault.connect(managers[i]).approve(bc_address, amount); 
  //     await vault.connect(managers[i]).approve(shortzcb_ad, amount); 
  //     if (i==0){

  //       await marketmanager.connect(managers[i]).buy(marketId, amount.div(7), 0); 
  //     }
  //     else if(i==1){
  //       await marketmanager.connect(managers[i]).openShort(marketId, amount.div(100), 0);
  //     }

  //     else if(i==2){
  //       await marketmanager.connect(managers[i]).buy(marketId, amount.div(7), 0); 

  //     }

  //     else if(i==3){
  //       await marketmanager.connect(managers[i]).openShort(marketId, amount.div(50), 0);
  //     }

  //     else if(i==4){
  //       await marketmanager.connect(managers[i]).buy(marketId, amount.div(6), 0); 

  //     }

  //     totalSupply = await bc.totalSupplyAdjusted(); 
  //     shortReserves = await sbc.getReserves(); 
  //     longReserves = await bc.getReserves(); 
  //     console.log("i, totalSupply, longReserves and short Reserves", i, totalSupply.toString(), longReserves.toString(), 
  //       shortReserves.toString()); 
  //     price_now = await bc.calculateExpectedPrice(0); 
  //     bc_col_bal = await bc.getTotalCollateral(); 
  //     marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
  //     manager_bc_bal = await bc.balanceOf(managers[i].address); 
  //     console.log('marketphase/manager_bc_bal/bc_col_bal/pricenow', marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString(), price_now.toString()); 
  //     console.log("_____________________")
  //   }
    //get amount you need to short x amount(area under curve) and sell 




  //})

  // it("long and short and close again and again ", async()=>{

  //   const managers = [manager1, manager2, manager3, manager4]; 
  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
  //   const shortzcb_ad = await controller.getshortZCB_ad(marketId);
  //   const sbc = LinearShortZCB__factory.connect(shortzcb_ad, owner); 

  //   const amount = pp.mul(1000); 
  //   const price_before = await bc.calculateExpectedPrice(0); 
  //   let marketphase; 
  //   let manager_bc_bal; 
  //   let bc_col_bal; 
  //   let doLong; 
  //   let price_now; 
  //   let shortReserves; 
  //   let longReserves; 
  //   let totalSupply; 
  //   let previous_manager_balance; 
  //   let manager_sbc_bal; 

  //   console.log("price_before", price_before.toString()); 
  //   for (let i=0; i<3; i++){
  //     await collateral.connect(managers[i]).approve(vault.address, amount.mul(2)); 
  //     await vault.connect(managers[i]).mint( amount, managers[i].address); 
  //     await vault.connect(managers[i]).approve(bc_address, amount); 
  //     await vault.connect(managers[i]).approve(shortzcb_ad, amount); 
  //     if (i==0){

  //       await marketmanager.connect(managers[i]).buy(marketId, amount.div(7), 0); 
  //     }
  //     else if(i==1){
  //       manager_bc_bal = await bc.balanceOf(managers[i-1].address); 
  //       previous_manager_balance = await bc.calculateSaleReturn(manager_bc_bal);
  //       console.log('sub', manager_bc_bal.sub(previous_manager_balance).toString(), previous_manager_balance.toString(), manager_bc_bal.toString())
  //       await marketmanager.connect(managers[i]).openShort(marketId, manager_bc_bal.sub(previous_manager_balance) , 0);
  //     }
  //     else if(i==2){

  //       await marketmanager.connect(managers[i-1]).closeShort(marketId,  await sbc.balanceOf(managers[i-1].address), 0);

  //     }



  //     totalSupply = await bc.totalSupplyAdjusted(); 
  //     shortReserves = await sbc.getReserves(); 
  //     longReserves = await bc.getReserves(); 
  //     console.log("i, totalSupply, longReserves and short Reserves", i, totalSupply.toString(), longReserves.toString(), 
  //       shortReserves.toString()); 
  //     price_now = await bc.calculateExpectedPrice(0); 
  //     bc_col_bal = await bc.getTotalCollateral(); 
  //     marketphase = await marketmanager.getCurrentMarketPhase( marketId); 
  //     manager_bc_bal = await bc.balanceOf(managers[i].address); 
  //     manager_sbc_bal = await sbc.balanceOf(managers[i].address); 
  //     console.log('marketphase/manager_bc_bal/bc_col_bal/pricenow', marketphase.toString(), manager_bc_bal.toString(),bc_col_bal.toString(), price_now.toString()); 
  //     console.log("_____________________")
  //   }


  // })

  // it("can do trade post assessment with boundaries", async()=> {
    //need to run above test, then approve 
    // const managers = [manager1, manager2, manager3, manager4]; 
    // const marketId = await controller.getMarketId(trader.address);
    // const bc_address = await controller.getZCB_ad(marketId);
    // const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
    // const shortzcb_ad = await controller.getshortZCB_ad(marketId);
    // const sbc = LinearShortZCB__factory.connect(shortzcb_ad, owner); 
    // const amount = pp_.mul(1000); 

    // await validator_approve( trader, trader.address, controller, vault, collateral, marketmanager, marketId, amount);

    // const upper = await bc.getUpperBound(); 
    // const lower = await bc.getLowerBound();
    // console.log('Upper/lower', upper.toString(), lower.toString());

    // await collateral.connect(owner).approve(vault.address, amount.mul(2)); 
    // await vault.connect(owner).mint( amount, owner.address); 
    // await vault.connect(owner).approve(bc_address, amount); 

    // await marketmanager.connect(owner).buy(marketId, amount.div(1000)); 
    // await marketmanager.connect(owner).buy(marketId, amount.div(5)); 



  // })




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




