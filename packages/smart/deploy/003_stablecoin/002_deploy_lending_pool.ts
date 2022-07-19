import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
//import { GroupedMarketFactoryV3__factory } from "../../typechain";
//import { getCollateral, getFees } from "../../src/utils/deploy";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, linkNode, protocol, owner } = await getNamedAccounts();




  // if (!(await deployments.getOrNull("Collateral"))) {
  //   await deployments.deploy("Collateral", {
  //     contract: "Cash",
  //     from: deployer,
  //     args: ["USDC", "USDC", 6],
  //     log: true,
  //   });
  // }
  
  const ds = await deployments.get("DS");
  const dss = await deployments.get("DSS"); 
  const collateral = await deployments.get("Collateral")
console.log('collateral address', collateral.address)

  const args= [
      ds.address, 
      dss.address, 
      //collateral.address, 
      "0x5799bFe361BEea69f808328FF4884DF92f1f66f0",//collateral.address, 
      deployer, 
      owner, //TODO
  ];

  await deployments.deploy("LendingPool", {
    contract: "LendingPool",
    from: deployer,
    args,
    log: true,
  });
};

func.tags = ["lendingPool"];
// func.tags = ["GroupedMarketFactory", "Grouped"];
// func.dependencies = ["Tokens", "FeePot", "BFactory"];

export default func;
