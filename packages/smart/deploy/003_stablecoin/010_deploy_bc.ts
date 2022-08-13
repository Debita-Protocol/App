import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // const { deployments, getNamedAccounts } = hre;
  // const { deployer } = await getNamedAccounts();

  // if (!(await deployments.getOrNull("Collateral"))) {
  //   await deployments.deploy("Collateral", {
  //     contract: "Cash",
  //     from: deployer,
  //     args: ["USDC", "USDC", 6],
  //     log: true,
  //   });
  // }


  // if (!(await deployments.getOrNull("AnalyticMath"))) {
  //   await deployments.deploy("AnalyticMath", {
  //     contract: "AnalyticMath",
  //     from: deployer,
  //     args: [],
  //     log: true,
  //   });
  // }

  // const collateral = (await deployments.get("Collateral")).address;
  // const math = (await deployments.get("AnalyticMath")).address;

    
  // await deployments.deploy("LinearBondingCurve", {
  //   from: deployer,
  //   args: ["bc", "bc", deployer, collateral, ],
  //   log: true,
  // });

   
};

func.tags = ["BondingCurve"];
func.dependencies = [""];

export default func;
