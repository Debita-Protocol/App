import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use as chaiUse } from "chai";
import { deployments, ethers } from "hardhat";
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
    CreditLine__factory
} from "../typechain";

describe("* Full Cycle Test", () => {
    let ctrlr: Controller;
    let MM: MarketManager;
    let repToken: ReputationNFT;
    let collateral: Cash;
    let vault: Vault;
    let creditline: CreditLine;
    let MF: TrustedMarketFactoryV3;
  
    let CreditLine__factory: CreditLine__factory;

    let owner: SignerWithAddress; // validator
    let manager: SignerWithAddress;
    let trader: SignerWithAddress;
    const dec = 18;


    const description = "a description of the instrument";
    let principal = BigNumber.from(10).pow(dec).mul(10);
    let interestAPR = 0; // need to finish in vault instrument.
    let duration = BigNumber.from(30).mul(24).mul(60).mul(60); 
    let faceValue = BigNumber.from(10).pow(dec).mul(12);
    let totalInterest = faceValue.sub(principal);
    
    before(async () => {

        /**
         * owner => validator
         * manager => bond buyer/seller, interacts with market, gains reputation
         * trader => initializes instrument, borrows and repays vault instrument.
         */
        [owner, trader, manager] = await ethers.getSigners();

        ctrlr = await ethers.getContract("Controller");
        MM = await ethers.getContract("MarketManager");
        repToken = await ethers.getContract("ReputationNFT");
        collateral = await ethers.getContract("Collateral");
        vault = await ethers.getContract("Vault");
        MF = await ethers.getContract("TrustedMarketFactoryV3");

        CreditLine__factory = (await ethers.getContractFactory("CreditLine")) as CreditLine__factory; 
        creditline = await CreditLine__factory.deploy(vault.address, trader.address, principal, interestAPR, duration, faceValue) as CreditLine;
        
        await creditline.setUtilizer(owner.address);

        await ctrlr.setMarketManager(MM.address);
        await ctrlr.setVault(vault.address);
        await ctrlr.setMarketFactory(MF.address);
        await ctrlr.setReputationNFT(repToken.address);
        await ctrlr.addValidator(owner.address);
        await ctrlr.connect(manager).verifyAddress();
    });

    describe("# Rep Token Tests", () => {
        it("Add score tests", async () => {
            await repToken.mint(manager.address);
            expect(await repToken.getReputationScore(manager.address)).to.equal(BigNumber.from(0));
            let score = BigNumber.from(10).pow(18).mul(2)
            await repToken.addScore(manager.address, score)

            score = BigNumber.from(10).pow(18).mul(1)
            await repToken.addScore(manager.address, score)

            expect((await repToken.getReputationScore(manager.address)).score).to.equal(BigNumber.from(10).pow(18).mul(1.5));
            expect((await repToken.getReputationScore(manager.address)).n).to.equal(BigNumber.from(2));
            console.log("A")

            await repToken.resetScore(manager.address)

            console.log("B")
            
        });
    });

    describe("# Initiate instrument from controller", () => {
        it("controller: initiateMarket", async () => {
            await ctrlr.initiateMarket(
                trader.address,
                description,
                [BigNumber.from(10).pow(18).mul(1), BigNumber.from(10).pow(18).mul(2)],
                {
                    trusted: true, // shouldn't affect
                    balance: 0,
                    faceValue,
                    marketId: 3,
                    principal,
                    expectedYield: totalInterest,
                    duration,
                    description,
                    Instrument_address: creditline.address 
                }
            )
            console.log("a")
            let marketIds = await ctrlr.getIds(trader.address);
            expect(marketIds[0]).to.equal(BigNumber.from(1))
            expect(marketIds.length).to.equal(BigNumber.from(1))
            console.log("correctly set user_ids");

            let instrumentData = await vault.getInstrumentData(creditline.address);
            expect(instrumentData.trusted).to.equal(false)
            expect(instrumentData.balance).to.equal(0)
            expect(instrumentData.faceValue).to.equal(faceValue)
            expect(instrumentData.marketId).to.equal(BigNumber.from(1))
            expect(instrumentData.principal).to.equal(principal)
            expect(instrumentData.duration).to.equal(duration)
            expect(instrumentData.Instrument_address).to.equal(creditline.address)

            let marketData = await ctrlr.market_data(marketIds[0])

            expect(marketData.recipient).to.equal(trader.address)
            expect(marketData.instrument_address).to.equal(trader.address)

        });
    })

    describe("# Market Mechanics (market manager + instrument) tests", () => {
        describe("- assessment phase", () => {
            it("", async () => {

            })
        })
    })
});