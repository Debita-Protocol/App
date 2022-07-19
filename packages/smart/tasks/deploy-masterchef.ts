import { Contract } from "ethers";
import { task, types } from "hardhat/config";

task("deploy:masterchef", "Deploy MasterChef")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .addParam("rewardToken", "token address of reward token")
    .setAction(async ({ logs, rewardToken }, { ethers }): Promise<Contract> => {

        const ContractFactory = await ethers.getContractFactory("MasterChef")

        const contract = await ContractFactory.deploy(
            rewardToken
        )

        await contract.deployed()

        logs && console.log(`MasterChef has been deployed to: ${contract.address}`)

        return contract
    });