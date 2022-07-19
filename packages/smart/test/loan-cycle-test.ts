// import { expect } from "chai"
// import { utils } from "ethers"
// import { run, ethers, network } from "hardhat"
// import { createGroupId, createTree } from "./utils"
// import createIdentity from "@interep/identity";
// import { Semaphore, SemaphoreFullProof, SemaphoreSolidityProof } from "@zk-kit/protocols"
// import { BigNumber } from "ethers";
// import {
//     DS,
//     DSS,
//     Cash,
//     LendingPool,
//     Controller,
//     Interep,
//     MasterChef
// } from "../typechain";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/src/signers";

// function sign(address: string, data: string) {
//     return network.provider.send(
//       "eth_sign",
//       [address, ethers.utils.hexlify(ethers.utils.toUtf8Bytes('foo'))]
//     )
//   }




// describe.only("Full Loan Cycle Test", () => {
//     let ds : DS;
//     let dss : DSS;
//     let collateral : Cash;
//     let lpool : LendingPool;
//     let controller : Controller;
//     let interep : Interep;
//     let chef : MasterChef;

//     let creator : SignerWithAddress, validator : SignerWithAddress, borrower : SignerWithAddress;

//     const provider = utils.formatBytes32String("twitter");
//     const name = utils.formatBytes32String("unrated");
//     const tree = createTree(20);

//     const wasmFilePath = "./static/semaphore.wasm";
//     const finalZkeyPath = "./static/semaphore_final.zkey";
    
//     before(async () => {
//         [ creator, validator, borrower ] = await ethers.getSigners();
        
//         ds = await run("deploy:ds", { logs: true });
        
//         dss = await run("deploy:dss", { logs: true });
        
//         collateral = await run("deploy:collateral", { logs: true });
        
//         lpool = await run("deploy:lendingpool", { logs : true, ds : ds.address, dss : dss.address, collateral : collateral.address });
        
//         chef = await run("deploy:masterchef", { logs : true, rewardToken : collateral.address });
        
//         const { address: verifierAddress } = await run("deploy:verifier", { logs: true })

//         interep = await run("deploy:interep", {
//             logs: true,
//             verifiers: [{ merkleTreeDepth: 20, contractAddress: verifierAddress }]
//         })
        
//         controller = await run("deploy:controller", { logs : true , masterChef : chef.address , ds : ds.address, interep : interep.address, lendingPool : lpool.address });
//     })

//     describe("# User verification", () => {

//         it("user verification", async() => {
//             const tree = createTree(20)
//             const identity = await createIdentity((message) => sign(borrower.address, message), "Twitter")
            
//             const identityCommitment = identity.genIdentityCommitment().toString()
            
//             tree.insert(identityCommitment)

//             const root = tree.root

//             const groups: { provider: string; name: string; root: number; depth: number }[] = []

//             groups.push({
//                 provider,
//                 name,
//                 root,
//                 depth: 20
//             });

//             await interep.updateGroups(groups);

//             const signal = "twitter-unrated";
//             const bytes32Signal = utils.formatBytes32String(signal)
//             const merkleProof = tree.createProof(0)
//             const witness = Semaphore.genWitness(
//                 identity.getTrapdoor(),
//                 identity.getNullifier(),
//                 merkleProof,
//                 merkleProof.root,
//                 signal
//             )

//             let fullProof: SemaphoreFullProof;
//             let solidityProof: SemaphoreSolidityProof;
//             fullProof = await Semaphore.genProof(witness, wasmFilePath, finalZkeyPath);
//             solidityProof = Semaphore.packToSolidityProof(fullProof.proof);

//             const tx = await controller.connect(borrower).verifyAddress(
//                 BigNumber.from(fullProof.publicSignals.nullifierHash),
//                 BigNumber.from(fullProof.publicSignals.externalNullifier),
//                 solidityProof
//             );
//             await tx.wait();
            
//             expect(await controller.verified(borrower.address)).to.equal(true);
//         })
//     });
// })