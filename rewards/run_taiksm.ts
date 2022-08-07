import { getAccounts } from "./query-accounts";
import { getTaiKsmRawBalance, getTaiKsmBalance } from "./query-balance-taiksm";

const BLOCK = 2372400;

const main = async () => {
    try {
        await getAccounts('karura', BLOCK);
        await getTaiKsmRawBalance(BLOCK);
        await getTaiKsmBalance(BLOCK);
    } catch(error) {
        console.error(error);
    }
}

main();