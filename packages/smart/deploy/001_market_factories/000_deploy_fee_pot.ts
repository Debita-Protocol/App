import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  if (!(await deployments.getOrNull("Collateral"))) {
    await deployments.deploy("Collateral", {
      contract: "Cash",
      from: deployer,
      args: ["USDC", "USDC", 6],
      log: true,
    });
  }

  if (!(await deployments.getOrNull("Reputation"))) {
    await deployments.deploy("Reputation", {
      // contract: "Cash",
      contract: "PlaceholderReputationToken",
      from: deployer,
      args: ["PlaceholderReputationToken", "PlaceholderReputationToken", 18],
      // args: ["REPv2", "REPv2", 18],
      log: true,
    });
  }

   if (!(await deployments.getOrNull("BFactory"))) {
    await deployments.deploy("BFactory", {
      from: deployer,
      args: [],
      log: true,
    });
  }


  const collateral = (await deployments.get("Collateral")).address;
  const reputationToken = (await deployments.get("Reputation")).address;
if (!(await deployments.getOrNull("FeePot"))){
  await deployments.deploy("FeePot", {
    from: deployer,
    args: [collateral, reputationToken],
    log: true,
  });}
};

func.tags = ["FeePot"];
func.dependencies = ["Tokens"];

export default func;
