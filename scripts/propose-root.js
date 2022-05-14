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

    const tx1 = await distributor.proposeRoot('0xe76676531bddae03a6ffcedf106913811ff168e57ad2cb1272fcedd00fc49290', ethers.utils.formatBytes32String(''), 1, 0, 1, {
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