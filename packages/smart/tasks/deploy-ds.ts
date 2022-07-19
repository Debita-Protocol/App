import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy:ds", "Deploy DS token")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ logs  }, { ethers, getNamedAccounts }): Promise<Contract> => {

        const { deployer, owner } = await getNamedAccounts();
        const ContractFactory = await ethers.getContractFactory("DS")

        const contract = await ContractFactory.deploy(
            deployer,
            owner
        )

        await contract.deployed()

        logs && console.log(`DS contract has been deployed to: ${contract.address}`)

        return contract
    })