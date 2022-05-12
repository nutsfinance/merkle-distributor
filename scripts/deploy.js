const { calcEthereumTransactionParams } = require("@acala-network/eth-providers");
const { upgrades, ethers } = require("hardhat");

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

    const EvmAccount = await ethers.getContractFactory("TestEvmAccount");
    const evmAccount = await EvmAccount.deploy({
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await evmAccount.deployed();
    console.log('EVM account: ' + evmAccount.address);

    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    const distributor = await MerkleDistributor.deploy({
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await distributor.deployed();
    console.log('Merkle distributor: ' + distributor.address);
    const tx = await distributor.initialize(admin.address, admin.address, admin.address, evmAccount.address, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx.wait();
    
    // const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    // const distributor = await upgrades.deployProxy(MerkleDistributor, [admin.address, admin.address, admin.address], {
    //     deployer,
    //     gasPrice: ethParams.txGasPrice,
    //     gasLimit: ethParams.txGasLimit,
    // });
    // await distributor.deployed();
    // console.log("Merkle distributor address:", distributor.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });