const { upgrades, ethers } = require("hardhat");
const { providerOverrides } = require('../utils/overrideProvider');
require('dotenv').config();

async function main() {
    const overrides = await providerOverrides(process.env.MANDALA_ENDPOINT_URL);
    const deployer = overrides.signer;

    console.log('Deployer addresss: ' + deployer.address + ", balance: " + (await deployer.getBalance()).toString());

    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor", deployer);
    const distributor = await upgrades.deployProxy(MerkleDistributor, [deployer.address, deployer.address, deployer.address]);

    console.log('Merkle distributor: ' + distributor.address);
    console.log('Current cycle: ' + (await distributor.currentCycle()));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });