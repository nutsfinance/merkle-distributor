/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'

import { BN } from 'bn.js'
import { fetchEntriesToArray } from '@open-web3/util'
import { encodeAddress } from '@polkadot/util-crypto'
import { formatBalance, formatDecimal, table } from '../log'
import runner from '../runner'
import * as fs from 'fs'

runner()
  .requiredNetwork(['karura'])
  .withApiPromise()
  .atBlock(2034200)
  .run(async ({ apiAt }) => {
    const accs = fs.readFileSync('/Users/cyin/scripts/accounts.txt',
            {encoding:'utf8', flag:'r'}).split("\n");
    for (const accountId of accs) {
      console.log("accountId: " + accountId);
    }
    // const accs = await fetchEntriesToArray((startKey) =>
    //   apiAt.query.system.account.entriesPaged({
    //     args: [],
    //     pageSize: 500,
    //     startKey,
    //   })
    // );
    // for (const [key, value] of accs) {
    //   const accountId = encodeAddress(key.slice(-32));
    // }

    // console.log("accs: " + accs.length);
    // console.log("AccountId,Pool Balance,DEX Balance,Incentive Share")
    // let promises: Promise<void>[] = [];
    // for (const [key, value] of accs) {
    //   const accountId = encodeAddress(key.slice(-32));
    //   promises.push((async () => {
    //     const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 0});
    //     const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'Loans': {'StableAssetPoolToken': 0}}, accountId);
    //     const dex = await apiAt.query.tokens.accounts(accountId, {'DexShare': [{'Token': 'TAI'}, {'StableAssetPoolToken': 0}]});
    //     if (balance.free.gt(new BN(0)) || dex.free.gt(new BN(0)) || incentives[0].gt(new BN(0))) {
    //       console.log(accountId + "," + balance.free + "," + dex.free + "," + incentives[0]);
    //     }
    //   })());
    //   if (promises.length > 500) {
    //     await Promise.all(promises);
    //     promises = [];
    //   }
    // }
    // if (promises.length > 0) {
    //   await Promise.all(promises);
    // }
  });
