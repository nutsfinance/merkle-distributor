import { distributeTaiKsm } from "./distribute-taiksm";
import { generateMerkle } from "./generate_merkle";
import { getAccounts } from "./query-accounts";
import { getTaiKsmRawBalance, getTaiKsmBalance } from "./query-balance-taiksm";
import { submitMerkle } from "./submit-merkle";

const BLOCK = 2372400;

const main = async () => {
    try {
        // Common
        await getAccounts('karura', BLOCK);

        // Asset-specific
        await getTaiKsmRawBalance(BLOCK);
        await getTaiKsmBalance(BLOCK);
        await distributeTaiKsm(BLOCK);

        // Common
        await generateMerkle("taiksm", BLOCK);
        await submitMerkle("taiksm");

        process.exit(0);
    } catch(error) {
        console.error(error);
    }
}

main();