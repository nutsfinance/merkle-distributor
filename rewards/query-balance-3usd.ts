/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import * as fs from 'fs'

// 3USD only exists in wallet, so record it directly
export const get3UsdBalance = async (block: number) => {
  const accountFile = __dirname + `/data/accounts/karura_${block}.txt`;
  const balanceFile = __dirname + `/data/balances/karura_3usd_${block}.csv`;

  await runner()
    .requiredNetwork(['karura'])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const accs = fs.readFileSync(accountFile, {encoding:'utf8', flag:'r'}).split("\n");
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
      let fd = await fs.promises.open(balanceFile, "w");
      await fs.promises.writeFile(fd, content);
      await fd.close();
    });
}
