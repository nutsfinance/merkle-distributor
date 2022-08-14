import { ethers } from "hardhat";

import { distributeTDot } from "./distribute-tdot";
import { generateMerkle } from "./generate_merkle";
import { getAccounts } from "./query-accounts";
import { getTdotBalance, getTdotRawBalance } from "./query-balance-tdot";
import { submitMerkle } from "./submit-merkle";

const main = async () => {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log('Current block number: ' + blockNumber)
    // Round down to nearest 200 blocks
    const block = Math.floor(blockNumber / 200) * 200;
    console.log(`tDOT pipeline runs at block ${block}`);

    // Common
    await getAccounts('acala', block);

    // Asset-specific
    await getTdotRawBalance(block);
    await getTdotBalance(block);
    await distributeTDot(block);

    // Common
    await generateMerkle("tdot", block);
    await submitMerkle("tdot");
}

main().then(() => {
    process.exit(0);
}).catch(error => {
    console.error(error);
    process.exit(1);
})