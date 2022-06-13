import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GroupedMarketFactoryV3__factory } from "../../typechain";
import { getCollateral, getFees } from "../../src/utils/deploy";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, linkNode, protocol, owner } = await getNamedAccounts();

  const { collateralAddress, shareFactor } = await getCollateral(deployments);
  const { address: feePotAddress } = await deployments.get("FeePot");
  const fees = getFees();

  const args: Parameters<GroupedMarketFactoryV3__factory["deploy"]> = [
    owner,
    collateralAddress,
    shareFactor,
    feePotAddress,
    fees,
    protocol,
    linkNode,
  ];

  await deployments.deploy("GroupedMarketFactoryV3", {
    contract: "GroupedMarketFactoryV3",
    from: deployer,
    args,
    log: true,
  });
};

func.tags = ["GroupedMarketFactory", "Grouped"];
func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;
