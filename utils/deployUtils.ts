import { HardhatRuntimeEnvironment } from "hardhat/types"; // This adds the type from hardhat runtime environment.
import { calcEthereumTransactionParams } from "@acala-network/eth-providers";

export async function getTxParams({ ethers, network }: HardhatRuntimeEnvironment) {
    const gasLimit = "31000000";
    const txFeePerGas = "199999946752";
    const storageByteDeposit = network.name === 'acalaMainnet' ? "300000000000000" : "100000000000000";
    const storageLimit = "64001";
    const blockNumber = await ethers.provider.getBlockNumber();
  
    const ethParams = calcEthereumTransactionParams({
      gasLimit,
      validUntil: (blockNumber + 100).toString(),
      storageLimit,
      txFeePerGas,
      storageByteDeposit,
    });
  
    return {
      txGasPrice: ethParams.txGasPrice,
      txGasLimit: ethParams.txGasLimit,
    };
  }

  export default () => { };