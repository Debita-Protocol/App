import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GroupedMarketFactoryV3__factory } from "../../typechain";
import { getCollateral, getFees } from "../../src/utils/deploy";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // const { deployments, getNamedAccounts } = hre;
  // const { deployer, protocol, timelock } = await getNamedAccounts();

  // const { collateralAddress, shareFactor } = await getCollateral(deployments);
  // const ds = await deployments.get("DS");


  // const { address: feePotAddress } = await deployments.get("FeePot");
  // const fees = getFees();

  // const args = [
  //   deployer,
  //   collateralAddress, //ds.address, 
  //   shareFactor,
  //   feePotAddress,
  //   fees,
  //   protocol,
  // ];

  // await deployments.deploy("TrustedMarketFactoryV3", {
  //   contract: "TrustedMarketFactoryV3",
  //   from: deployer,
  //   args,
  //   log: true,
  // });

};

func.tags = ["TrustedMarketFactory", "Trusted"];
func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;