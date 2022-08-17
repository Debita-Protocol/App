import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use as chaiUse } from "chai";
import { deployments, ethers } from "hardhat";
import { BigNumber } from "ethers";
import {
    LinearBondingCurve__factory,
    LinearBondingCurve,
    Cash,
    Cash__factory
} from "../typechain";

describe("Bond Curve Tests", () => {
    let owner: SignerWithAddress;
    let bond: LinearBondingCurve;
    let cash: Cash;
    let a = BigNumber.from(10).pow(18)
    let b = BigNumber.from(10).pow(18).mul(2)
    let col = BigNumber.from(10).pow(6)
    let bd = BigNumber.from(10).pow(18)
    before(async () => {
        [owner] = await ethers.getSigners();
        
        //let cash = await ethers.getContract("Collateral");
        let cashF = (await ethers.getContractFactory("Cash")) as any;
        
        cash = await cashF.deploy("cash","C", 6)
        
        let bondF: LinearBondingCurve__factory = await ethers.getContractFactory("LinearBondingCurve");
        
        bond = await bondF.deploy("Bond 0", "B0", owner.address, cash.address, a, b);
        
        let tx = await cash.connect(owner).faucet(col.mul(100000));
        await tx.wait()
        
        console.log(await cash.balanceOf(owner.address));
        tx = await bond.trustedApproveCollateralTransfer(owner.address, col.mul(100000))
        await tx.wait()
        tx = await cash.connect(owner).approve(bond.address, col.mul(100000))
        await tx.wait()
        console.log(await cash.decimals())
        console.log(await cash.allowance(owner.address, bond.address))
    });

    it("init", async () => {
        expect(await bond.getTotalCollateral()).to.equal(BigNumber.from(0));
        expect(await bond.getTotalZCB()).to.equal(BigNumber.from(0))
        expect(await bond.calculatePurchaseReturn(col.mul(16))).to.equal(bd.mul(4))
        expect(await bond.calculateExpectedPrice(bd.mul(3))).to.equal(bd.mul(5));
        let tx = await bond.setUpperBound(bd.mul(14))
        await tx.wait()
        expect(await bond.getUpperBound()).to.equal(bd.mul(14))
    })

    it("can't buy above price threshold", async () => {
        console.log(await bond.calculatePurchaseReturn(col.mul(142)))
        let tokens = await bond.calculatePurchaseReturn(col.mul(142))
        console.log(await bond.calculateExpectedPrice(tokens))
        console.log(await bond.getUpperBound())
        await expect(bond.connect(owner).buy(col.mul(142))).to.be.revertedWith("above price upper bound")
        //await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet")
        console.log(await bond.calculateExpectedPrice(tokens) > await bond.getUpperBound())
    })

    it("trustedBuy", async () => {
        expect(await bond.connect(owner).callStatic.trustedBuy(owner.address, col.mul(6))).to.equal(bd.mul(2));
        //await expect(bond.connect(owner).trustedBuy(owner.address, col.mul(143))).to.be.revertedWith("ERC20: insufficient allowance")
        
        let tx = await bond.connect(owner).trustedBuy(owner.address, col.mul(6))
        tx.wait()
        expect(await bond.balanceOf(owner.address)).to.equal(bd.mul(2));
        expect(await cash.balanceOf(bond.address)).to.equal(col.mul(6));
    })

    it("trustedSell", async () => {
        expect(await bond.getReserves()).to.equal(col.mul(6))
        expect(await bond.calculateSaleReturn(bd.mul(1))).to.equal(col.mul(35).div(10))
        expect(await bond.connect(owner).callStatic.trustedSell(owner.address, bd.mul(1))).to.equal(col.mul(35).div(10))
        await bond.connect(owner).trustedSell(owner.address, bd.mul(1))
        expect(await bond.balanceOf(owner.address)).to.equal(bd.mul(1))

        expect(await bond.getReserves()).to.equal(col.mul(25).div(10))

    })

    it("redeem")
});