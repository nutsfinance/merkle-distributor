import { calcEthereumTransactionParams } from "@acala-network/eth-providers";
import { ethers } from "hardhat";

// const DISTRIBUTOR = '0xff066331be693BE721994CF19905b2DC7475C5c9'; //3usd
// const DISTRIBUTOR = '0xf595F4a81B27E5CC1Daca349A69c834f375224F4'; //taiKSM
const DISTRIBUTOR = '0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9'; //tdot
const NEW_ROOT = '0x04ffe27f54ba0524bd423d1cf36aab57cb051d47433934218241a05f3d577964';
const NEW_CYCLE = 8;
const NEW_START_BLOCK = 1548800;
const NEW_END_BLOCK = 1596700;

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