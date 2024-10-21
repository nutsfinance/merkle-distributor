import { ethers } from "hardhat";

// const DISTRIBUTOR = '0xff066331be693BE721994CF19905b2DC7475C5c9'; //3usd
// const DISTRIBUTOR = '0xf595F4a81B27E5CC1Daca349A69c834f375224F4'; //taiKSM
 const DISTRIBUTOR = '0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9'; //tdot



async function main() {
    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    const distributor = MerkleDistributor.attach(DISTRIBUTOR);
    console.log('Cycle before: ' + await distributor.currentCycle());

     const adminRole = await distributor.DEFAULT_ADMIN_ROLE();

    // const tx1 = await distributor.grantRole(adminRole, '0x99537d82F6F4AAD1419dD14952B512c7959A2904');
    // await tx1.wait();
    // console.log('Has role: ' + await distributor.hasRole(adminRole, '0x99537d82F6F4AAD1419dD14952B512c7959A2904'));

    // console.log('Proposal role: ' + adminRole)
    // console.log('Has role: ' + await distributor.hasRole(adminRole, '0xb1a0E8F86546f33605Fba526AB539aa0E42725eb'));
    // console.log('Has role: ' + await distributor.hasRole(adminRole, '0x2932516d9564cb799dda2c16559cad5b8357a0d6'));
    // console.log('Has role: ' + await distributor.hasRole(adminRole, '0x99537d82F6F4AAD1419dD14952B512c7959A2904'));

    const roleAddress = '0x3b39D26fe2FF9BA979FA75DEa4a2B1876158fbfb';
    const role1 = await distributor.ROOT_PROPOSER_ROLE();
    console.log('Proposal role: ' + role1)
    console.log('Has role: ' + await distributor.hasRole(role1, roleAddress));
    const tx1 = await distributor.grantRole(role1, roleAddress);
    await tx1.wait();
    console.log('Has role: ' + await distributor.hasRole(role1, roleAddress));

    const role2 = await distributor.ROOT_VALIDATOR_ROLE();
    console.log('Proposal role: ' + role2)
    console.log('Has role: ' + await distributor.hasRole(role2, roleAddress));
    const tx2 = await distributor.grantRole(role2, roleAddress);
    await tx2.wait();
    console.log('Has role: ' + await distributor.hasRole(role2, roleAddress));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });
