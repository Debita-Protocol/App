import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // const { deployments, getNamedAccounts } = hre;
  // const { deployer } = await getNamedAccounts();
  // const repNFT = await deployments.get("ReputationNFT");
  // // const bondingcurve = await deployments.get("BondingCurve");
  // const controller = await deployments.get("Controller")

  // const args = [
  // deployer, 
  // repNFT.address, 
  // controller.address
  // ]
  
  // await deployments.deploy("MarketManager", {
  //   from: deployer,
  //   args: args,
  //   log: true,
  // });
 
  // const marketManager = await etj.get("MarketManager")
  // await bondingcurve.addManager(marketManager.address)

};

func.tags = ["BondingCurve"];
func.dependencies = [""];

export default func;
