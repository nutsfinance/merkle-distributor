/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import * as fs from 'fs'
import { createFile, fileExists, getFile } from './lib/s3_utils'

/**
 * the user's lksm amount contains:
 * 1. lksm free balance
 * 2. lksm in honzon
 * 3. lksm in taiKSM
 * @param block 
 * @returns 
 */

export const getLKSMRawBalance = async (block: number) => {
  const accountFile = `accounts/karura_${block}.txt`;
  const rawBalanceFile = `balances/karura_lksm_${block}_raw.csv`;
  const taiBalanceFile = `balances/karura_taiksm_${block}.csv`;

  if (await getFile(rawBalanceFile)) {
    console.log(`${rawBalanceFile} exists. Skip querying raw balances.`);
    return;
  }

  const taiBalancesData = (await getFile(taiBalanceFile)).split("\n") as string[];
  const taiBalances: Record<string, bigint> = {};

  taiBalancesData.forEach((i) => {
    const [account, balance] = i.split(',');

    if (account) {
      taiBalances[account] = BigInt(balance || '0');
    }
  })

  await runner()
    .requiredNetwork(['karura'])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const accs = (await getFile(accountFile)).split("\n") as string[];

      console.log(`Account number: ${accs.length}`);

      let content = "AccountId,Free Balance,Loan Balance,In TaiKSM\n";
      
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

      for (const accountId of accs) {
        if (accountId) {
          promises.push((async () => {
            // lksm balance
            const balance = await apiAt.query.tokens.accounts(accountId, {'Token': 'LKSM'}) as any;
            // lksm in loan position
            const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'loans': {'Token': 'LKSM'}}, accountId) as any;
            // lksm in taiKSM 
            const inTaiKSM = taiBalances[accountId] ? totalLKSMInTaiKSM * taiBalances[accountId] / BigInt(taiKSMIssuance.toString()) : BigInt(0);

            console.log(taiBalances[accountId], inTaiKSM);

            if (balance.free.gt(new BN(0)) || incentives[0].gt(new BN(0)) || inTaiKSM > BigInt(0)) {
              content += accountId + "," + balance.free + "," + incentives[0] + "," + inTaiKSM + "\n";
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

      await createFile(rawBalanceFile, content);

      const end = new Date();
      console.log(`End querying LKSM balance at ${end.toTimeString()}`);
      console.log(`LKSM account number: ${count}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}

export const getLKSMBalance = async (block: number) => {
  const rawBalanceFile = `balances/karura_lksm_${block}_raw.csv`;
  const balanceFile = `balances/karura_lksm_${block}.csv`;

  if (await fileExists(balanceFile)) {
    console.log(`${balanceFile} exists. Skip querying raw balances.`);
    return;
  }

  const excluded: string[] = [];

  // const accountData: {[address: string]: {balance: BN, dex: typeof BN, incentive: typeof BN}} = {}
  const accountData: {[address: string]: any} = {};
  const rawBalances = (await getFile(rawBalanceFile)).split("\n");

  for (const rawBalance of rawBalances) {
    if (rawBalance.includes("AccountId")) continue;

    const [address, balance, incentive, inTai] = rawBalance.split(",");

    if (!address) continue;

    if (!accountData[address]) {
      accountData[address] = {
        balance: new BN(0),
        incentive: new BN(0),
        inTai: new BN(0)
      }
    }

    accountData[address].balance = accountData[address].balance.add(new BN(balance.toString()));
    accountData[address].incentive = accountData[address].incentive.add(new BN(incentive.toString()));
    accountData[address].inTai = accountData[address].inTai.add(new BN(inTai.toString()));
  }

  let content = '';

  for (const address in accountData) {
    if (excluded.includes(address)) continue;

    content += address + "," + accountData[address].balance.add(accountData[address].incentive) + "," + accountData[address].inTai + "\n";
  }

  await createFile(balanceFile, content);
}