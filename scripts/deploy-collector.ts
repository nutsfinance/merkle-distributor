import hre from "hardhat";
import { providerOverrides } from '../utils/overrideProvider';
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const distributor = "0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9";

  const overrides = await providerOverrides();
  const deployer = overrides.signer;
  const RewardCollector = await hre.ethers.getContractFactory("RewardCollector", deployer);
  console.log(deployer.address);
  const rewardCollector = await hre.upgrades.deployProxy(RewardCollector, [deployer.address, distributor]);

  await rewardCollector.deployed();

  console.log(`Reward collector ${rewardCollector.address} is deployed for distributor ${distributor}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
