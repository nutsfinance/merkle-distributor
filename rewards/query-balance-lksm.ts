/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import { createFile, fileExists, getFile } from './lib/aws_utils'

const ONE = new BN(10).pow(new BN(12));
// Loan, Rewards
const EXCLUDED_ADDRESS = ['5EYCAe5fiQJsnqbdsqzNnWhEAGZkyK8uqahrmhwVvcuNRhpd', '5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj'];

/**
 * the user's lksm amount contains:
 * 1. lksm free balance
 * 2. lksm in honzon
 * 3. lksm in taiKSM
 * @param block 
 * @returns 
 */

export const getLKSMBalance = async (block: number) => {
  console.log('\n------------------------------------------');
  console.log('*        Query LKSM Balance             *');
  console.log('------------------------------------------\n');

  const accountFile = `accounts/karura_${block}.csv`;
  const lksmBalanceFile = `balances/karura_lksm_${block}.csv`;
  const taiKsmBalanceFile = `balances/karura_taiksm_${block}.csv`;

  if (await fileExists(lksmBalanceFile)) {
    console.log(`${lksmBalanceFile} exists. Skip querying raw balances.`);
    return;
  }

  const taiKsmBalances = (await getFile(taiKsmBalanceFile)).split("\n") as string[];
  const taiKsmAccountBalances: Record<string, any> = {};
  for (const balanceLine of taiKsmBalances) {
    const [address, free, loan, dex] = balanceLine.split(",");
    taiKsmAccountBalances[address] = new BN(free).add(new BN(loan)).add(new BN(dex));
  }

  await runner()
    .requiredNetwork(['karura'])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const accs = (await getFile(accountFile)).split("\n") as string[];

      console.log(`Account number: ${accs.length}`);      
      let promises: Promise<void>[] = [];
      let count = 0;
      const start = new Date();

      console.log(`Start querying LKSM balance at ${start.toTimeString()}`);

      const taiKSMIssuance = await apiAt.query.tokens.totalIssuance({'StableAssetPoolToken': 0});
      const pool = (await apiAt.query.stableAsset.pools(0) as any).unwrapOrDefault();
      const totalStaking = await apiAt.query.homa.totalStakingBonded() as any;
      const totalVoidLKSM = await apiAt.query.homa.totalVoidLiquid() as any;
      const totalLKSMIssuance = await apiAt.query.tokens.totalIssuance({"Token": "LKSM"}) as any;

      const exchangeRate = totalStaking.mul(ONE).div(totalLKSMIssuance.add(totalVoidLKSM));
      const totalLKSMInTaiKSM = pool.balances[1].mul(ONE).div(exchangeRate);
      console.log(`Total LKSM in taiKSM: ${totalLKSMInTaiKSM.toString()}`);
      console.log(`Total taiKSM issuance: ${taiKSMIssuance.toString()}`)

      let content = "";
      for (const accountId of accs) {
        if (!accountId || EXCLUDED_ADDRESS.includes(accountId)) continue;
        
        promises.push((async () => {
          // lksm balance
          const balance = await apiAt.query.tokens.accounts(accountId, {'Token': 'LKSM'}) as any;
          // lksm in loan position
          const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'loans': {'Token': 'LKSM'}}, accountId) as any;
          const total = balance.free.add(incentives[0]);
          // lksm in taiKSM 
          const taiKsm = taiKsmAccountBalances[accountId] || new BN(0);

          if (balance.free.gt(new BN(0)) || incentives[0].gt(new BN(0)) || taiKsm.gt(new BN(0))) {
            const inTaiKsm = taiKsm.mul(totalLKSMInTaiKSM).div(taiKSMIssuance);
            content += accountId + "," + total.toString() + "," + inTaiKsm.toString() + "\n";
            count++;
          }
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

      await createFile(lksmBalanceFile, content);

      const end = new Date();
      console.log(`End querying LKSM balance at ${end.toTimeString()}`);
      console.log(`LKSM account number: ${count}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}