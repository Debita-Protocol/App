import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GroupedMarketFactoryV3__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

 
    await deployments.deploy("IndexCDS", {
    contract: "IndexCDS",
    from: deployer,
    args: [], 
    log: true,
  });

};

// func.tags = ["TrustedMarketFactory", "Trusted"];
// func.dependencies = ["Tokens", "FeePot", "BFactory"];

func.tags = ["icds"];
func.dependencies = [""];

export default func;


//deploy masterchef, amm, 
