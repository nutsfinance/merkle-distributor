/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import * as fs from 'fs'
import { createFile, fileExists, getFile } from './lib/aws_utils'

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

  const accountFile = `accounts/karura_${block}.txt`;
  const lksmBalanceFile = `balances/karura_lksm_${block}.csv`;
  const taiKsmBalanceFile = `balances/karura_taiksm_${block}.csv`;

  if (await getFile(lksmBalanceFile)) {
    console.log(`${lksmBalanceFile} exists. Skip querying raw balances.`);
    return;
  }

  const taiKsmBalancesData = (await getFile(taiKsmBalanceFile)).split("\n") as string[];
  const taiKsmBalances: Record<string, bigint> = {};

  taiKsmBalancesData.forEach((i) => {
    const [account, balance] = i.split(',');

    if (account) {
      taiKsmBalances[account] = BigInt(balance || '0');
    }
  })

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
      const position = await apiAt.query.stableAsset.pools(0);
      const totalStaking = await apiAt.query.homa.totalStakingBonded();
      const totalVoidLKSM = await apiAt.query.homa.totalVoidLiquid();
      const totalLKSMIssuance = await apiAt.query.tokens.totalIssuance({"Token": "LKSM"});

      const exchangeRate = (BigInt(totalStaking.toString()) * BigInt(10**12)) / (BigInt(totalLKSMIssuance.toString()) + BigInt(totalVoidLKSM.toString()));
      const totalLKSMInTaiKSM = BigInt((position as any).unwrapOrDefault().balances[1].toString()) * BigInt(10**12) / exchangeRate;

      let content = "";
      for (const accountId of accs) {
        if (accountId) {
          promises.push((async () => {
            // lksm balance
            const balance = await apiAt.query.tokens.accounts(accountId, {'Token': 'LKSM'}) as any;
            // lksm in loan position
            const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'loans': {'Token': 'LKSM'}}, accountId) as any;
            const total = new BN(balance.free).add(new BN(incentives[0]));
            // lksm in taiKSM 
            const inTaiKSM = taiKsmBalances[accountId] ? totalLKSMInTaiKSM * taiKsmBalances[accountId] / BigInt(taiKSMIssuance.toString()) : BigInt(0);

            if (balance.free.gt(new BN(0)) || incentives[0].gt(new BN(0)) || inTaiKSM > BigInt(0)) {
              content += accountId + "," + total.toString() + "," + inTaiKSM + "\n";
              count++;
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

      await createFile(lksmBalanceFile, content);

      const end = new Date();
      console.log(`End querying LKSM balance at ${end.toTimeString()}`);
      console.log(`LKSM account number: ${count}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}