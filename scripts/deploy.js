const { calcEthereumTransactionParams } = require("@acala-network/eth-providers");
const { ethers, upgrades } = require("hardhat");

async function main() {
    const blockNumber = await ethers.provider.getBlockNumber();
    
    const ethParams = calcEthereumTransactionParams({
        gasLimit: '21000010',
        validUntil: (blockNumber + 100).toString(),
        storageLimit: '640010',
        txFeePerGas: '199999946752',
        storageByteDeposit: '100000000000000'
    });
    
    const [deployer, admin] = await ethers.getSigners();
    
    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    const distributor = await upgrades.deployProxy(MerkleDistributor, [admin.address, admin.address, admin.address], {
        deployer,
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await distributor.deployed();
    console.log("Merkle distributor address:", distributor.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });