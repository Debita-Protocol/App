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

describe("*Full Cycle Test", () => {
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

    let principal = 10000000;
    let interestAPR = 100000;
    let duration = 100; 
    let faceValue = 12000000; 
    
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

    describe("#Rep Token Tests", () => {
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

    describe("#initiate instrument from controller", () => {
        it("controller: initiateMarket", async () => {
            ctrlr.initiateMarket(
                trader.address,
                "a description of the instrument",
                [BigNumber.from(10).pow(18).mul(1), BigNumber.from(10).pow(18).mul(2)],
                {
                    trusted: true,
                    balance: 0,
                    faceValue,
                    marketId: 3,
                    principal,
                    expectedYield,
                    duration,
                    description,
                    Credit 
                }
            )
        });
    })
});