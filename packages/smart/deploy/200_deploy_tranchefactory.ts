import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

   await deployments.deploy("TrancheAMMFactory", {
  	contract: "TrancheAMMFactory",
    from: deployer,
    args: [],
    log: true,
  });


   const trancheAMMFactory = await deployments.get("TrancheAMMFactory"); 

  await deployments.deploy("TrancheFactory", {
  	contract: "TrancheFactory",
    from: deployer,
    args: [deployer, trancheAMMFactory.address],
    log: true,
  });

  const trancheFactory = await deployments.get("TrancheFactory");

  await deployments.deploy("TrancheMaster", {
  	contract: "TrancheMaster",
    from: deployer,
    args: [trancheFactory.address],
    log: true,
  });

};

func.tags = ["tranche"];
func.dependencies = [];

export default func;
