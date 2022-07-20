/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import { fetchEntriesToArray } from '@open-web3/util'
import { encodeAddress } from '@polkadot/util-crypto'
import { formatBalance, formatDecimal, table } from '../log'
import runner from '../runner'
import * as fs from 'fs'

runner()
  .requiredNetwork(['acala'])
  .withApiPromise()
  .atBlock(parseInt(process.argv[2]))
  .run(async ({ apiAt }) => {
    const accs = fs.readFileSync(__dirname + "/../../aca-accounts.txt",
            {encoding:'utf8', flag:'r'}).split("\n");
    let fd = await fs.promises.open(__dirname + "/../../aca-balances-" + process.argv[2] + ".csv", "w");
    await fs.promises.writeFile(fd, "AccountId,Pool Balance,Incentive Share\n");
    let promises: Promise<void>[] = [];
    for (const accountId of accs) {
      if (accountId) {
        promises.push((async () => {
          const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 0});
          const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'Loans': {'StableAssetPoolToken': 0}}, accountId);
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
