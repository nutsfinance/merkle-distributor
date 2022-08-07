/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import * as fs from 'fs'

export const getTdotBalance = async (block: number) => {
  const accountFile = __dirname + `/data/accounts/karura_${block}.txt`;
  const balanceFile = __dirname + `/data/balances/tdot_${block}.csv`;

  await runner()
    .requiredNetwork(['acala'])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const accs = fs.readFileSync(accountFile, {encoding:'utf8', flag:'r'}).split("\n");
      let fd = await fs.promises.open(balanceFile, "w");
      await fs.promises.writeFile(fd, "AccountId,Pool Balance,Incentive Share\n");

      let promises: Promise<void>[] = [];
      for (const accountId of accs) {
        if (accountId) {
          promises.push((async () => {
            // tDOT balance
            const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 0}) as any;
            // tDOT in loan position
            const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'Loans': {'StableAssetPoolToken': 0}}, accountId) as any;
            if (balance.free.gt(new BN(0)) || incentives[0].gt(new BN(0))) {
              await fs.promises.writeFile(fd, accountId + "," + balance.free + "," + incentives[0] + "\n");
            }
          })());
          if (promises.length > 500) {
            await Promise.all(promises);
            promises = [];
          }
        }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      await fd.close();
    });
}
