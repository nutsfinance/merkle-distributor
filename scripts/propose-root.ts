import { calcEthereumTransactionParams } from "@acala-network/eth-providers";
import { ethers } from "hardhat";

//const DISTRIBUTOR = '0xff066331be693BE721994CF19905b2DC7475C5c9'; //3usd
// const DISTRIBUTOR = '0xf595F4a81B27E5CC1Daca349A69c834f375224F4'; //taiKSM
// const DISTRIBUTOR = '0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9'; //tdot
const DISTRIBUTOR = '0xc907CE08ac3f1AaD3AB0Adce5A20c907334C09B3'; // lksm
// const DISTRIBUTOR = '0x73D6df4395CD54DF2E07fD3880c1B47Aeb2Aed97'; // ldot
const NEW_ROOT = '0x0000000000000000000000000000000000000000000000000000000000000000';
const NEW_CYCLE = 1;
const NEW_START_BLOCK = 0;
const NEW_END_BLOCK = 2454000;

async function main() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const ethParams = calcEthereumTransactionParams({
        gasLimit: '800000',
        validUntil: (blockNumber + 100).toString(),
        storageLimit: '600',
        txFeePerGas: '199999946752',
        storageByteDeposit: '300000000000000'
    });
    const [deployer] = await ethers.getSigners();

    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    const distributor = MerkleDistributor.attach(DISTRIBUTOR);
    console.log('Cycle before: ' + await distributor.currentCycle());

    // const roleAddress = '0x99537d82F6F4AAD1419dD14952B512c7959A2904';
    // const role1 = await distributor.ROOT_PROPOSER_ROLE();
    // console.log('Proposal role: ' + role1)
    // console.log('Has role: ' + await distributor.hasRole(role1, roleAddress));
    // const tx1 = await distributor.grantRole(role1, roleAddress);
    // await tx1.wait();
    // console.log('Has role: ' + await distributor.hasRole(role1, roleAddress));

    // const role2 = await distributor.ROOT_VALIDATOR_ROLE();
    // console.log('Proposal role: ' + role2)
    // console.log('Has role: ' + await distributor.hasRole(role2, roleAddress));
    // const tx2 = await distributor.grantRole(role2, roleAddress);
    // await tx2.wait();
    // console.log('Has role: ' + await distributor.hasRole(role2, roleAddress));

    const tx3 = await distributor.proposeRoot(NEW_ROOT, ethers.utils.formatBytes32String(''), NEW_CYCLE, NEW_START_BLOCK, NEW_END_BLOCK, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx3.wait();

    console.log('Cycle after: ' + await distributor.currentCycle());
    console.log('Pending cycle: ' + await distributor.pendingCycle());
    console.log('Pending Merkle root: ' + await distributor.pendingMerkleRoot());
    console.log('Pending Merkle content hash: ' + await distributor.pendingMerkleContentHash());
    console.log('Last proposed start block: ' + await distributor.lastProposeStartBlock());
    console.log('Last proposed end block: ' + await distributor.lastProposeEndBlock());
    console.log('Last proposed timestamp: ' + await distributor.lastProposeTimestamp());
    console.log('Last proposed block number: ' + await distributor.lastProposeBlockNumber());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });
