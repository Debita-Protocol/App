import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/src/signers";

import {
  AMMFactory,
  AMMFactory__factory,
  BFactory,
  BFactory__factory,
  BPool,
  Cash,
  FeePot,
  Cash__factory,
  FeePot__factory,
  MasterChef,
  MasterChef__factory,
  TrustedMarketFactoryV3,
  BPool__factory,
  TrustedMarketFactoryV3__factory,
} from "../typechain";
import { BigNumber, Contract } from "ethers";
import { calcShareFactor } from "../src";

describe.skip("AMMFactory", () => {
  let AMMFactory: AMMFactory__factory;
  let BFactory: BFactory__factory;
  let BPool: BPool__factory;
  let Cash: Cash__factory;
  let FeePot: FeePot__factory;
  let MasterChef: MasterChef__factory;
  let TrustedMarketFactoryV3: TrustedMarketFactoryV3__factory;

  let signer: SignerWithAddress;
  let secondSigner: SignerWithAddress;
  const outcomeSymbols = ["NO CONTEST", "HH", "UT"];
  const outcomeNames = ["No Contest", "Hulk Hogan", "Undertaker"];

  const usdcBasis = BigNumber.from(10).pow(6);
  const stakerFee = 0;
  const swapFee = BigNumber.from(10).pow(15).mul(15); // 1.5%
  const settlementFee = BigNumber.from(10).pow(15).mul(5); // 0.5%
  const protocolFee = 0;

  const MAX_APPROVAL = BigNumber.from(2).pow(256).sub(1);
  const ZERO = BigNumber.from(0);
  const BONE = BigNumber.from(10).pow(18);

  let collateral: Cash;
  let rewardsToken: Cash;
  let shareFactor: BigNumber;
  let marketFactory: TrustedMarketFactoryV3;
  const marketId = BigNumber.from(1);
  let ammFactory: AMMFactory;
  let bFactory: BFactory;

  let bPool: Contract;

  before(async () => {
    AMMFactory = (await ethers.getContractFactory("AMMFactory")) as AMMFactory__factory;
    BFactory = (await ethers.getContractFactory("BFactory")) as BFactory__factory;
    BPool = (await ethers.getContractFactory("BPool")) as BPool__factory;
    Cash = (await ethers.getContractFactory("Cash")) as Cash__factory;
    FeePot = (await ethers.getContractFactory("FeePot")) as FeePot__factory;
    MasterChef = (await ethers.getContractFactory("MasterChef")) as MasterChef__factory;
    TrustedMarketFactoryV3 = (await ethers.getContractFactory(
      "TrustedMarketFactoryV3"
    )) as TrustedMarketFactoryV3__factory;
  });

  beforeEach(async () => {
    [signer, secondSigner] = await ethers.getSigners();

    collateral = await Cash.deploy("USDC", "USDC", 6); // 6 decimals to mimic USDC
    const reputationToken = await Cash.deploy("REPv2", "REPv2", 18);
    const feePot = await FeePot.deploy(collateral.address, reputationToken.address);
    shareFactor = calcShareFactor(await collateral.decimals());

    bFactory = await BFactory.deploy();

    ammFactory = await AMMFactory.deploy(bFactory.address, swapFee);

    marketFactory = await TrustedMarketFactoryV3.deploy(
      signer.address,
      collateral.address,
      shareFactor,
      feePot.address,
      [stakerFee, settlementFee, protocolFee],
      signer.address
    );

    const description = "Who will win Wrestlemania III?";
    const odds = calcWeights([2, 49, 49]);
    await marketFactory.createMarket(signer.address, description, outcomeNames, odds);

    const basis = BigNumber.from(10).pow(18);
    const weights = [basis.mul(2).div(2), basis.mul(49).div(2), basis.mul(49).div(2)];

    const initialLiquidity = usdcBasis.mul(1000); // 1000 of the collateral
    await collateral.faucet(initialLiquidity);
    await collateral.approve(ammFactory.address, initialLiquidity);
    await ammFactory.createPool(marketFactory.address, marketId, initialLiquidity, signer.address);

    const bPoolAddress = await ammFactory.getPool(marketFactory.address, marketId);
    bPool = BPool.attach(bPoolAddress).connect(signer);
    await bPool.approve(ammFactory.address, MAX_APPROVAL);
  });

  describe("addLiquidity", () => {
    const addLiquidity = async function (collateralAmount: number) {
      const collateralIn = usdcBasis.mul(collateralAmount);
      await collateral.faucet(collateralIn);
      await collateral.approve(ammFactory.address, collateralIn);

      await ammFactory.addLiquidity(marketFactory.address, marketId, collateralIn, ZERO, secondSigner.address);
    };
    const addTest = function (a: number, b: number, c: number) {
      it(`addLiquidity check: ${a}, ${b}, ${c}`, async () => {
        await addLiquidity(a);
        await addLiquidity(b);
        await addLiquidity(c);
      });
    };

    const randomValues = [1500, 5000, 100000, 500000, 750000];
    const numberOfValues = randomValues.length;
    for (let i = 0; i < Math.pow(randomValues.length, 3); i++) {
      const s = i.toString(numberOfValues).padStart(3, "0");

      const a = parseInt(s[2], numberOfValues);
      const b = parseInt(s[1], numberOfValues);
      const c = parseInt(s[0], numberOfValues);

      addTest(randomValues[a], randomValues[b], randomValues[c]);
    }
  });
});

function calcWeights(ratios: number[]): BigNumber[] {
  const basis = BigNumber.from(10).pow(18);
  const max = basis.mul(50);

  const total = ratios.reduce((total, x) => total + x, 0);
  const factor = max.div(total); // this doesn't work if total is too large
  return ratios.map((r) => factor.mul(r));
}
