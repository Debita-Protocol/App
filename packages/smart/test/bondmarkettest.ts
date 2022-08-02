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
  ReputationNFT 
} from "../typechain";

import { BigNumber } from "ethers";

//Trading during start(reputable+assessment)-> change phase to assement+ trade-> 
//change phase to not assessment -> trade 
//test shorting/redeeming 
describe("BondMarket", () => {
  let owner: SignerWithAddress; 
  let trader: SignerWithAddress; 
  let controller: Controller; 
  let ammFactory: AMMFactory; 
  let marketFactory: TrustedMarketFactoryV3; 
  let marketmanager: MarketManager; 
  let bondingcurve: BondingCurve; 
  let collateral: Cash; 
  let repNFT: ReputationNFT; 

  var owner_collateral_balance; 

  let marketId: BigNumber; 
  const test_marketId = 1; 
  before(async() =>{
    [owner, trader] = await ethers.getSigners();

    controller = await ethers.getContract("Controller") as any;
    ammFactory = (await ethers.getContract("AMMFactory")) as AMMFactory;
    marketFactory = (await ethers.getContract("TrustedMarketFactoryV3")) as TrustedMarketFactoryV3;
    marketmanager = (await ethers.getContract("MarketManager")) as any;
    bondingcurve =(await ethers.getContract("BondingCurve")) as any;
    collateral = await ethers.getContract("Collateral") as Cash;
    repNFT = await ethers.getContract("ReputationNFT") as ReputationNFT; 

    await collateral.connect(owner).faucet(500000000000)
    await collateral.connect(trader).faucet(200000000000)


  });

  it("check balance", async()=>{
    owner_collateral_balance = await collateral.balanceOf(owner.address); 
    console.log("owner_collateral_balance", owner_collateral_balance.toString())
  });

  it("initiates market", async()=>{
    await bondingcurve.addManager(marketmanager.address)
    await marketFactory.createZCBMarket(
      owner.address, 
      "test", 
      "test market",
      [0,0], 
      bondingcurve.address
      );

    marketId = await marketFactory.marketCount();
    await marketmanager.initiate_bonding_curve(test_marketId); 
    await marketmanager.setMarketRestrictionData(true, true, test_marketId, 0); 
  });


  it("can restrict", async()=>{
    await controller.mintRepNFT(repNFT.address, owner.address)
    var ownerCanBuy = await marketmanager.canBuy(owner.address, ammFactory.address, 
      marketFactory.address, 100000000000, test_marketId
      )
    expect(ownerCanBuy).to.equal(true);

    await marketmanager.setAssessmentPhase(test_marketId, false, false);//now unverified can buy 
    ownerCanBuy = await marketmanager.canBuy(owner.address, ammFactory.address, 
      marketFactory.address, 100000000000, test_marketId
      )
    var otherCanBuy = await marketmanager.canBuy(trader.address, ammFactory.address, 
      marketFactory.address, 100000000000, test_marketId) 
    expect(ownerCanBuy).to.equal(true);
    expect(otherCanBuy).to.equal(true);


  })

  it("can buy duringAssessment/onlyReputation", async()=> {
    await marketmanager.setAssessmentPhase(test_marketId, true, true);
    const collateral_in = 100000000000; 

    await collateral.connect(owner).approve(ammFactory.address,collateral_in); 
    await collateral.connect(trader).approve(ammFactory.address,collateral_in); 

    await marketmanager.connect(owner).buy(ammFactory.address, marketFactory.address,test_marketId, collateral_in);
    var owner_zcb_balance = await bondingcurve.getZCB_balance(test_marketId,owner.address);
    expect(owner_zcb_balance).to.equal(collateral_in);

    await marketmanager.connect(owner).sell(ammFactory.address, marketFactory.address,
      test_marketId, owner_zcb_balance)

  }); 

  it("can buy/sell after assessment/onlyreputation ", async()=>{
    await marketmanager.setAssessmentPhase(test_marketId, false, false);
    const collateral_in = 100000000000; 

    await collateral.connect(owner).approve(ammFactory.address,collateral_in); 
    await collateral.connect(trader).approve(ammFactory.address,collateral_in); 

    var bondfunds = await bondingcurve.getBondFunds(test_marketId); 
    var getTotalPurchased = await bondingcurve.getTotalPurchased(test_marketId);
    console.log('funds', bondfunds.toString(), getTotalPurchased.toString());

    await marketmanager.connect(owner).buy(ammFactory.address, marketFactory.address,test_marketId, collateral_in);
    var owner_zcb_balance = await bondingcurve.getZCB_balance(test_marketId,owner.address);
    await marketmanager.connect(owner).sell(ammFactory.address, marketFactory.address,
      test_marketId, owner_zcb_balance)
    owner_zcb_balance = await bondingcurve.getZCB_balance(test_marketId,owner.address);
    expect(owner_zcb_balance).to.equal(0); 

    await marketmanager.connect(trader).buy(ammFactory.address, marketFactory.address,test_marketId, collateral_in);
    var trader_zcb_balance = await bondingcurve.getZCB_balance(test_marketId,trader.address); 
    expect(trader_zcb_balance).to.equal(collateral_in);
    await marketmanager.connect(trader).sell(ammFactory.address, marketFactory.address,
      test_marketId, trader_zcb_balance);
    trader_zcb_balance = await bondingcurve.getZCB_balance(test_marketId,trader.address);
    expect(trader_zcb_balance).to.equal(0); 


    bondfunds = await bondingcurve.getBondFunds(test_marketId); 
    getTotalPurchased = await bondingcurve.getTotalPurchased(test_marketId);
    console.log('funds', bondfunds.toString(), getTotalPurchased.toString()); 

  });

  it("can shortSell after assessment/onlyreputation", async()=>{
    await marketmanager.setAssessmentPhase(test_marketId, false, false);

    const borrow_amount_in_zcb = 100000000000; 
    const owner_zcb_balance = await bondingcurve.getZCB_balance(test_marketId,owner.address);
    const owner_collateral_balance = await collateral.balanceOf(owner.address); 
    await collateral.connect(owner).approve(marketmanager.address, borrow_amount_in_zcb); //TODO this is because 1:1 now

    await marketmanager.connect(owner).borrow_with_collateral(test_marketId,
    borrow_amount_in_zcb, owner.address); 

    var new_owner_zcb_balance= await bondingcurve.getZCB_balance(test_marketId,owner.address);
    var new_owner_collateral_balance = await collateral.balanceOf(owner.address);

    expect(new_owner_zcb_balance).to.equal(borrow_amount_in_zcb ); 
    console.log('ownerbalances', owner_collateral_balance.toString(), new_owner_collateral_balance.toString()); 
    
    await marketmanager.connect(owner).sell(ammFactory.address, marketFactory.address,
      test_marketId, new_owner_zcb_balance)

    new_owner_zcb_balance= await bondingcurve.getZCB_balance(test_marketId,owner.address);
    new_owner_collateral_balance = await collateral.balanceOf(owner.address);

    expect(new_owner_zcb_balance).to.equal(0); 
    console.log('finalownerbalance', new_owner_collateral_balance);


  }); 


  it("can resolve at loss but no principal loss", async()=>{
    const atLoss = true; 
    const extra_gain = 0; 
    const principal_loss = 0; 

    const collateral_in = 100000000000; 

    await collateral.connect(owner).approve(ammFactory.address,collateral_in); 
    await collateral.connect(trader).approve(ammFactory.address,collateral_in); 
    await marketmanager.connect(owner).buy(ammFactory.address, marketFactory.address,test_marketId, collateral_in);

    await marketmanager.update_redemption_price(test_marketId, atLoss, extra_gain, principal_loss); 
    await marketmanager.handle_maturity(test_marketId, atLoss, principal_loss); 
    const redemption_price = await marketmanager.get_redemption_price(test_marketId); 

    expect(redemption_price).to.equal(1e6); 

    var new_owner_zcb_balance= await bondingcurve.getZCB_balance(test_marketId,owner.address);
    await marketmanager.connect(owner).sell(ammFactory.address, marketFactory.address,
      test_marketId, new_owner_zcb_balance); 



  })


  it("can deny", async()=>{
    //use different marketID here 
    const collateralIn = 100000000000
    await collateral.connect(owner).approve(ammFactory.address,collateralIn); 

    var bondfunds = await bondingcurve.getBondFunds(marketId); 
    var getTotalPurchased = await bondingcurve.getTotalPurchased(marketId);
    expect(bondfunds).to.equal(0); 

    await marketmanager.connect(owner).buy(ammFactory.address, marketFactory.address,marketId, collateralIn);
    await marketmanager.denyMarket(marketId); 
    await marketmanager.redeem_post_assessment(marketId, owner.address); 

  })

  // it("can resolve at no loss", async()=>{
  //   market_manager.update_redemption_price(test_marketId, )


  // })

  // it("can resolve at no loss and extra gain", async()=>{
  //   market_manager.update_redemption_price(test_marketId, )


  // })





  // it("can redeem", async()=>{



  // });














});