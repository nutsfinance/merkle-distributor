import { ethers } from "hardhat";
import { keyring as Keyring } from '@polkadot/ui-keyring';

import { distributeTaiKsm } from "./distribute-taiksm";
import { generateMerkle } from "./generate_merkle";
import { getAccounts } from "./query-accounts";
import { getLKSMBalance } from "./query-balance-lksm";
import { getTaiKsmBalance } from "./query-balance-taiksm";
import { getKarClaimers } from "./query-kar-claimers";
import { submitMerkle } from "./submit-merkle";
import { distributeLKSM } from "./distribute-lksm";

const main = async () => {
    Keyring.loadAll({ type: 'sr25519' });

    const blockNumber = await ethers.provider.getBlockNumber();
    console.log('Current block number: ' + blockNumber)
    // Round down to nearest 200 blocks
    const block = Math.floor(blockNumber / 200) * 200;
    console.log(`taiKSM pipeline runs at block ${block}`);

    // Common
    await getAccounts('karura', block);

    // Asset-specific
    await getKarClaimers("taiksm", block);
    // await getKarClaimers("lksm", block);
    await getTaiKsmBalance(block);
    await getLKSMBalance(block);
    // 1. calculate tai reward
    // 2. calculate lksm reward in taiKSM
    await distributeTaiKsm(block);
    // await distributeLKSM(block);

    // Common
    await generateMerkle("taiksm", block);
    // await generateMerkle("lksm", block);
    await submitMerkle("taiksm");
    // await submitMerkle("lksm");
}

main().then(() => {
    process.exit(0);
}).catch(error => {
    console.error(error);
    process.exit(1);
})