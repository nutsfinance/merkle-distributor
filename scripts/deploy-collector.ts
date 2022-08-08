import hre from "hardhat";
import { getTxParams } from "../utils/deployUtils";

async function main() {
  const distributor = "0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9";

  const params = await getTxParams(hre);
  const RewardCollector = await hre.ethers.getContractFactory("RewardCollector");
  const rewardCollector = await RewardCollector.deploy(distributor, {
    gasPrice: params.txGasPrice,
    gasLimit: params.txGasLimit
  });

  await rewardCollector.deployed();

  console.log(`Reward collector ${rewardCollector.address} is deployed for distributor ${distributor}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
