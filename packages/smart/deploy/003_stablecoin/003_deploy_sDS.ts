import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // const { deployments, getNamedAccounts } = hre;
  // const { deployer, linkNode, protocol, owner } = await getNamedAccounts();

  // const ds = await deployments.get("DS");

  // const args= [
  //   "stakedDS",
  //   "sDS", 
  //   deployer, 
  //   owner, //TODO change to null address 
  //   ds.address
  // ];

  // await deployments.deploy("sDS", {
  //   contract: "sDS",
  //   from: deployer,
  //   args,
  //   log: true,
  // });
};

// func.tags = ["GroupedMarketFactory", "Grouped"];
// func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;
