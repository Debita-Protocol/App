import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, timelock } = await getNamedAccounts();
  console.log('deployer', deployer)
  const args= [
    deployer, 
    timelock, //TODO change to null address 
  ];

  await deployments.deploy("DS", {
    contract: "DS",
    from: deployer,
    args,
    log: true,
  });
};

// func.tags = ["GroupedMarketFactory", "Grouped"];
// func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;
