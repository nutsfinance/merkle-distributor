import { upgrades, ethers } from "hardhat";
import { providerOverrides } from '../utils/overrideProvider';
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const overrides = await providerOverrides();
    const deployer = overrides.signer;

    console.log('Deployer addresss: ' + deployer.address + ", balance: " + (await deployer.getBalance()).toString());

    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor", deployer);
    const distributor = await upgrades.deployProxy(MerkleDistributor, [deployer.address, deployer.address, deployer.address]);

    console.log('Merkle distributor: ' + distributor.address);
    console.log('Current cycle: ' + (await distributor.currentCycle()));

    const role = await distributor.ROOT_PROPOSER_ROLE();
    console.log('Role: ' + role)
    console.log('Has role: ' + await distributor.hasRole(role, '0xb1a0E8F86546f33605Fba526AB539aa0E42725eb'));
    const tx = await distributor.grantRole(role, '0xb1a0E8F86546f33605Fba526AB539aa0E42725eb');
    await tx.wait();
    console.log('Has role: ' + await distributor.hasRole(role, '0xb1a0E8F86546f33605Fba526AB539aa0E42725eb'));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });