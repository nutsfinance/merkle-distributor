import { distributeLKSM } from "./distribute-lksm";
import { generateMerkle } from "./generate_merkle";
import { getAccounts } from "./query-accounts";
import { getLKSMRawBalance, getLKSMBalance } from "./query-balance-lksm";
import { getTaiKsmBalance, getTaiKsmRawBalance } from "./query-balance-taiksm";
import { getClaimedLKSMAccounts } from "./query-claimed-lksm-accounts";
import { submitMerkle } from "./submit-merkle";

const BLOCK = 2372400;

const main = async () => {
    try {
        // Common
        await getAccounts('karura', BLOCK);

        // Asset-specific
        // get taiKSMBalance at first for we should count the lksm amount part of taiKSM
        await getClaimedLKSMAccounts(BLOCK);
        await getTaiKsmRawBalance(BLOCK);
        await getTaiKsmBalance(BLOCK);
        await getLKSMRawBalance(BLOCK);
        await getLKSMBalance(BLOCK);
        await distributeLKSM(BLOCK);

        // Common
        await generateMerkle("lksm", BLOCK);
        await submitMerkle("lksm");

        process.exit(0);
    } catch(error) {
        console.error(error);
    }
}

main();