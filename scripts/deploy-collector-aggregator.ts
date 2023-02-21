import hre from "hardhat";
import { providerOverrides } from '../utils/overrideProvider';
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  

  const overrides = await providerOverrides();
  const deployer = overrides.signer;
  const RewardCollectorAggregator = await hre.ethers.getContractFactory("RewardCollectorAggregator", deployer);
  console.log(deployer.address);
  const rewardCollectorAggregator = await hre.upgrades.deployProxy(RewardCollectorAggregator, [deployer.address]);

  await rewardCollectorAggregator.deployed();

  console.log(`Reward collector aggregator ${rewardCollectorAggregator.address} is deployed`);
  const roleAddress = '0x99537d82F6F4AAD1419dD14952B512c7959A2904';
  const role1 = await rewardCollectorAggregator.DISTRIBUTOR_ROLE();
  console.log('Distributor role: ' + role1)
  console.log('Has role: ' + await rewardCollectorAggregator.hasRole(role1, roleAddress));
  const tx1 = await rewardCollectorAggregator.grantRole(role1, roleAddress);
  await tx1.wait();
  console.log('Has role: ' + await rewardCollectorAggregator.hasRole(role1, roleAddress));
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
