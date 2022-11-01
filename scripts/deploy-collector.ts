import hre from "hardhat";
import { providerOverrides } from '../utils/overrideProvider';
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  

  const overrides = await providerOverrides();
  const deployer = overrides.signer;
  const RewardCollector = await hre.ethers.getContractFactory("RewardCollector", deployer);
  console.log(deployer.address);
  const rewardCollector = await hre.upgrades.deployProxy(RewardCollector, [deployer.address]);

  await rewardCollector.deployed();

  console.log(`Reward collector ${rewardCollector.address} is deployed`);
  const roleAddress = '0x99537d82F6F4AAD1419dD14952B512c7959A2904';
  const role1 = await rewardCollector.DISTRIBUTOR_ROLE();
  console.log('Distributor role: ' + role1)
  console.log('Has role: ' + await rewardCollector.hasRole(role1, roleAddress));
  const tx1 = await rewardCollector.grantRole(role1, roleAddress);
  await tx1.wait();
  console.log('Has role: ' + await rewardCollector.hasRole(role1, roleAddress));

  const distributors = ["0xf595F4a81B27E5CC1Daca349A69c834f375224F4", "0xff066331be693BE721994CF19905b2DC7475C5c9"];
  for (const distributor of distributors) {
    const tx2 = await rewardCollector.updateTarget(distributor, true);
    await tx2.wait();
    console.log(`${distributor} has target: ` + await rewardCollector.targets(distributor));
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
