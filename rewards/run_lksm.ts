import { ethers } from "hardhat";

import { distributeLKSM } from "./distribute-lksm";
import { generateMerkle } from "./generate_merkle";
import { getAccounts } from "./query-accounts";
import { getLKSMRawBalance, getLKSMBalance } from "./query-balance-lksm";
import { getTaiKsmBalance, getTaiKsmRawBalance } from "./query-balance-taiksm";
import { getKarClaimers } from "./query-kar-claimers";
import { submitMerkle } from "./submit-merkle";

const main = async () => {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log('Current block number: ' + blockNumber)
    // Round down to nearest 200 blocks
    const block = Math.floor(blockNumber / 200) * 200;
    console.log(`taiKSM pipeline runs at block ${block}`);

    // Common
    await getAccounts('karura', block);

    // Asset-specific
    await getKarClaimers("lksm", block);
    // get taiKSMBalance at first for we should count the lksm amount part of taiKSM
    await getTaiKsmRawBalance(block);
    await getTaiKsmBalance(block);
    await getLKSMRawBalance(block);
    await getLKSMBalance(block);
    await distributeLKSM(block);

    // Common
    await generateMerkle("lksm", block);
    await submitMerkle("lksm");
}

main().then(() => {
    process.exit(0);
}).catch(error => {
    console.error(error);
    process.exit(1);
})