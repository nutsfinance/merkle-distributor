import { distributeTaiKsm } from "./distribute-taiksm";
import { generateMerkle } from "./generate_merkle";
import { getAccounts } from "./query-accounts";
import { getTaiKsmRawBalance, getTaiKsmBalance } from "./query-balance-taiksm";

const BLOCK = 2372400;

const main = async () => {
    try {
        await getAccounts('karura', BLOCK);
        await getTaiKsmRawBalance(BLOCK);
        await getTaiKsmBalance(BLOCK);
        await distributeTaiKsm(BLOCK);
        await generateMerkle("taiksm", BLOCK);

        process.exit(0);
    } catch(error) {
        console.error(error);
    }
}

main();