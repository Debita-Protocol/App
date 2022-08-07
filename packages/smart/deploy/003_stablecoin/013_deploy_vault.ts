import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  // const repNFT = await deployments.get("ReputationNFT");
  // const bondingcurve = await deployments.get("BondingCurve");
  // const controller = await deployments.get("Controller")

  // const args = [
  // deployer, 
  // repNFT.address, 
  // bondingcurve.address, 
  // controller.address
  // ]

  if (!(await deployments.getOrNull("Collateral"))) {
    await deployments.deploy("Collateral", {
      contract: "Cash",
      from: deployer,
      args: ["USDC", "USDC", 6],
      log: true,
    });
  }

  const collateral = await deployments.get("Collateral"); 

  await deployments.deploy("Vault", {
    from: deployer,
    args: [collateral.address],
    log: true,
  });

 //  const vault = await deployments.get("Vault");
 // await deployments.deploy("Vault", {
 //    from: deployer,
 //    args: [vault.address, ],
 //    log: true,
 //  });

 //  address vault,
 //        address borrower, 
 //        uint256 principal,
 //        uint256 interestAPR, 
 //        uint256 duration ,
 //        uint256 faceValue
  // const marketManager = await etj.get("MarketManager")
  // await bondingcurve.addManager(marketManager.address)

};

func.tags = ["Vault"];
func.dependencies = [""];

export default func;
