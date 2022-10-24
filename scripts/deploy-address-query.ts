import hre from "hardhat";
import { getTxParams } from "../utils/deployUtils";

async function main() {
  const distributor = "0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9";

  const params = await getTxParams(hre);
  const EVMAccountsQuery = await hre.ethers.getContractFactory("EVMAccountsQuery");
  const contract = await EVMAccountsQuery.deploy({
    gasPrice: params.txGasPrice,
    gasLimit: params.txGasLimit
  });

  await contract.deployed();

  console.log(`EVMAccountsQuery ${contract.address} is deployed for distributor ${distributor}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
