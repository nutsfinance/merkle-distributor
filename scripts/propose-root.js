const { calcEthereumTransactionParams } = require("@acala-network/eth-providers");
const { ethers } = require("hardhat");

//const DISTRIBUTOR = '0xff066331be693BE721994CF19905b2DC7475C5c9'; //3usd
const DISTRIBUTOR = '0xf595F4a81B27E5CC1Daca349A69c834f375224F4'; //taiKSM
//const DISTRIBUTOR = '0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9'; //tdot
const NEW_ROOT = '0xadefab4a55c7179388eb30b6ac78b9e05ec46f0f93a4b9cc5df3866d8b1e4b73';
const NEW_CYCLE = 12;
const NEW_START_BLOCK = 2372400;
const NEW_END_BLOCK = 2411800;

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

    // const role = await distributor.ROOT_PROPOSER_ROLE();
    // console.log('Role: ' + role)
    // console.log('Has role: ' + await distributor.hasRole(role, '0x2932516D9564CB799DDA2c16559caD5b8357a0D6'));
    // const tx = await distributor.grantRole(role, '0xb1a0E8F86546f33605Fba526AB539aa0E42725eb');
    // await tx.wait();
    // console.log('Has role: ' + await distributor.hasRole(role, '0xb1a0E8F86546f33605Fba526AB539aa0E42725eb'));

    const tx1 = await distributor.proposeRoot(NEW_ROOT, ethers.utils.formatBytes32String(''), NEW_CYCLE, NEW_START_BLOCK, NEW_END_BLOCK, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx1.wait();

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
