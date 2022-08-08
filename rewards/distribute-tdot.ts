/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import * as fs from 'fs'
import runner from './lib/runner';

const TDOT_FEE_RECIPIENT = "23AdbsfY2fNJJW9UMHXmguChS8Di7ij2d7wpQ6CcHQSUv88G";
const TDOT_YIELD_RECIPIENT = "23AdbsgJqvDar8B2Jhv2C2phxBmeQR59nJNhQ8CN6R6iTn4o";
const BUFFER = new BN("100000000000");

export const distributeTaiKsm = async (block: number) => {
    const balanceFile = __dirname + `/data/balances/acala_tdot_${block}.csv`;
    const distributionFile = __dirname + `/data/distributions/acala_tdot_${block}.csv`;
    if (fs.existsSync(distributionFile)) {
        console.log(`${distributionFile} exists. Skip distribution.`);
        return;
    }

    const balances = fs.readFileSync(balanceFile, {encoding:'utf8', flag:'r'}).split("\n");
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

            let fd = await fs.promises.open(distributionFile, "w");
            await fs.promises.writeFile(fd, "AccountId,0x0000000000000000000300000000000000000000\n");
            for (const address in accountBalance) {
                if (!address)   continue;
                const tdot = accountBalance[address].mul(tdotAmount).div(balanceTotal);
                await fs.promises.writeFile(fd, `${address},${tdot.toString()}\n`);
            }
            await fd.close();

            // TODO Transfer tDOT to merkle distributor from fee and yield recipients
        });
}