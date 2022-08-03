/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'
import * as fs from 'fs';

import { BN } from 'bn.js'
import { fetchEntriesToArray } from '@open-web3/util'
import { encodeAddress } from '@polkadot/util-crypto'
import { formatBalance, formatDecimal, table } from '../log'
import runner from '../runner'


runner()
  .requiredNetwork(['acala'])
  .withApiPromise()
  .atBlock(1548800)
  .run(async ({ apiAt }) => {
    console.log(__dirname + "/../../");
    const accs = await fetchEntriesToArray((startKey) =>
      apiAt.query.system.account.entriesPaged({
        args: [],
        pageSize: 500,
        startKey,
      })
    );
    let fd = fs.openSync(__dirname + "/../../aca-accounts.txt", "w");
    for (const [key, value] of accs) {
      const accountId = encodeAddress(key.slice(-32));
      fs.writeSync(fd, accountId + "\n");
    }
    fs.closeSync(fd);
  });
