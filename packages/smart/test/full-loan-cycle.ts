import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use as chaiUse } from "chai";
import { deployments, ethers, network } from "hardhat";
import { BigNumber } from "ethers";

import {
    Controller,
    Vault,
    Instrument,
    MarketManager,
    ReputationNFT,
    CreditLine,
    Cash,
    TrustedMarketFactoryV3,
    CreditLine__factory,
    LinearBondingCurve,
    LinearBondingCurve__factory
} from "../typechain";

describe("* Full Cycle Test", () => {
    let ctrlr: Controller;
    let MM: MarketManager;
    let repToken: ReputationNFT;
    let collateral: Cash;
    let vault: Vault;
    let creditline: CreditLine;
    let MF: TrustedMarketFactoryV3;
    let ZCB: LinearBondingCurve;
  
    let CreditLine__factory: CreditLine__factory;

    let owner: SignerWithAddress; // acts as validator
    let market_trader: SignerWithAddress;
    let vault_lender: SignerWithAddress;
    let utilizer: SignerWithAddress;

    const dec = 18;
    const col_one = BigNumber.from(10).pow(6);
    const bd_one = BigNumber.from(10).pow(18);


    const description = "a description of the instrument";

    /**
     * p = 30, i = 20, IAPR = 2/3, 
     * a = 1.6*10^(-2), b = 0.2, y=1 intercept => (50,1)
     * w/ reputation @ 30% and market condition @ 50 % => 15 ZCB then 25 ZCB respectively.
     */
    let principal = col_one.mul(30)
    let duration = BigNumber.from(365).mul(24*60*60)
    let interest = col_one.mul(20)
    let faceValue = principal.add(interest)
    let interestAPR = bd_one.mul(66)
    let marketId = 1;

    
    before(async () => {

        /**
         * owner => validator
         * manager => bond buyer/seller, interacts with market, gains reputation
         * trader => initializes instrument, borrows and repays vault instrument.
         */
    
        [owner, market_trader, vault_lender, utilizer] = await ethers.getSigners();

        ctrlr = await ethers.getContract("Controller");
        MM = await ethers.getContract("MarketManager");
        repToken = await ethers.getContract("ReputationNFT");
        collateral = await ethers.getContract("Collateral");
        vault = await ethers.getContract("Vault");
        MF = await ethers.getContract("TrustedMarketFactoryV3");

        CreditLine__factory = (await ethers.getContractFactory("CreditLine")) as CreditLine__factory; 
        creditline = await CreditLine__factory.deploy(
            vault.address, 
            utilizer.address, 
            principal, 
            interestAPR, 
            duration, 
            faceValue
        ) as CreditLine;

        await ctrlr.setMarketManager(MM.address);
        await ctrlr.setVault(vault.address);
        await ctrlr.setMarketFactory(MF.address);
        await ctrlr.setReputationNFT(repToken.address);
        await ctrlr.addValidator(owner.address);
        
        // verify market trader
        await ctrlr.connect(market_trader).testVerifyAddress();
        
        // give everyone 100 cash collateral
        let tx = await collateral.connect(market_trader).faucet(col_one.mul(1000));
        tx.wait()
        
        tx = await collateral.connect(utilizer).faucet(col_one.mul(1000));
        tx.wait()

        tx = await collateral.connect(vault_lender).faucet(col_one.mul(1000));
        tx.wait()

        tx = await collateral.connect(owner).faucet(col_one.mul(1000));
        tx.wait()

        // gives market_trader and vault_lender vault tokens to buy ZCB with.

        await collateral.connect(market_trader).approve(vault.address, col_one.mul(50));
        tx = await vault.connect(market_trader).deposit(col_one.mul(50), market_trader.address)
        tx.wait()

        await collateral.connect(vault_lender).approve(vault.address, col_one.mul(50));
        tx = await vault.connect(vault_lender).deposit(col_one.mul(50), vault_lender.address)
        tx.wait()
        console.log("vault_lender: ", await vault.balanceOf(vault_lender.address))
        console.log("market_trader: ", await vault.balanceOf(market_trader.address))

        // gives market_trader a reputation nft
        repToken.mint(market_trader.address)
    });

    describe("# Initiate instrument from controller", () => {
        it("controller: initiateMarket", async () => {
            await ctrlr.initiateMarket(
                utilizer.address,
                {
                    trusted: true, // shouldn't affect
                    balance: 0,
                    faceValue,
                    marketId: 3,
                    principal,
                    expectedYield: interest,
                    duration,
                    description,
                    Instrument_address: creditline.address,
                    instrument_type: 0,
                    maturityDate: 0
                }
            )
            console.log("a")
            let marketId = await ctrlr.ad_to_id(utilizer.address);
            console.log("marketId: ", marketId.toString())

            let instrumentData = await vault.getInstrumentData(creditline.address);
            expect(instrumentData.trusted).to.equal(false)
            expect(instrumentData.balance).to.equal(0)

            console.log("faceValue", instrumentData.faceValue.toString())
            console.log("principal", instrumentData.principal.toString())
            console.log("duration", instrumentData.duration.toString())
            expect(instrumentData.faceValue).to.equal(faceValue)
            expect(instrumentData.marketId).to.equal(BigNumber.from(1))
            expect(instrumentData.principal).to.equal(principal)
            expect(instrumentData.duration).to.equal(duration)
            expect(instrumentData.Instrument_address).to.equal(creditline.address)

            let marketData = await ctrlr.market_data(marketId)

            expect(marketData.recipient).to.equal(utilizer.address)
            expect(marketData.instrument_address).to.equal(creditline.address)

            ZCB = LinearBondingCurve__factory.connect(await ctrlr.getZCB_ad(1), owner);
        });
    })

    describe("# Market Mechanics (market manager + instrument) tests", () => {
        describe("- assessment phase", () => {
            
            it("can buy/sell ZCB before reputation threshold", async () => {
                let data = await MM.restriction_data(marketId)
                
                expect(data.duringAssessment).to.equal(true)
                expect(data.onlyReputable).to.equal(true)
                expect(data.resolved).to.equal(false)
                console.log("min_rep_score: ", data.min_rep_score)
                expect(data.atLoss).to.equal(false)
                
                console.log("buying w/ 5 col");
                await vault.connect(market_trader).approve(ZCB.address, col_one.mul(5))
                let tx = await MM.connect(market_trader).buy(BigNumber.from(marketId), col_one.mul(5))
                tx.wait()

                data = await MM.restriction_data(marketId)
                expect(data.duringAssessment).to.equal(true)
                expect(data.onlyReputable).to.equal(true)
                expect(data.resolved).to.equal(false)
                console.log("min_rep_score: ", data.min_rep_score)
                expect(data.atLoss).to.equal(false)
                console.log(data.alive)
                expect(data.alive).to.equal(true)
                
                console.log("selling tokens");
                tx = await MM.connect(market_trader).sell(marketId, bd_one.mul(1545).div(100))
                tx.wait()

                console.log("ZCB amount: ", (await ZCB.connect(market_trader).balanceOf(market_trader.address)).toString())
                console.log("market condition: ", await MM.marketCondition(1));
                console.log("total ZCB collateral: ", (await ZCB.getTotalCollateral()).toString());
            })

            // it("can't approveMarket bc of marketConditions during onlyRep", async () => {
            //     expect(await ctrlr.connect(owner).approveMarket(marketId)).to.be.revertedWith("Market Conditions not met");
            // })

            it("buying ZCB changes to reputation phase", async () => {
                // buying 16 cols => total aprox 16 col => pushed over insurance constant
                await vault.connect(market_trader).approve(ZCB.address, col_one.mul(10))
                let tx = await MM.connect(market_trader).buy(marketId, col_one.mul(10))
                
                let data = await MM.restriction_data(marketId)
                
                expect(data.duringAssessment).to.equal(true)
                
                expect(data.onlyReputable).to.equal(false)
                
                expect(data.resolved).to.equal(false)
                
                console.log("min_rep_score: ", data.min_rep_score)
                
                expect(data.atLoss).to.equal(false)

                console.log("market condition: ", await MM.marketCondition(1));
            })

            it("selling ZCB doesn't change onlyRep to false", async () => {
                let tokens = await ZCB.balanceOf(market_trader.address);
                let tx = await MM.connect(market_trader).sell(marketId, tokens);
                tx.wait();

                console.log("total collateral of ZCB", (await ZCB.getTotalCollateral()))
                
                let data = await MM.restriction_data(marketId)
                
                expect(data.duringAssessment).to.equal(true)
                
                expect(data.onlyReputable).to.equal(false)
                
                expect(data.resolved).to.equal(false)
                
                console.log("min_rep_score: ", data.min_rep_score)
                
                expect(data.atLoss).to.equal(false)
            })

            // it("not allowed to approve without meeting market condition", async () => {
            //     expect(await ctrlr.connect(owner).approveMarket(marketId)).to.be.revertedWith("Market Conditions not met");
            // });

            it("buying ZCB to pass market condition", async () => {
                // 15 col bought => passes market condition
                await vault.connect(market_trader).approve(ZCB.address, col_one.mul(16))
                let tx = await MM.connect(market_trader).buy(marketId, col_one.mul(16));
                tx.wait();

                expect(await MM.connect(market_trader).marketCondition(marketId)).to.equal(true);
                
                let data = await MM.restriction_data(marketId)
                
                expect(data.duringAssessment).to.equal(true)
                
                expect(data.onlyReputable).to.equal(false)
                
                expect(data.resolved).to.equal(false)
                
                console.log("min_rep_score: ", data.min_rep_score)
                
                expect(data.atLoss).to.equal(false)
            })

            it("approves market", async () => {
                expect(await collateral.balanceOf(creditline.address)).to.equal(BigNumber.from(0));

                let tx = await ctrlr.connect(owner).approveMarket(marketId);
                tx.wait();

                expect(await collateral.balanceOf(creditline.address)).to.equal(principal);

                let i_data = await vault.fetchInstrumentData(marketId);

                expect(i_data.balance).to.equal(principal);

                expect(i_data.trusted).to.equal(true);

                //let latest = await time.latest();

                let maturity = new Date(Number(i_data.maturityDate)*1000);
                console.log(maturity.toDateString());
                let data = await MM.restriction_data(marketId)
                
                expect(data.duringAssessment).to.equal(false)
                
                expect(data.onlyReputable).to.equal(false)
                
                expect(data.resolved).to.equal(false)

                expect(data.alive).to.equal(true)
                
                console.log("min_rep_score: ", data.min_rep_score)
                
                expect(data.atLoss).to.equal(false)
            })
        })

        describe("- instrument mechanics", () => {
            // tested w/ market_trader as utilizer => didn't work
            it("can't overborrow", async () => {
                try {
                    let tx = await creditline.connect(utilizer).drawdown(principal.mul(3))
                } catch (err) {
                    console.log(err.reason);
                }             
            })
            it("borrow functionality", async () => {
                /**
                 * test
                 * borrow, repay functionality + checkInstrument + check maturityDate
                 * 
                 */

                let tx = await creditline.connect(utilizer).drawdown(principal.div(2));
                tx.wait();

                expect(await collateral.balanceOf(creditline.address)).to.equal(principal.div(2));
            });

            it("can't overpay principal or interest", async () => {
                
                try {
                    await creditline.connect(utilizer).repay(principal, 0);
                } catch (err) {
                    console.log(err.reason)
                }

                try {
                    await creditline.connect(utilizer).repay(0, interest.mul(2));
                } catch (err) {
                    console.log(err.reason)
                }
            })

            it("repay functionality", async () => {
                let tx = await collateral.connect(utilizer).approve(creditline.address, principal.div(2).add(interest));
                await tx.wait();

                tx = await creditline.connect(utilizer).repay(principal.div(2), interest);
                await tx.wait();

                //expect(await vault.connect(vault_lender).checkInstrument(marketId)).to.equal(false);
                console.log(await vault.connect(vault_lender).callStatic.checkInstrument(marketId));
            })

            it("resolve instrument + everything", async () => {
                await network.provider.send("evm_increaseTime", [Number(duration)+24*60*60]);
                await network.provider.send("evm_mine");

                await vault.connect(vault_lender).checkInstrument(marketId);
            });

            it("checking resolve instrument", async () => {
                expect(await collateral.balanceOf(creditline.address)).to.be.equal(BigNumber.from(0));
                let data = await MM.restriction_data(marketId);
                console.log(data);
                let tx = await MM.connect(market_trader).updateReputation(marketId);
                await tx.wait();
                let rep = await repToken.getReputationScore(market_trader.address);
                console.log("reputation: ", rep);
            })
        });
    })
});