import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
//import { GroupedMarketFactoryV3__factory } from "../../typechain";
//import { getCollateral, getFees } from "../../src/utils/deploy";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, linkNode, protocol, owner } = await getNamedAccounts();



  const ds = await deployments.get("DS")
  const sds = await deployments.get("sDS")
  const collateral = await deployments.get("Collateral")


  const args= [
      ds.address, 
      collateral.address,
      deployer, 
      sds.address

  ];

  await deployments.deploy("StakingPool", {
    contract: "StakingPool",
    from: deployer,
    args,
    log: true,
  });
};

// func.tags = ["GroupedMarketFactory", "Grouped"];
// func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;
