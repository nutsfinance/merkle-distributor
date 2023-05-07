/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'

import { request, gql } from 'graphql-request'
import { encodeAddress } from '@polkadot/util-crypto';
import { createFile, fileExists, getFile } from './lib/aws_utils';
import { CONFIG } from './config';

const ENDPOINT = 'https://api.subquery.network/sq/nutsfinance/taiga-rewards';
const KAR = '0x0000000000000000000100000000000000000080';

async function queryClaimedAccounts (asset: string, block: number) {
  const distributor = (CONFIG[asset].merkleDistributor as string).toLowerCase();
  const query = async (start: number, pageSize = 999) => {
    const querySchema = gql`
    query {
      blocks (first: ${pageSize},offset:${start} filter:{id:{lessThanOrEqualTo:"${block}"}}) {
        nodes {
          claimTxs (filter: {distributorId:{equalTo:"${distributor}"}}) {
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

          if (tokens.includes(KAR)) {
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
    start += pageSize;
  }

  accounts = Array.from(new Set(accounts));

  return accounts;
}

export const getKarClaimers = async (asset: string, block: number) => {
  console.log('\n------------------------------------------');
  console.log('*          Query KAR Claimers             *');
  console.log('------------------------------------------\n');
  const claimerFile = `accounts/karura_${asset}_kar_claimer_${block}.csv`;
  const start = new Date();

  if (await fileExists(claimerFile)) {
    console.log(`${claimerFile} exists. Skip querying raw balances.`);
    return;
  }

  console.log(`Start querying KAR claimers for ${asset} at ${start.toTimeString()}`);
  const accounts = await queryClaimedAccounts(asset, block);

  let content = '';

  for (let account of accounts) {
    content += `${account}\n`;
  }

  await createFile(claimerFile, content);

  const end = new Date();
  console.log(`End querying KAR claimers for ${asset} at ${end.toTimeString()}`);
  console.log(`KAR claimer number: ${accounts.length}, duration: ${(end.getTime() - start.getTime()) / 1000}s`);
}
