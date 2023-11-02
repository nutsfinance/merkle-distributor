/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'

import { BN } from 'bn.js'
import runner from './lib/runner'
import { createFile, fileExists, getFile } from './lib/aws_utils'

const EXCLUDED_ADDRESS = ['5G37EjzukybyVa4r8muHbrZ1aTLnHxFBSP9ajCEPonwYCMJK', '5GSQjwf3pJ8vG9QtbQd8sf9U4G77VaUxwFfAPgpzwDnQiF9U', '5EMjsczMNh6LFJZ5qoTvLn1UJF8tswd7tuaKbPpe6wguRzSU', '5ChQuE91nkwu2C2LF3j8BUgBfCcrMR7CLDaR9rvLmyZLJ7hq'];

// 3USD only exists in wallet, so record it directly
export const get3UsdBalance = async (block: number) => {
  console.log('\n------------------------------------------');
  console.log('*          Query 3USD Balance             *');
  console.log('------------------------------------------\n');

  const accountFile = `accounts/karura_${block}.csv`;
  const balanceFile = `balances/karura_3usd_${block}.csv`;
  if (await fileExists(balanceFile)) {
    console.log(`${balanceFile} exists. Skip querying raw balances.`);
    return;
  }

  await runner()
    .requiredNetwork(['karura'])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const accs = (await getFile(accountFile)).split("\n");
      console.log(`Account number: ${accs.length}`);
      let content = "";
      let count = 0;
      let holders = 0;
      const start = new Date();

      console.log(`Start querying 3USD balance at ${start.toTimeString()}`);
      let promises: Promise<void>[] = [];
      for (const accountId of accs) {
        if (!accountId || EXCLUDED_ADDRESS.includes(accountId)) continue;
          promises.push((async () => {
            const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 1}) as any;
            if (balance.free.gt(new BN(0))) {
              content += accountId + "," + balance.free + "\n";
              holders++;
            }
            count++;
          })());
          if (promises.length > 500) {
            await Promise.all(promises);
            promises = [];
            console.log(`${count} accounts processed.`);
          }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }

      await createFile(balanceFile, content);
      const end = new Date();
      console.log(`End querying 3USD balance at ${end.toTimeString()}`);
      console.log(`3USD account number: ${holders}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}
