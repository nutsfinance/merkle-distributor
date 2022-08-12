import { ethers } from "hardhat";
import { distributeLKSM } from "./distribute-lksm";

import { distributeTaiKsm } from "./distribute-taiksm";
import { generateMerkle } from "./generate_merkle";
import { getAccounts } from "./query-accounts";
import { getLKSMBalance, getLKSMRawBalance } from "./query-balance-lksm";
import { getTaiKsmRawBalance, getTaiKsmBalance } from "./query-balance-taiksm";
import { getClaimedLKSMAccounts } from "./query-claimed-lksm-accounts";
import { submitMerkle } from "./submit-merkle";

const runTaiKsmPipeline = async (block: number) => {
    try {
        // Common
        await getAccounts('karura', block);

        // Asset-specific
        await getClaimedLKSMAccounts(block);
        await getTaiKsmRawBalance(block);
        await getTaiKsmBalance(block);
        await getLKSMRawBalance(block);
        await getLKSMBalance(block);
        // 1. calculate tai reward
        // 2. calculate lksm reward in taiKSM
        await distributeTaiKsm(block);
        // calculate lksm reward in free
        await distributeLKSM(block);

        // Common
        await generateMerkle("taiksm", block);
        await generateMerkle("lksm", block);
        // await submitMerkle("taiksm");
    } catch(error) {
        console.error(error);
        process.exit(1);
    }
}

const main = async () => {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log('Current block number: ' + blockNumber)
    // Round down to nearest 100 blocks
    const block = Math.floor(blockNumber / 100) * 100;
    console.log(`taiKSM pipeline runs at block ${block}`);

    await runTaiKsmPipeline(block);
}

main().then(() => {
    process.exit(0);
}).catch(error => {
    console.error(error);
    process.exit(1);
})