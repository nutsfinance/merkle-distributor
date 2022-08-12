/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import { createFile, fileExists, getFile } from './lib/s3_utils'

// 3USD only exists in wallet, so record it directly
export const get3UsdBalance = async (block: number) => {
  console.log('\n------------------------------------------');
  console.log('*          Query 3USD Balance             *');
  console.log('------------------------------------------\n');

  const accountFile = `accounts/karura_${block}.txt`;
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
      let content = "";; 

      let promises: Promise<void>[] = [];
      for (const accountId of accs) {
        if (!accountId) continue;
          promises.push((async () => {
            const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 1}) as any;
            if (balance.free.gt(new BN(0))) {
              content += accountId + "," + balance.free + "\n";
            }
          })());
          if (promises.length > 500) {
            await Promise.all(promises);
            promises = [];
          }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }

      await createFile(balanceFile, content);
    });
}
