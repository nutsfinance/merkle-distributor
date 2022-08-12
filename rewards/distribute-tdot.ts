/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import runner from './lib/runner';
import { createFile, fileExists, getFile } from './lib/s3_utils';

// const TDOT_FEE_RECIPIENT = "23AdbsfY2fNJJW9UMHXmguChS8Di7ij2d7wpQ6CcHQSUv88G";
// const TDOT_YIELD_RECIPIENT = "23AdbsgJqvDar8B2Jhv2C2phxBmeQR59nJNhQ8CN6R6iTn4o";

const TDOT_FEE_RECIPIENT = "24qzxzg1TfciVh819jkXX23QtvmNY66XQHRP3KekzRuwC68t";
const TDOT_YIELD_RECIPIENT = "25FJUCL9Wz9fGGU3cNUNnpdsNjXhjiLJu9vxhpFN7rkoi3zE";
const BUFFER = new BN("100000000000");

export const distributeTaiKsm = async (block: number) => {
    console.log('\n------------------------------------------');
    console.log('*      Distribute tDOT Rewards            *');
    console.log('------------------------------------------\n');

    const balanceFile = `balances/acala_tdot_${block}.csv`;
    const distributionFile = `distributions/acala_tdot_${block}.csv`;
    if (await fileExists(distributionFile)) {
        console.log(`${distributionFile} exists. Skip distribution.`);
        return;
    }

    const balances = (await getFile(balanceFile)).split("\n");
    let balanceTotal = new BN(0);
    let accountBalance: {[address: string]: any} = {};
    for (const balanceLine of balances) {
        const [address, balance] = balanceLine.split(",");
        if (!accountBalance[address])   accountBalance[address] = new BN(0);
        accountBalance[address] = accountBalance[address].add(new BN(balance));

        balanceTotal = balanceTotal.add(new BN(balance));
    }
    
    await runner()
        .requiredNetwork(['acala'])
        .withApiPromise()
        .atBlock(block)
        .run(async ({ apiAt }) => {
            const feeBalance = new BN((await apiAt.query.tokens.accounts(TDOT_FEE_RECIPIENT, {'StableAssetPoolToken': 0}) as any).free.toString());
            const yieldBalance = new BN((await apiAt.query.tokens.accounts(TDOT_YIELD_RECIPIENT, {'StableAssetPoolToken': 0}) as any).free.toString());

            console.log(`Fee balance: ${feeBalance.sub(BUFFER).toString()}`);
            console.log(`Yield balance: ${yieldBalance.sub(BUFFER).toString()}`);

            const tdotAmount = feeBalance.add(yieldBalance).sub(BUFFER).sub(BUFFER);

            let content = "AccountId,0x0000000000000000000300000000000000000000\n";
            for (const address in accountBalance) {
                if (!address)   continue;
                const tdot = accountBalance[address].mul(tdotAmount).div(balanceTotal);
                content += `${address},${tdot.toString()}\n`;
            }
            await createFile(distributionFile, content);

            // TODO Transfer tDOT to merkle distributor from fee and yield recipients
        });
}