import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";



const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    const interep = "0xb1dA5d9AC4B125F521DeF573532e9DBb6395B925";
    const args = [deployer, interep];

    

    await deployments.deploy("Controller", {
      from: deployer,
      args,
      log: true,
    });
  };
  
  func.tags = ["Controller"];
  
  export default func;