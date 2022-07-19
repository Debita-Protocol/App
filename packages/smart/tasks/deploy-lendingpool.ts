import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy:lendingpool", "Deploy LendingPool contract")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .addParam("dss")
    .addParam("ds")
    .addParam("collateral")
    .setAction(async ({ logs, dss, ds, collateral }, { ethers, getNamedAccounts }): Promise<Contract> => {

        const { deployer, owner } = await getNamedAccounts();
        const ContractFactory = await ethers.getContractFactory("LendingPool")

        const contract = await ContractFactory.deploy(
            ds,
            dss,
            collateral,
            deployer,
            owner
        )

        await contract.deployed()

        logs && console.log(`LendingPool contract has been deployed to: ${contract.address}`)

        return contract
    })