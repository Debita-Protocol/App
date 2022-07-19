import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:controller", "Deploy Controller")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .addParam("masterChef")
    .addParam("ds")
    .addParam("interep")
    .addParam("lendingPool")
    .setAction(async ({ logs, masterChef, ds, interep, lendingPool }, { ethers, getNamedAccounts }): Promise<Contract> => {
        const { deployer, owner } = await getNamedAccounts();

        const ContractFactory = await ethers.getContractFactory("Controller")
        console.log(masterChef)
        const contract = await ContractFactory.deploy(
            deployer,
            owner,
            masterChef,
            lendingPool,
            ds,
            interep
        )

        await contract.deployed()

        logs && console.log(`Controller has been deployed to: ${contract.address}`)

        return contract
    });