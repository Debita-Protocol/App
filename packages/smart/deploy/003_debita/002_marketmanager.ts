import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, interep } = await getNamedAccounts();
  const controller_addr = (await deployments.get("Controller")).address;
  const rep_addr = (await deployments.get("ReputationNFT")).address;
  const args = [deployer,rep_addr,  controller_addr];

  await deployments.deploy("MarketManager", {
    from: deployer,
    args,
    log: true,
  });
};
  
func.tags = ["marketManager"];
  
export default func;