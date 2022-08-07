/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import * as fs from 'fs'

export const getTaiKsmBalance = async (block: number) => {
  const accountFile = __dirname + `/data/accounts/karura_${block}.txt`;
  const balanceFile = __dirname + `/data/balances/taiksm_${block}.csv`;

  await runner()
    .requiredNetwork(['karura'])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const accs = fs.readFileSync(accountFile, {encoding:'utf8', flag:'r'}).split("\n");
      console.log(`Account number: ${accs.length}`);
      const fd = await fs.promises.open(balanceFile, "w");
      await fs.promises.writeFile(fd, "AccountId,Pool Balance,DEX Balance,Incentive Share\n");

      let promises: Promise<void>[] = [];
      let count = 0;
      const start = new Date();
      console.log(`Start querying taiKSM balance at ${start.toTimeString()}`);
      for (const accountId of accs) {
        if (accountId) {
          promises.push((async () => {
            // taiKSM balance
            const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 0}) as any;
            // takKSM in loan position
            const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'Loans': {'StableAssetPoolToken': 0}}, accountId) as any;
            // taiKSM in TAI-taiKSM
            const dex = await apiAt.query.tokens.accounts(accountId, {'DexShare': [{'Token': 'TAI'}, {'StableAssetPoolToken': 0}]}) as any;

            if (balance.free.gt(new BN(0)) || dex.free.gt(new BN(0)) || incentives[0].gt(new BN(0))) {
              await fs.promises.writeFile(fd, accountId + "," + balance.free + "," + dex.free + "," + incentives[0] + "\n");
              count++;
            }
          })());
          if (promises.length > 500) {
            await Promise.all(promises);
            promises = [];
            console.log(`${count} accounts processed.`);
          }
        }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      await fd.close();
      const end = new Date();
      console.log(`End querying taiKSM balance at ${end.toTimeString()}`);
      console.log(`taiKSM account number: ${count}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}