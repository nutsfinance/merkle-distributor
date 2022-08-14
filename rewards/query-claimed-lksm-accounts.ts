/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import * as fs from 'fs'
import { request, gql } from 'graphql-request'
import { encodeAddress } from '@polkadot/util-crypto';
import { createFile, fileExists, getFile } from './lib/s3_utils';

/**
 * the user's lksm amount contains:
 * 1. lksm free balance
 * 2. lksm in honzon
 * 3. lksm in taiKSM
 * @param block 
 * @returns 
 */

const ENDPOINT = 'https://api.subquery.network/sq/nutsfinance/taiga-rewards';
const REWARD_TOKEN_ADDRESS = '0x0000000000000000000100000000000000000080';

async function queryClaimedAccounts (last = 0, current: number) {
  const query = async (start: number, pageSize = 99) => {
    const querySchema = gql`
    query {
      blocks (first: ${pageSize},offset:${start} filter:{and:[{id:{lessThan:"${current}"}},{id:{greaterThan:"${last}"}}]}) {
        nodes {
          claimTxs {
            nodes {
              accountId
              claims {
                nodes {
                  token
                }
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
        const temp: string[] = [];

        item.claimTxs.nodes.forEach((tx: any) => {
          const account = tx.accountId;

          const tokens = tx.claims.nodes.map((i: any) => i.token) as string[];

          if (tokens.includes(REWARD_TOKEN_ADDRESS)) {
            temp.push(encodeAddress(account, 8));
          }
        });

        return temp;
      }).flat()
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
  const accountFile = `accounts/karura_claimed_lksm_${block}.csv`;
  const claimedLKSMHelper = `accounts/karura_claimed_lksm_helper.json`;
  const start = new Date();

  if (await fileExists(accountFile)) {
    console.log(`${accountFile} exists. Skip querying raw balances.`);
    return;
  }

  // load last records
  let lastChecked = 0;

  if (await fileExists(claimedLKSMHelper)) {
    const data = JSON.stringify(await getFile(claimedLKSMHelper)) as any;

    lastChecked = Number(data?.lastChecked) || 0;
  }


  const accounts = await queryClaimedAccounts(lastChecked, block);

  // update claimed lksm helper
  createFile(claimedLKSMHelper, JSON.stringify({ lastChecked: block }));

  const fd = await fs.promises.open(accountFile, 'w');
  let content = '';

  for (let account of accounts) {
    content += `${account}\n`;
  }

  await createFile(accountFile, content);

  const end = new Date();
  console.log(`End querying LKSM claimed accounts at ${end.toTimeString()}`);
  console.log(`LKSM account number: ${accounts.length}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
}
