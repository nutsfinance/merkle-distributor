/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import * as fs from 'fs'
import { request, gql } from 'graphql-request'
import { encodeAddress } from '@polkadot/util-crypto';

/**
 * the user's lksm amount contains:
 * 1. lksm free balance
 * 2. lksm in honzon
 * 3. lksm in taiKSM
 * @param block 
 * @returns 
 */

const ENDPOINT = 'https://api.subquery.network/sq/nutsfinance/taiga-rewards';

async function queryClaimedAccounts (last = 0, current: number) {
  const query = async (start: number, pageSize = 99) => {
    const querySchema = gql`
    query {
      blocks (first: ${pageSize},offset:${start} filter:{and:[{id:{lessThan:"${current}"}},{id:{greaterThan:"${last}"}}]}) {
        nodes {
          id
          claimTxs {
            nodes {
              account {
                id
              }
            }
          }
        }
        pageInfo{
          hasNextPage 
        }
      }
    }
    `
    const result = await request(ENDPOINT, querySchema);

    return {
      hasNextPage: result.blocks.pageInfo.hasNextPage,
      accounts: result.blocks.nodes.map((item: any) => {
        return encodeAddress(item.claimTxs.nodes[0].account.id, 8)
      })
    }
  };
  const pageSize = 99;
  let start = 0;
  let flag = true;
  let accounts: string[] = [];

  while(flag) {
    const result = await query(start, pageSize);

    accounts = [...accounts, ...result.accounts];
    flag = result.hasNextPage;
    start += pageSize + 1;
  }

  accounts = Array.from(new Set(accounts));

  return accounts;
}

export const getClaimedLKSMAccounts = async (block: number) => {
  const accountFile = __dirname + `/data/accounts/karura_claimed_lksm_${block}.csv`;
  const claimedRecord = __dirname + `/data/accounts/karura_claimed_lksm_record.json`;
  const start = new Date();

  if (fs.existsSync(accountFile)) {
    console.log(`${accountFile} exists. Skip querying raw balances.`);
    return;
  }

  // load last records
  let lastChecked = 0;

  if (fs.existsSync(claimedRecord)) {
    const data = JSON.stringify(fs.readFileSync(claimedRecord, {encoding:'utf8', flag: 'r'})) as any;

    lastChecked = Number(data?.lastChecked) || 0;
  }


  const accounts = await queryClaimedAccounts(lastChecked, block);

  const record = await fs.promises.open(claimedRecord, 'w');
  await fs.promises.writeFile(record, JSON.stringify({ lastChecked: block }));
  await record.close();
  const fd = await fs.promises.open(accountFile, 'w');

  for (let account of accounts) {
    await fs.promises.writeFile(fd, `${account}\n`);
    await fd.close();
  }

  const end = new Date();
  console.log(`End querying LKSM claimed accounts at ${end.toTimeString()}`);
  console.log(`LKSM account number: ${accounts.length}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
}
