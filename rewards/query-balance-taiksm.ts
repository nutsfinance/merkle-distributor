/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner';
import { createFile, fileExists, getFile } from './lib/aws_utils';

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
      let content = "";
      
      let promises: Promise<void>[] = [];
      let count = 0;
      const start = new Date();
      console.log(`Start querying taiKSM balance at ${start.toTimeString()}`);

      const taiKsmInDex = (await apiAt.query.dex.liquidityPool([{'Token': 'TAI'}, {'StableAssetPoolToken': 0}]) as any)[1];
      const taiKsmLpIssuance = await apiAt.query.tokens.totalIssuance({'DexShare': [{'Token': 'TAI'}, {'StableAssetPoolToken': 0}]}) as any;
      console.log(`taiKSM in DEX: ${taiKsmInDex.toString()}`);
      console.log(`taiKsm LP Issuance: ${taiKsmLpIssuance.toString()}`)
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
              const dexBalance = dex.free.mul(taiKsmInDex).div(taiKsmLpIssuance);
              content += accountId + "," + balance.free.toString() + "," + incentives[0].toString() + "," + dexBalance.toString() + "," + dex.free.toString() + "\n";
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

      await createFile(balanceFile, content);
      const end = new Date();
      console.log(`End querying taiKSM balance at ${end.toTimeString()}`);
      console.log(`taiKSM account number: ${count}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}