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
  CreditLine, 
  CreditLine__factory, 
  LinearBondingCurve, 
  LinearBondingCurve__factory,
  MarketManager__factory, 
  LinearShortZCB__factory, 
  LinearShortZCB


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

// async function reset( ): Promise<boolean>   
// async function buy(): Promise<boolean>
// async function sell(): Promise<boolean>

describe("Cycle", ()=>{
  let owner: SignerWithAddress; 
  let trader: SignerWithAddress; 

  let collateral: Cash; 
  let marketFactory: TrustedMarketFactoryV3; 
  let vault: Vault;
  let creditline: CreditLine; 
  let controller: Controller; 
  let rep: ReputationNFT; 
  let bc: LinearBondingCurve; 
  let marketmanager: MarketManager; 

  let CreditLine__factory: CreditLine__factory; 
  let MarketManager__factory: MarketManager__factory; 
  //let LinearBondingCurve__factory: LinearBondingCurve__factory; 

  const principal = 10000000;
  const drawdown = 5000000; 
  const interestAPR = 100000; 
  const duration = 10000000; 
  const faceValue = 12000000; 

  const data = {} as InstrumentData_;

  before(async() =>{
    [owner, trader] = await ethers.getSigners();
    controller = (await ethers.getContract("Controller")) as Controller; 

    marketmanager = (await ethers.getContract("MarketManager")) as MarketManager; 
    collateral = (await ethers.getContract("Collateral")) as Cash; 
    vault = (await ethers.getContract("Vault")) as Vault; 
    marketFactory = (await ethers.getContract("TrustedMarketFactoryV3")) as TrustedMarketFactoryV3; 
    CreditLine__factory = (await ethers.getContractFactory("CreditLine")) as CreditLine__factory; 
    creditline = await CreditLine__factory.deploy(
      vault.address, trader.address, principal, interestAPR, duration, faceValue) as CreditLine;
    rep = (await ethers.getContract("ReputationNFT")) as ReputationNFT; 

   // MarketManager__factory = (await ethers.getContractFactory("MarketManager")) as MarketManager__factory; 
   // marketmanager = await MarketManager__factory.deploy(
     // owner.address, vault.address, controller.address) as MarketManager; 


    ///SETTINGS
    await controller.setMarketManager(marketmanager.address);
    await controller.setVault(vault.address);
    await controller.setMarketFactory(marketFactory.address);

    await collateral.connect(owner).faucet(500000000000);
    await collateral.connect(trader).faucet(200000000000); 
    //1 collateral is 1e12 other 
    await creditline.setUtilizer(owner.address); 

    const repbalance = await rep.balanceOf(owner.address); 
    if (repbalance.toString() == "0"){
      await rep.mint(owner.address); 
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
    await controller.initiateMarket(trader.address, data); 
    const marketId = await controller.getMarketId(trader.address); 
    const instrumentdata = await vault.fetchInstrumentData(marketId); 
    console.log("marketId", marketId.toString())
    expect(instrumentdata.balance).to.equal(data.balance); 
    expect(instrumentdata.principal).to.equal(data.principal); 

  });

  // it("can mint/redeem from vault", async()=>{

  //   await collateral.connect(owner).faucet(principal); 
  //   await collateral.approve(vault.address, principal); 
  //   await vault.mint(principal.toString(), owner.address);
  //   expect(await vault.totalAssets()).to.equal(principal); 
  //   expect(await vault.balanceOf(owner.address)).to.equal(principal); 

  //   await vault.withdraw(principal, owner.address, owner.address); 
  //   expect(await vault.totalAssets()).to.equal(0); 
  //   expect(await vault.balanceOf(owner.address)).to.equal(0); 

  //   await collateral.approve(vault.address, principal); 
  //   await vault.mint(principal.toString(), owner.address);
  //   expect(await vault.totalAssets()).to.equal(principal); 
  //   expect(await vault.balanceOf(owner.address)).to.equal(principal); 

  // }); 


  // it("can calculate Hedge Price and quantity", async()=>{
  //   const marketId = await controller.getMarketId(trader.address);

  //   const hedgePrice = await marketmanager.getHedgePrice(marketId);
  //   const hedgeQuantity = await marketmanager.getHedgeQuantity(owner.address, marketId); 
  //   const marketcondition = await marketmanager.marketCondition( marketId); 

  //   console.log(hedgePrice.toString(), hedgeQuantity.toString(), marketcondition); 

  //   await vault.withdraw(principal, owner.address, owner.address); 
  //   expect(await vault.totalAssets()).to.equal(0); 
  //   expect(await vault.balanceOf(owner.address)).to.equal(0); 

  // });

  // it("can update reputation", async()=>{

  // })

  // it("can buy/sell during onlyAssessment/onlyReputation ", async()=>{
  //   const amount = pp_.mul(30); 
  //   await collateral.connect(owner).faucet(amount); 
  //   await collateral.approve(vault.address, amount); 
  //   await vault.mint(amount.toString(), owner.address);

  //   var vaultBalance = await vault.balanceOf(owner.address);

  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
  //   await vault.approve(bc_address, amount); 
  //   await marketmanager.buy(marketId, amount);

  //   var balance = await bc.balanceOf(owner.address); 
  //   var totalsupply = await bc.getTotalZCB();
  //   var reserves = await bc.getReserves();
  //   var vaultBalanceAfter = await vault.balanceOf(owner.address)
  //   expect(reserves).to.equal(amount); 
  //   expect(balance).to.equal(totalsupply);
  //   expect(vaultBalance.sub(vaultBalanceAfter)).to.equal(amount); 
  //   console.log('Before RESERVES, BALANCES, totalsupply, ', reserves.toString(), balance.toString(),
  //    totalsupply.toString(), vaultBalanceAfter.toString()); 
  //   const priceafterbuy = await bc.calculateExpectedPrice(0); 
  //   console.log('pricenow', priceafterbuy.toString());
  //   //now sell


  //   await marketmanager.sell(marketId, balance);
  //   const balance2 = await bc.balanceOf(owner.address); 
  //   const totalsupply2 = await bc.getTotalZCB();
  //   const reserves2 = await bc.getReserves();
  //   const vaultBalance2 = await vault.balanceOf(owner.address)
  //   console.log('After RESERVES, BALANCES, totalsupply, ', reserves2.toString(), balance2.toString(), 
  //     totalsupply2.toString(), vaultBalance2.toString()); 

  //   const priceaftersell = await bc.calculateExpectedPrice(0); 
  //   console.log('pricenow', priceaftersell.toString()); 


  //   const avg_price = await bc.calcAveragePrice(pp.mul(1100)); 
  //   const implied_prob = await bc.calcImpliedProbability(pp_.mul(10), pp.mul(5).div(10)); 
  //   console.log('avg_price for buying 1100 bonds', avg_price.toString());
  //   console.log('implied_prob for buying 10 collateral worth of bonds', implied_prob.toString()); 

  //   // expect(reserves).to.equal(0); 
  //   // expect(balance).to.equal(0);
  //   // expect(totalsupply).to.equal(0);
  //   //expect(vaultBalance.sub(vaultBalance)).to.equal(amount); 

  // }); 



  // it("can short sell during onlyAssessment", async()=>{
  //   //Buy first, borrow it, then sell it 

  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner); 

  //   //Check that the supply of the bondingcurve is 0, 
  //   // expect(await bc.getTotalZCB()).to.equal(0); 
  //   // expect(await bc.getTotalCollateral()).to.equal(0);
  //   await collateral.connect(owner).faucet(principal); 
  //   await collateral.approve(vault.address, principal); 
  //   await vault.mint(principal.toString(), owner.address);

  //   //somebody has to buy first 
  //   const startprice = await bc.calculateExpectedPrice(0); 
  //   const buy_amount = pp_.mul(1); 

  //   await vault.approve(bc_address, buy_amount); 
  //   await marketmanager.buy(marketId, buy_amount); 
  //   var vaultbalance1 = await vault.balanceOf(owner.address); 

  //   const priceafterbuy = await bc.calculateExpectedPrice(0); 
  //   const requested_zcb = pp_.mul(1); //this is in collateral amount; 
  //   await vault.approve(marketmanager.address, buy_amount); 
  //   await marketmanager.borrow_with_collateral(marketId, requested_zcb, owner.address); 
  //   var bcBalance = await bc.balanceOf(owner.address);
  //   var vaultbalance2 = await vault.balanceOf(owner.address); //should be less
  //  // expect(vaultbalance1.sub(vaultbalance2)).to.equal(requested_zcb); 
  //  // expect(bcBalance).to.equal(requested_zcb);

  //   //now sell, vault balance should go up, zcb balance to go down 
  //   await marketmanager.sell(marketId, buy_amount);//how much zcb do I get for this collateral amount? 
  //   bcBalance = await bc.balanceOf(owner.address);
  //   var vaultbalance3 = await vault.balanceOf(owner.address); //should be less
  //   // const diff = (vaultbalance1 - vaultbalance3); 
  //   const priceafterSell = await bc.calculateExpectedPrice(0); 

  //   console.log('price should increase and decrease 1,2,3:', 
  //     startprice.toString(), priceafterbuy.toString(), priceafterSell.toString() )
  //   // console.log('difference, should be postive', diff.toString()); 
  //   //expect(bcBalance).to.equal(0); 


  // }); 

  // it("can buy back and repay debt", async()=> {
  //   // Use previously borrowed/sell position and buy back + repay 
  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner); 
  //   //Check that the supply of the bondingcurve is 0, 
  //   expect(await bc.getTotalZCB()).to.equal(0); 
  //   expect(await bc.getTotalCollateral()).to.equal(0);

  //   const debtData1 = await marketmanager.getDebtPosition(owner.address,  marketId); 
  //   const borrowed_zcb = debtData1[1]; 
  //   const vaultBalanceBeforeBuyAndRepay = await vault.balanceOf(owner.address); 
  //   console.log("debtData1", debtData1[0].toString(), debtData2[1].toString()); 

  //   const neededamount = bc.calcAreaUnderCurve(borrowed_zcb); 
  //   await vault.approve(bc_address, neededamount); 
  //   await marketmanager.buy(marketId, neededamount); //this will credit me with the required zcb 
  //   const vaultBalanceAfterBuyNoRepay = await vault.balanceOf(owner.address); 
  //   await marketmanager.repay_for_collateral(marketId, borrowed_zcb, owner.address); //need to repay the zcb to get the collateral back
  //   const debtData2 = await marketmanager.getDebtPosition(owner.address, marketId);
  //   const vaultBalanceAfterRepay  = await vault.balanceOf(owner.address); 
  //   console.log("debtData2", debtData2[0].toString(), debtData2[1].toString()); 
  //   console.log('Vault Balances,'vaultBalanceBeforeBuyAndRepay.toString(),vaultBalanceAfterBuyNoRepay.toString(),
  //    vaultBalanceAfterRepay.toString()); 
  //   expect(vaultBalanceAfterRepay-vaultBalanceAfterBuyNoRepay).to.equal(debtData1[0]); 
  //   expect(debtData2[0]).to.equal(0);
  //   expect(debtData2[1]).to.equal(0); //both borrowed amount and submitted collateral should equal 0 

  // }); 

  // // function getDebtPosition(address trader, uint256 marketId) public view returns(uint256, uint256){
  // //   CDP storage cdp = debt_pools[marketId];
  // //   return (cdp.collateral_amount[trader], cdp.borrowed_amount[trader]);
  // // }

  it("can approve", async()=>{
    const marketId = await controller.getMarketId(trader.address);
    const bc_address = await controller.getZCB_ad(marketId);
    const bc = LinearBondingCurve__factory.connect(bc_address, owner);
    //Check that the supply of the bondingcurve is 0, 
    // await expect(bc.getTotalZCB()).to.equal(0); 
    // await expect(bc.getTotalCollateral()).to.equal(0);

    //first need to see if market reverts approving when not enough colalteral bought 
    await expect(controller.approveMarket(marketId)).to.be.reverted; 

    //then buy 0.6 * principal amount for the instrument 
    const instrumentdata = await vault.fetchInstrumentData(marketId); 
    const amountToBuy = instrumentdata.principal.div(2); 
    const amount = instrumentdata.principal.div(2); 
    const preview = await vault.previewMint( amount); 
    console.log('preview', preview.toString()); 
    await collateral.connect(owner).faucet(amount); 
    await collateral.approve(vault.address, amount.mul(10)); 
    await vault.mint(amount.toString(), owner.address);
  
    await vault.approve(bc_address, amount); 
    await marketmanager.buy(marketId, amount); 

    //Then approve this market again after chaning phase, now the instrument should be 
    //credited with the proposed principal 
    // await marketmanager.setAssessmentPhase(marketId, true, false); 
    await controller.approveMarket(marketId); 
    const creditline_balance = await collateral.balanceOf(creditline.address); 
    expect(creditline_balance).to.equal(instrumentdata.principal); 



  }); 


  // //need a new market for this 
  // it("can deny market and redeem from denied market", async()=>{

  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner);
  //   //Check that the supply of the bondingcurve is 0, 
  //   // await expect(bc.getTotalZCB()).to.equal(0); 
  //   // await expect(bc.getTotalCollateral()).to.equal(0);

  //   const vaultbalancebeforebuy = await vault.balanceOf(owner.address); 
  //   //First buy from market 
  //   const buy_amount = pp_.mul(10); 
  //   await vault.approve(bc_address, buy_amount); 
  //   await marketmanager.buy(marketId, buy_amount); 
  //   const vaultbalanceafterbuy = await vault.balanceOf(owner.address); 

  //   //for second trader
  //   // await vault.connect(trader).approve(bc_address, buy_amount); 
  //   // await marketmanager.connect(trader).buy(marketId, buy_amount);     

  //   await controller.denyMarket(marketId); 
  //   await marketmanager.redeemPostAssessment(marketId, owner.address); //this should give me back my vaults AND get rid of my zcb 
  //   const vaultbalanceafterredemption = await vault.balanceOf(owner.address); 
  //   const zcbbalanceafterredemption = await bc.balanceOf(owner.address); 
  //   expect(zcbbalanceafterredemption).to.equal(0); 
  //   expect(vaultbalanceafterredemption).to.equal(vaultbalancebeforebuy); 

  //   //for second trader
  //   // await marketmanager.connect(trader).redeemPostAssessment(marketId, owner.address); //this should give me back my vaults AND get rid of my zcb 
  //   // await expect(bc.balanceOf(trader.address)).to.equal(0); 

  // }); 


  //TODO do redemption solidity first 
  // it("can close market and redeem at maturity", async()=>{
  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner);

  //   const amount = pp_.mul(30); 
  //   const preview = await vault.previewMint( amount); 
  //   console.log('preview', preview.toString()); 
  //   await collateral.connect(owner).faucet(amount); 
  //   await collateral.approve(vault.address, amount.mul(10)); 
  //   await vault.mint(amount.toString(), owner.address);

  //   var vaultBalance = await vault.balanceOf(owner.address);
  //   console.log('vaultBalance before buying', vaultBalance.toString()); 
  
  //   await vault.approve(bc_address, amount); 
  //   await marketmanager.buy(marketId, amount);

  //   const bccollateralbalance_before = await vault.balanceOf(bc.address);
  //   await controller.resolveMarket(marketId, false, 0, 0); 

  //   const marketactive = await marketmanager.marketActive( marketId)
  //   console.log('marketactive', marketactive); 

  //   const vaultBalanceAfterBuy = await vault.balanceOf(owner.address); 
  //   const ownerzcbbalance = await bc.balanceOf(owner.address); 
  //   const bccollateralbalance = await vault.balanceOf(bc.address); 
  //   const redemption_price = await marketmanager.get_redemption_price(marketId);
  //   const redeem_amount =  await ownerzcbbalance.mul(redemption_price).div(pp_); 
  //   console.log('vaultBalanceAfterBuy',vaultBalanceAfterBuy.toString()); 
  //   console.log('ownerzcbbalance', ownerzcbbalance.toString());
  //   console.log('bcCollateralbalance',bccollateralbalance_before.toString(), bccollateralbalance.toString()) ;
  //   console.log('redemption_price', redemption_price.toString(), redeem_amount.toString()); 

  //   //now vaultbalance should increase, zcb should go to 0
  //   await marketmanager.redeem(marketId, owner.address) 
  //   const new_ownerzcbbalance = await bc.balanceOf(owner.address);
  //   const vaultBalanceAfterRedeem = await vault.balanceOf(owner.address); 
  //   expect(new_ownerzcbbalance).to.equal(0); 
  //   console.log("vaultBalanceAfterRedeem", vaultBalanceAfterRedeem.toString())


  // }); 


 // it("can close market and show and add reputation score", async()=>{

 //    const marketId = await controller.getMarketId(trader.address);
 //    const bc_address = await controller.getZCB_ad(marketId);
 //    const bc = LinearBondingCurve__factory.connect(bc_address, owner);

 //    const amount = pp_.mul(30); 
 //    await collateral.connect(owner).faucet(amount); 
 //    await collateral.approve(vault.address, amount); 
 //    await vault.mint(amount.toString(), owner.address);

 //    var vaultBalance = await vault.balanceOf(owner.address);
 //    console.log('vaultBalance before buying', vaultBalance.toString()); 
  
 //    await vault.approve(bc_address, amount); 
 //    await marketmanager.buy(marketId, vaultBalance);

 //    await controller.resolveMarket(marketId, false, 0, 0); 

 //    //await rep.addScore(owner.address, 100, address to, uint256 score, bool atLoss); 
 //    await marketmanager.updateReputation(marketId); 
 //    const rep_score = await rep.getReputationScore(owner.address);
 //    console.log('repscore', rep_score.toString()); 

 // })


  // it("can short via shortzcb", async() =>{

  //   //someone needs to buy first 
  //   const marketId = await controller.getMarketId(trader.address);
  //   const bc_address = await controller.getZCB_ad(marketId);
  //   const bc = LinearBondingCurve__factory.connect(bc_address, owner);
  //   const shortzcb_ad = await controller.getshortZCB_ad(marketId);
  //   const sbc = LinearShortZCB__factory.connect(shortzcb_ad, owner); 

  //   const amount = pp_.mul(5); 
  //   await collateral.connect(owner).faucet(amount); 
  //   await collateral.approve(vault.address, amount); 
  //   await vault.mint(amount.toString(), owner.address);

  //   var vaultBalance = await vault.balanceOf(owner.address);
  //   console.log('vaultBalance before buying', vaultBalance.toString()); 
  
  //   await vault.approve(bc_address, amount.div(2)); 
  //   await marketmanager.buy(marketId, amount.div(2)); //buy 304
  //   const bcsupply = await bc.getTotalZCB(); 
  //   const bcCollateralbalance = await bc.getTotalCollateral();
  //   const vaultBalanceAterBuy = await vault.balanceOf(owner.address);
  //   const currentprice = await bc.calculateExpectedPrice(0); 

  //  // expect(bcCollateralbalance).to.equal(vaultBalance); 
  //   console.log('vaultBalacnce after buying', vaultBalanceAterBuy.toString()); 
  //   console.log('supply and pooled collateral, ', bcsupply.toString(), bcCollateralbalance.toString()); 
  //   console.log('currentprice', currentprice.toString()); 

  //   const amountgivensell = await sbc.calculateAmountGivenSell(amount.div(20)); 
  //   const average_price_sell = await sbc.calculateAveragePrice(amount.div(20));
  //   const maxshortamount = await sbc.getMaxShortAmount();
  //   console.log('amountgivensell', amountgivensell.toString(), average_price_sell.toString()); 
  //   console.log('max short amount', maxshortamount.toString()); 

  //   await vault.approve(shortzcb_ad, amount); 
  //   await marketmanager.sellShort(marketId, amount.div(20)); 
  //   const shortzcb_balance = await sbc.balanceOf(owner.address); 
  //   const vaultBalanceAfterShort = await vault.balanceOf(owner.address);
  //   const sbc_vaultBalance = await vault.balanceOf(shortzcb_ad); 
  //   console.log('shortzcb', shortzcb_balance.toString(), vaultBalanceAfterShort.toString(), sbc_vaultBalance.toString()); 

  //   await controller.denyMarket(marketId); 
  //   await marketmanager.shortRedeemDeniedMarket( marketId,  owner.address); 
  //   const vaultBalanceAfterRedeem = await vault.balanceOf(owner.address);
  //   const sortzcb_balanceAfterRedeem =  await sbc.balanceOf(owner.address);
  //   console.log('after redeem',vaultBalanceAfterRedeem.toString(), sortzcb_balanceAfterRedeem.toString() ); 
  //  // await sbc.calculateAveragePrice(uint256 amount)

  //   // await marketmanager.sellShort(marketId, 
  //   // uint256 marketId, 
  //   // uint256 collateralIn

  //   // ) 


  // })


})
