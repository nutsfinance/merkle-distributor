import { ethers } from "hardhat";

const COLLECTOR = '0xb864D786D78fC8A740Acd11e17C8a145FC0725c5';


async function main() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const RewardCollector = await ethers.getContractFactory("RewardCollector");
    const collector = RewardCollector.attach(COLLECTOR);

    const roleAddress = '0x99537d82F6F4AAD1419dD14952B512c7959A2904';
    const role1 = await collector.DISTRIBUTOR_ROLE();
    console.log('Proposal role: ' + role1)
    console.log('Has role: ' + await collector.hasRole(role1, roleAddress));
    const tx1 = await collector.grantRole(role1, roleAddress);
    await tx1.wait();
    console.log('Has role: ' + await collector.hasRole(role1, roleAddress));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });
