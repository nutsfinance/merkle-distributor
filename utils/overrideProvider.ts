import { ethers, network } from 'hardhat'
import hre from 'hardhat'
import { EvmRpcProvider } from '@acala-network/eth-providers'
import * as dotenv from 'dotenv'
import { getTxParams } from "../utils/deployUtils";

dotenv.config()

export const providerOverrides = async () => {
  const params = await getTxParams(hre);
  const MNEMONIC =
    process.env.MNEMONIC || 'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm'

  let endpointUrl
  switch (network.name) {
    case 'acala':
      endpointUrl = process.env.ACALA_ENDPOINT_URL!
      break
    case 'karura':
      endpointUrl = process.env.KARURA_ENDPOINT_URL!
      break
    default:
      endpointUrl = process.env.MANDALA_ENDPOINT_URL!
      break
  }
  const provider = EvmRpcProvider.from(endpointUrl)
  await provider.isReady()

  const gasPriceOverrides = (await provider._getEthGas()).gasPrice;

  provider.getFeeData = async () => ({
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
    gasPrice: gasPriceOverrides,
    lastBaseFeePerGas: null
  })

  const signer = ethers.Wallet.fromMnemonic(MNEMONIC).connect(provider);
  signer.estimateGas = async(transaction) => {
    return params.txGasLimit;
  }

  return {
    provider: provider,
    signer: signer,
  }
}
