import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";



const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deployer, interep } = await getNamedAccounts();
    const args = [deployer, interep];

    

    await deployments.deploy("Controller", {
      from: deployer,
      args,
      log: true,
    });
  };
  
  func.tags = ["Controller"];
  
  export default func;