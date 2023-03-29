/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner';
import { createFile, fileExists, getFile } from './lib/aws_utils';
import * as _ from 'lodash';

// DEX, Rewards
const EXCLUDED_ADDRESS = ['5EYCAe5fiQJsnqbdsqzNnWhEAGZkyK8uqahrmhwVvcuNRhpd', '5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj', '5G37EjzukybyVa4r8muHbrZ1aTLnHxFBSP9ajCEPonwYCMJK', '5GSQjwf3pJ8vG9QtbQd8sf9U4G77VaUxwFfAPgpzwDnQiF9U', '5EMjsczMNh6LFJZ5qoTvLn1UJF8tswd7tuaKbPpe6wguRzSU'];

/**
 * @dev taiKSM balance contains three part:
 * 1. Free taiKsm in wallet
 * 2. taiKSM in loan
 * 3. taiKSM in TAI-taiKSM DEX pair
 */
export const getTaiKsmBalance = async (block: number) => {
  console.log('\n------------------------------------------');
  console.log('*        Query taiKSM Balance             *');
  console.log('------------------------------------------\n');

  const accountFile = `accounts/karura_${block}.csv`;
  const balanceFile = `balances/karura_taiksm_${block}.csv`;
  if (await fileExists(balanceFile)) {
    console.log(`${balanceFile} exists. Skip querying taiKSM balances.`);
    return;
  }

  await runner()
    .requiredNetwork(['karura'])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const accs = (await getFile(accountFile)).split("\n");
      console.log(`Account number: ${accs.length}`);

      console.log(_.uniq(accs).length);

      let content = "";
      
      let promises: Promise<void>[] = [];
      let count = 0;
      let holders = 0;
      const start = new Date();
      console.log(`Start querying taiKSM balance at ${start.toTimeString()}`);

      const taiKsmInDex = (await apiAt.query.dex.liquidityPool([{'Token': 'TAI'}, {'StableAssetPoolToken': 0}]) as any)[1];
      const taiKsmLpIssuance = await apiAt.query.tokens.totalIssuance({'DexShare': [{'Token': 'TAI'}, {'StableAssetPoolToken': 0}]}) as any;
      console.log(`taiKSM in DEX: ${taiKsmInDex.toString()}`);
      console.log(`taiKsm LP Issuance: ${taiKsmLpIssuance.toString()}`)
      for (const accountId of accs) {
        if (!accountId || EXCLUDED_ADDRESS.includes(accountId)) continue;
        
        promises.push((async () => {
          // taiKSM balance
          const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 0}) as any;
          // takKSM in loan position
          const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'Loans': {'StableAssetPoolToken': 0}}, accountId) as any;
          // taiKSM in TAI-taiKSM
          const dex = await apiAt.query.tokens.accounts(accountId, {'DexShare': [{'Token': 'TAI'}, {'StableAssetPoolToken': 0}]}) as any;

          // const dexBalance = dex.free.mul(taiKsmInDex).div(taiKsmLpIssuance);
          // content += accountId + "," + balance.free.toString() + "," + balance.reserved.toString() + "," + balance.frozen.toString() + "," + incentives[0].toString() + "," +  dexBalance.toString() + "\n";
          // count++;

          if (balance.free.gt(new BN(0)) || dex.free.gt(new BN(0)) || incentives[0].gt(new BN(0))) {
            const dexBalance = dex.free.mul(taiKsmInDex).div(taiKsmLpIssuance);
            content += accountId + "," + balance.free.toString() + "," + incentives[0].toString() + "," + dexBalance.toString() + "\n";
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
      console.log(`End querying taiKSM balance at ${end.toTimeString()}`);
      console.log(`taiKSM account number: ${holders}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}