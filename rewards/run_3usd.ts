import { ethers } from "hardhat";
import { keyring as Keyring } from '@polkadot/ui-keyring';

import { distribute3Usd } from "./distribute-3usd";
import { generateMerkle } from "./generate_merkle";
import { getAccounts } from "./query-accounts";
import { get3UsdBalance } from "./query-balance-3usd";
import { submitMerkle } from "./submit-merkle";

const main = async () => {
    Keyring.loadAll({ type: 'sr25519' });

    const blockNumber = await ethers.provider.getBlockNumber();
    console.log('Current block number: ' + blockNumber)
    // Round down to nearest 200 blocks
    const block = Math.floor(blockNumber / 200) * 200;
    console.log(`3USD pipeline runs at block ${block}`);

    // Common
    await getAccounts('karura', block);

    // Asset-specific
    await get3UsdBalance(block);
    await distribute3Usd(block);

    // Common
    await generateMerkle("3usd", block);
    await submitMerkle("3usd", true);
}

main().then(() => {
    process.exit(0);
}).catch(error => {
    console.error(error);
    process.exit(1);
})