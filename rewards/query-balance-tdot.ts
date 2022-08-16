/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner'
import { createFile, fileExists, getFile } from './lib/aws_utils'

/**
 * @dev tDOT balance contains two parts:
 * 1. Free tDOT in the wallet
 * 2. tDOT in loan
 */
export const getTdotRawBalance = async (block: number) => {
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
      const start = new Date();
      console.log(`Start querying tDOT balance at ${start.toTimeString()}`);
      
      for (const accountId of accs) {
        if (accountId) {
          promises.push((async () => {
            // tDOT balance
            const balance = await apiAt.query.tokens.accounts(accountId, {'StableAssetPoolToken': 0}) as any;
            // tDOT in loan position
            const incentives = await apiAt.query.rewards.sharesAndWithdrawnRewards({'Loans': {'StableAssetPoolToken': 0}}, accountId) as any;
            if (balance.free.gt(new BN(0)) || incentives[0].gt(new BN(0))) {
              content += accountId + "," + balance.free + "," + incentives[0] + "\n";
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
      await createFile(rawBalanceFile, content);

      const end = new Date();
      console.log(`End querying taiKSM balance at ${end.toTimeString()}`);
      console.log(`taiKSM account number: ${count}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
    });
}

export const getTdotBalance = async (block: number) => {
  const rawBalanceFile = `balances/acala_tdot_${block}_raw.csv`;
  const balanceFile = `balances/acala_tdot_${block}.csv`;
  if (await fileExists(balanceFile)) {
    console.log(`${balanceFile} exists. Skip querying raw balances.`);
    return;
  }

  const excluded = ['5EYCAe5fiQJsnqbdsqzNnWhEAGZkyK8uqahrmhwVvcuNRhpd', '5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj'];
  // const accountData: {[address: string]: {balance: BN, dex: typeof BN, incentive: typeof BN}} = {}
  const accountData: {[address: string]: any} = {};
  let incentiveTotal = new BN(0);

  const rawBalances = (await getFile(rawBalanceFile)).split("\n");
  for (const rawBalance of rawBalances) {
    if (rawBalance.includes("AccountId")) continue;

    const [address, balance, incentive] = rawBalance.split(",");
    if (!address) continue;
    incentiveTotal = incentiveTotal.add(new BN(incentive));

    if (!accountData[address]) {
      accountData[address] = {
        balance: new BN(0),
        dex: new BN(0),
        incentive: new BN(0)
      }
    }
    accountData[address].balance = accountData[address].balance.add(new BN(balance.toString()));
    accountData[address].incentive = accountData[address].incentive.add(new BN(incentive.toString()));
  }

  const incentiveBalance = accountData['5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj'].balance;
  console.log(`Incentive balance: ${incentiveBalance.toString()}`);
  console.log(`Incentive total: ${incentiveTotal.toString()}`);

  let content = "";
  for (const address in accountData) {
    if (excluded.includes(address)) continue;
    const userBalance = accountData[address].balance;
    const userIncentive = accountData[address].incentive.mul(incentiveBalance).div(incentiveTotal);
    const total = userBalance.add(userIncentive);
    content += address + "," + total.toString() + "\n";
  }
  
  await createFile(balanceFile, content);
}