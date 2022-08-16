/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'
import { fetchEntriesToArray } from '@open-web3/util'
import { encodeAddress } from '@polkadot/util-crypto'
import runner from './lib/runner'
import { Networks } from './lib/networks';
import { createFile, fileExists } from './lib/aws_utils';

export const getAccounts = async (network: Networks, block: number) => {
  console.log('\n------------------------------------------');
  console.log('*             Query Accounts             *');
  console.log('------------------------------------------\n');

  const fileName = `accounts/${network}_${block}.csv`;
  if (await fileExists(fileName))  {
    console.log(`${fileName} exists. Skip querying accounts.`);
    return;
  }

  await runner()
    .requiredNetwork([network])
    .withApiPromise()
    .atBlock(block)
    .run(async ({ apiAt }) => {
      const start = new Date();
      console.log(`Start querying accounts at ${start.toTimeString()}`);
      const accs = await fetchEntriesToArray((startKey) =>
        apiAt.query.system.account.entriesPaged({
          args: [],
          pageSize: 500,
          startKey,
        })
      );
      
      let data = "";
      for (const [key, value] of accs) {
        const accountId = encodeAddress(key.slice(-32));
        data += accountId + "\n";
      }
      await createFile(fileName, data);
      const end = new Date();
      console.log(`End querying accounts at ${end.toTimeString()}`);
      console.log(`Account number: ${accs.length}, duration: ${(end.getTime() - start.getTime())/ 1000}s`);
    });
};