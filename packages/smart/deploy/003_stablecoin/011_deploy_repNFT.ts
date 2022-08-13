import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const controller = await deployments.get("Controller"); 

  await deployments.deploy("ReputationNFT", {
      contract: "ReputationNFT",
      from: deployer,
      args: [controller.address],
      log: true,
  });
  

};

func.tags = ["Rep"];
func.dependencies = [""];

export default func;
