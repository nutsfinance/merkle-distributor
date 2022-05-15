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
    const distributor = MerkleDistributor.attach('0xBcFBD51aB3cEB6047100265a20486F694BCD3604');
    console.log(await distributor.evmAccount());
    console.log(await distributor.currentCycle());

    const tx1 = await distributor.proposeRoot('0xe7ffac5f2dc91f65688f90da09a6d2d60394c5902e982ed51ce461edc18f6983', ethers.utils.formatBytes32String(''), 2, 0, 1, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx1.wait();

    console.log('Current cycle: ' + await distributor.currentCycle());
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