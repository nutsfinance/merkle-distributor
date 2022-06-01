const { calcEthereumTransactionParams } = require("@acala-network/eth-providers");
const { ethers } = require("hardhat");

const DISTRIBUTOR = '0x9c925B9675F717F1893a321c991f0f0433E6C5E0';
const NEW_ROOT = '0xbb7102ca88754b2fc44d6f357e3e528ae01053846aa387390282ad5adede453c';
const NEW_CYCLE = 1;
const NEW_START_BLOCK = 0;
const NEW_END_BLOCK = 1;

async function main() {
    const blockNumber = await ethers.provider.getBlockNumber();
    
    const ethParams = calcEthereumTransactionParams({
        gasLimit: '21000010',
        validUntil: (blockNumber + 100).toString(),
        storageLimit: '640010',
        txFeePerGas: '199999946752',
        storageByteDeposit: '100000000000000'
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