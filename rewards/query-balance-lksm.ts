/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import * as fs from 'fs'

/**
 * the user's lksm amount contains:
 * 1. lksm free balance
 * 2. lksm in honzon
 * 3. lksm in taiKSM
 * @param block 
 * @returns 
 */

export const getLKSMRawBalance = async (block: number) => {
  const accountFile = __dirname + `/data/accounts/karura_${block}.txt`;
  const rawBalanceFile = __dirname + `/data/balances/karura_lksm_${block}_raw.csv`;
  const taiBalanceFile = __dirname + `/data/balances/karura_taiksm_${block}.csv`;

  if (fs.existsSync(rawBalanceFile)) {
    console.log(`${rawBalanceFile} exists. Skip querying raw balances.`);
    return;
  }

  const taiBalancesData = fs.readFileSync(taiBalanceFile, {encoding:'utf8', flag:'r'}).split("\n");
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
      const accs = fs.readFileSync(accountFile, {encoding:'utf8', flag:'r'}).split("\n");
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

      const exchangeRate = (BigInt(totalStaking.toString()) * BigInt(10**18)) / (BigInt(totalLKSMIssuance.toString()) + BigInt(totalVoidLKSM.toString()));
      const totalLKSMInTaiKSM = BigInt((position as any).unwrapOrDefault().balances[1].toString()) * BigInt(10**18) / exchangeRate;

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

      const fd = await fs.promises.open(rawBalanceFile, "w");
      await fs.promises.writeFile(fd, content);
      await fd.close();
      const end = new Date();
      console.log(`End querying LKSM balance at ${end.toTimeString()}`);
      console.log(`LKSM account number: ${count}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}

export const getLKSMBalance = async (block: number) => {
  const rawBalanceFile = __dirname + `/data/balances/karura_lksm_${block}_raw.csv`;
  const balanceFile = __dirname + `/data/balances/karura_lksm_${block}.csv`;

  if (fs.existsSync(balanceFile)) {
    console.log(`${balanceFile} exists. Skip querying raw balances.`);
    return;
  }

  const excluded: string[] = [];

  // const accountData: {[address: string]: {balance: BN, dex: typeof BN, incentive: typeof BN}} = {}
  const accountData: {[address: string]: any} = {};
  let incentiveTotal = new BN(0);
  let taiTotal = new BN(0);

  const rawBalances = fs.readFileSync(rawBalanceFile, {encoding:'utf8', flag:'r'}).split("\n");

  for (const rawBalance of rawBalances) {
    if (rawBalance.includes("AccountId")) continue;

    const [address, balance, incentive, inTai] = rawBalance.split(",");

    if (!address) continue;

    incentiveTotal = incentiveTotal.add(new BN(incentive));

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

  const fd = await fs.promises.open(balanceFile, "w");
  for (const address in accountData) {
    if (excluded.includes(address)) continue;

    await fs.promises.writeFile(fd, address + "," + accountData[address].balance.add(accountData[address].incentive) + "," + accountData[address].inTai + "\n");
  }
  await fd.close();
}