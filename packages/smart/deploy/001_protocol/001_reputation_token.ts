import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const controller_addr = (await deployments.get("Controller")).address;
  const args = [controller_addr];

  await deployments.deploy("ReputationNFT", {
    from: deployer,
    args,
    log: true,
  });
};
  
func.tags = ["reputation nft"];
  
export default func;