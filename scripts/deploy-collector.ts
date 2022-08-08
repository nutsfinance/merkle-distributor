import hre from "hardhat";
import { getTxParams } from "../utils/deployUtils";

async function main() {
  const distributor = "0xf595F4a81B27E5CC1Daca349A69c834f375224F4";

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
