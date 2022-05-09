const { calcEthereumTransactionParams } = require("@acala-network/eth-providers");

const txFeePerGas = '199999946752';
const storageByteDeposit = '0';

async function main() {
    const blockNumber = await ethers.provider.getBlockNumber();
    
    const ethParams = calcEthereumTransactionParams({
        gasLimit: '21000010',
        validUntil: (blockNumber + 100).toString(),
        storageLimit: '640010',
        txFeePerGas,
        storageByteDeposit
    });
    
    const [deployer, proxyAdmin, admin] = await ethers.getSigners();
    
    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    const instance = await MerkleDistributor.deploy({
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    console.log("Merkle distributor address:", instance.address);

    const MerkleDistributorProxy = await ethers.getContractFactory("MerkleDistributorProxy");
    const proxy = await MerkleDistributorProxy.deploy(instance.address, proxyAdmin.address, [], {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    console.log('Merkle distributor proxy address', proxy.address);

    const distributor = instance.attach(proxy.address);
    await distributor.initialize(admin.address, admin.address, admin.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });