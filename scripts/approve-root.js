const { calcEthereumTransactionParams } = require("@acala-network/eth-providers");
const { ethers } = require("hardhat");

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
    const distributor = MerkleDistributor.attach('0xF7A5B5792672D06d8FD2B5A6dAcE0C19d578BaCF');
    console.log(await distributor.currentCycle());

    const tx1 = await distributor.approveRoot('0x8e0cd0eace3224a83684f5289f8a6683287177c9ff60138692352738c6bd8703', ethers.utils.formatBytes32String(''), 1, 0, 1, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx1.wait();

    console.log('Current cycle: ' + await distributor.currentCycle());
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