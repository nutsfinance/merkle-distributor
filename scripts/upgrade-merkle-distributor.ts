import { upgrades, ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();


async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Deployer addresss: ' + deployer.address + ", balance: " + (await deployer.getBalance()).toString());

    // const MerkleDistributor = await ethers.getContractFactory("RewardCollectorAggregator", deployer);
    // const distributor = await upgrades.upgradeProxy('0x3b39D26fe2FF9BA979FA75DEa4a2B1876158fbfb', MerkleDistributor);
    const proxyAddress = '0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9';
    const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
    console.log(proxyAdminAddress);
    const proxyAdmin = await ethers.getContractAt("ProxyAdmin", proxyAdminAddress)
    const owner = await proxyAdmin.owner();
    console.log(owner);
    // const newImpl = await ethers.deployContract("MerkleDistributor", []);
    // console.log(newImpl.address);
    const implAddress = '0x9ac6d27e38cd30c8e56ea207459518501f1d5b28';
    await proxyAdmin.upgrade(proxyAddress, implAddress);

    //const newImpl = await ethers.deployContract("UpgradeableUSDC", [])

    //await proxyAdmin.upgradeAndCall(proxyAddress, await newImpl.getAddress(), "0x")
    // const RewardCollectorAggregator = await ethers.getContractFactory("RewardCollectorAggregator");
    // const aggregator = RewardCollectorAggregator.attach(proxyAddress);

    // const role1 = await aggregator.DISTRIBUTOR_ROLE();

    // console.log('Merkle distributor: ' + (await aggregator.hasRole(role1, '0x99537d82F6F4AAD1419dD14952B512c7959A2904')));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });