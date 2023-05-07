/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'

import { BN } from 'bn.js'
import runner from './lib/runner'
import { createFile, fileExists, getFile } from './lib/aws_utils'

const EXCLUDED_ADDRESS = ['5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj', '5G37EjzukybyVa4r8muHbrZ1aTLnHxFBSP9ajCEPonwYCMJK', '5GSQjwf3pJ8vG9QtbQd8sf9U4G77VaUxwFfAPgpzwDnQiF9U', '5EMjsczMoWW9R8tVPHDR8Z4wHrkohJSGkEvjbEHU55tAn3Xg'];

/**
 * @dev tDOT balance contains two parts:
 * 1. Free tDOT in the wallet
 * 2. tDOT in loan
 */
export const getTdotBalance = async (block: number) => {
  console.log('\n------------------------------------------');
  console.log('*          Query tDOT Balance             *');
  console.log('------------------------------------------\n');

  const accountFile = `accounts/acala_${block}.csv`;
  const balanceFile = `balances/acala_tdot_${block}.csv`;
  if (await fileExists(balanceFile)) {
    console.log(`${balanceFile} exists. Skip querying tDOT balances.`);
    return;
  }

  await runner()
    .requiredNetwork(['acala'])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const accs = (await getFile(accountFile)).split("\n");
      console.log(`Account number: ${accs.length}`);
      let content = "";

      let promises: Promise<void>[] = [];
      let count = 0;
      let holders = 0;
      const start = new Date();
      console.log(`Start querying tDOT balance at ${start.toTimeString()}`);
      
      for (const accountId of accs) {
        if (!accountId || EXCLUDED_ADDRESS.includes(accountId)) continue;
        promises.push((async () => {
          // tDOT balance
          const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 0}) as any;
          // tDOT in loan position
          const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'Loans': {'StableAssetPoolToken': 0}}, accountId) as any;
          if (balance.free.gt(new BN(0)) || incentives[0].gt(new BN(0))) {
            content += accountId + "," + balance.free + "," + incentives[0] + "\n";
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
      console.log(`End querying tDOT balance at ${end.toTimeString()}`);
      console.log(`tDOT account number: ${holders}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}
