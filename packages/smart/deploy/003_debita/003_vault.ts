import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const cash_addr = (await deployments.get("Collateral")).address;
  const controller_addr = (await deployments.get("Controller")).address;
  const args = [cash_addr,controller_addr];

  await deployments.deploy("Vault", {
    from: deployer,
    args,
    log: true,
  });

  const vault_addr = (await deployments.get("Vault")).address;
  const cr_args = [vault_addr, deployer, 1000000, 100000, 1000000, 1100000]
  await deployments.deploy("CreditLine", {
    from: deployer,
    args: cr_args,
    log: true,
  });

};
        
func.tags = ["Vault"];
  
export default func;