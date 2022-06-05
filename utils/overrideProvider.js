const { ethers } = require('hardhat');
const { EvmRpcProvider } = require('@acala-network/eth-providers');
require('dotenv').config();

async function providerOverrides(endpointUrl) {
        const MNEMONIC = process.env.MNEMONIC || "fox sight canyon orphan hotel grow hedgehog build bless august weather swarm";

        const provider = EvmRpcProvider.from(endpointUrl);
        await provider.isReady();

        const gasPriceOverrides = (await provider._getEthGas()).gasPrice;

        provider.getFeeData = async () => ({
                maxFeePerGas: null,
                maxPriorityFeePerGas: null,
                gasPrice: gasPriceOverrides,
        });

        const signer = ethers.Wallet.fromMnemonic(MNEMONIC).connect(provider);

        return{
                provider: provider,
                signer: signer
        };
}

module.exports = { providerOverrides };