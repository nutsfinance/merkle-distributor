import { calcEthereumTransactionParams } from "@acala-network/eth-providers";
import { ethers } from "hardhat";

//const DISTRIBUTOR = '0xff066331be693BE721994CF19905b2DC7475C5c9'; //3usd
 //const DISTRIBUTOR = '0xf595F4a81B27E5CC1Daca349A69c834f375224F4'; //taiKSM
const DISTRIBUTOR = '0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9'; //tdot
//const DISTRIBUTOR = '0xc907CE08ac3f1AaD3AB0Adce5A20c907334C09B3'; // lksm
// const DISTRIBUTOR = '0x73D6df4395CD54DF2E07fD3880c1B47Aeb2Aed97'; // ldot
const NEW_ROOT = '0x1fd3f56813e201af91d175a17e47916e1afab871abb50505e2280d6a93352d0e';
const NEW_CYCLE = 28;
const NEW_START_BLOCK = 2942600;
const NEW_END_BLOCK = 2993600;

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
    console.log(deployer);

    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    const distributor = MerkleDistributor.attach(DISTRIBUTOR);
    console.log('Cycle before: ' + await distributor.currentCycle());

    const tx1 = await distributor.approveRoot(NEW_ROOT, ethers.utils.formatBytes32String(''), NEW_CYCLE, NEW_START_BLOCK, NEW_END_BLOCK, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx1.wait();

    console.log('Cycle after: ' + await distributor.currentCycle());
    console.log('Merkle root: ' + await distributor.merkleRoot());
    console.log('Merkle content hash: ' + await distributor.merkleContentHash());
    console.log('Last publish start block: ' + await distributor.lastPublishStartBlock());
    console.log('Last publish end block: ' + await distributor.lastPublishEndBlock());
    console.log('Last publish timestamp: ' + await distributor.lastPublishTimestamp());
    console.log('Last publish block number: ' + await distributor.lastPublishBlockNumber());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });