import { getAccounts } from "./query-accounts";
import { getTaiKsmBalance } from "./query-balance-taiksm";

const BLOCK = 2372400;

const main = async () => {
    await getAccounts('karura', BLOCK);
    await getTaiKsmBalance(BLOCK);
}

main();