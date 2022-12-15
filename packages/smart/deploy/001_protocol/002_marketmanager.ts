import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, interep } = await getNamedAccounts();
  const controller_addr = (await deployments.get("Controller")).address;
  const rep_addr = (await deployments.get("ReputationNFT")).address;
  const args = [
    deployer, 
    // rep_addr,  
    controller_addr,
    // chainlink constructor args
    "0x7a1bac17ccc5b313516c5e16fb24f7659aa5ebed",
    "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    "1713"
  ];

  await deployments.deploy("MarketManager", {
    from: deployer,
    args,
    log: true,
  });
};
  
func.tags = ["marketManager"];
  
export default func;