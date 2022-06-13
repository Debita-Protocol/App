import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, linkNode, protocol, owner } = await getNamedAccounts();
  const collateral = await deployments.get("Collateral")

  
  const locker_args= [
    collateral.address
  ];


  await deployments.deploy("iDSLocker", {
    contract: "iDSLocker",
    from: deployer,
    args : locker_args,
    log: true,
  });

  const locker = await deployments.get("iDSLocker")

  const ids_args = [
    locker.address
  ]
  await deployments.deploy("iDS", {
    contract: "iDS",
    from: deployer,
    args:ids_args,
    log: true,
  });


};

// func.tags = ["GroupedMarketFactory", "Grouped"];
// func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;
