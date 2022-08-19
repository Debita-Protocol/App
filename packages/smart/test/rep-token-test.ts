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

describe("# Rep Token Tests", () => {
    let owner: SignerWithAddress; // validator
    let manager: SignerWithAddress;
    let trader: SignerWithAddress;
    let repToken: ReputationNFT;
    before(async () => {

        /**
         * owner => validator
         * manager => bond buyer/seller, interacts with market, gains reputation
         * trader => initializes instrument, borrows and repays vault instrument.
         */
    
        [owner, trader, manager] = await ethers.getSigners();

        repToken = await ethers.getContract("ReputationNFT");
    });

    it("Add score tests", async () => {
        await repToken.mint(manager.address);
        expect(await repToken.getReputationScore(manager.address)).to.equal(BigNumber.from(0));
        await repToken.resetScore(manager.address)
        
    });
});

    