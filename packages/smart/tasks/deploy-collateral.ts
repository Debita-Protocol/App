import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy:collateral", "Deploy Collateral token")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ logs  }, { ethers }): Promise<Contract> => {

        const ContractFactory = await ethers.getContractFactory("Cash")

        const contract = await ContractFactory.deploy(
            "USDC",
            "USDC",
            18
        )

        await contract.deployed()

        logs && console.log(`Cash contract has been deployed to: ${contract.address}`)

        return contract
    })