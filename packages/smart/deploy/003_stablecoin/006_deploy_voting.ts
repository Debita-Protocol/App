import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // const { deployments, getNamedAccounts } = hre;
  // const { deployer, linkNode, protocol, owner } = await getNamedAccounts();

  // const dss = await deployments.get("DSS");

  // const args = [
  // dss.address
  // ];

  // await deployments.deploy("VoteTracker", {
  //   contract: "VoteTracker",
  //   from: deployer,
  //   args,
  //   log: true,
  // });
};

// func.tags = ["GroupedMarketFactory", "Grouped"];
// func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;
