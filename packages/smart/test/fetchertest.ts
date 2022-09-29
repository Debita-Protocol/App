import { deployments, ethers } from "hardhat";
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

describe.only("Fetcher Tests", ()=>{
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
    await vault.mint(amount.mul(2), owner.address); 
    await marketmanager.validatorBuy(marketId); 

    const creditline_balance = await collateral.balanceOf(creditline.address); 
    expect(creditline_balance).to.equal(instrumentdata.principal.div(pp__)); 
    // const validator_vault_balance_after_approve = await vault.connect(trader).balanceOf(owner.address); 
    const validator_balance = await bc.balanceOf(trader.address); 
    console.log('validatorbalance', validator_balance); 

    // console.log('after_approve', validator_vault_balance_after_approve.toString(),validator_balance.toString() ); 

    const upper_bound = await bc.getUpperBound(); 
    const lower_bound = await bc.getLowerBound(); 
    console.log('bounds', upper_bound.toString(), lower_bound.toString()); 
    });
})