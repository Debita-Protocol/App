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
  const collateral = await deployments.get("Collateral");
  console.log(collateral.address);


  const args= [
      ds.address, 
      dss.address, 
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      deployer, 
      owner
  ];
  

  await deployments.deploy("LendingPool", {
    contract: "LendingPool",
    from: deployer,
    args,
    log: true,
  });
};

func.tags = ["lendingPool"];

export default func;
