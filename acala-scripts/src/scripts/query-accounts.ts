/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import * as fs from 'fs';

import { BN } from 'bn.js'
import { fetchEntriesToArray } from '@open-web3/util'
import { encodeAddress } from '@polkadot/util-crypto'
import { formatBalance, formatDecimal, table } from '../log'
import runner from '../runner'


runner()
  .requiredNetwork(['karura'])
  .withApiPromise()
  .atBlock(2455000)
  .run(async ({ apiAt }) => {
    const accs = await fetchEntriesToArray((startKey) =>
      apiAt.query.system.account.entriesPaged({
        args: [],
        pageSize: 500,
        startKey,
      })
    );
    let fd = fs.openSync(__dirname + "/../../accounts.txt", "w");
    for (const [key, value] of accs) {
      const accountId = encodeAddress(key.slice(-32));
      fs.writeSync(fd, accountId + "\n");
    }
    fs.closeSync(fd);
  });
