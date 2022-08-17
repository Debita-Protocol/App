import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GroupedMarketFactoryV3__factory } from "../../typechain";
import { getCollateral, getFees } from "../../src/utils/deploy";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // const { deployments, getNamedAccounts, ethers } = hre;
  // const { deployer, linkNode, protocol, timelock, interep } = await getNamedAccounts();

  // const { collateralAddress, shareFactor } = await getCollateral(deployments);
  // const ds = await deployments.get("DS");
  // const masterchef = await deployments.get('MasterChef')
  // const lendingpool = await deployments.get('LendingPool')

  // const { address: feePotAddress } = await deployments.get("FeePot");
  // const fees = getFees();

  // const masterchefargs = [
  //     ds.address
  // ]
  // const ammargs = [
  // ]
  // if (!(await deployments.getOrNull("MasterChef"))) {
  //   await deployments.deploy("MasterChef", {
  //     // contract: "Cash",
  //     contract: "MasterChef",
  //     from: deployer,
  //     args: masterchefargs,
  //     log: true,
  //   });
  // }

  // const args = [
  //   deployer,
  //   interep
  // ];


  //   const controller = await deployments.deploy("Controller", {
  //   contract: "Controller",
  //   from: deployer,
  //   args,
  //   log: true,
  //   });

};

func.tags = ["TrustedMarketFactory", "Trusted"];
func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;


//deploy masterchef, amm, 
