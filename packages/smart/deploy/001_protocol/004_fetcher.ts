import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deployments.deploy("Fetcher", {
    from: deployer,
    args: ["new", "1.0"],
    log: true, 
  });

};
        
func.tags = ["Fetcher"];
  
export default func;