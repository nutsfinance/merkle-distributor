/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import '@acala-network/types/interfaces/types-lookup'

import { BN } from 'bn.js'
import * as fs from 'fs'
import runner from './lib/runner';

const THREEUSD_FEE_RECIPIENT = "qbK5tbM7hvEZwXZFhC8Y5Kfg2YTq4fjHGc1XyRdYBqxo92z";
const THREEUSD_YIELD_RECIPIENT = "Karura: qbK5tagX35AtEeBBWeXEX1FJSoNbVEdC2RzaxPkEmTSuB6Q";
const BUFFER = new BN("100000000000");

export const distributeTaiKsm = async (block: number) => {
    const balanceFile = __dirname + `/data/balances/3usd_${block}.csv`;
    const distributionFile = __dirname + `/data/distributions/3usd_${block}.csv`;
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
        .requiredNetwork(['karura'])
        .withApiPromise()
        .atBlock(block)
        .run(async ({ apiAt }) => {
            const feeBalance = new BN((await apiAt.query.tokens.accounts(THREEUSD_FEE_RECIPIENT, {'StableAssetPoolToken': 1}) as any).free.toString());
            const yieldBalance = new BN((await apiAt.query.tokens.accounts(THREEUSD_YIELD_RECIPIENT, {'StableAssetPoolToken': 1}) as any).free.toString());

            console.log(`Fee balance: ${feeBalance.sub(BUFFER).toString()}`);
            console.log(`Yield balance: ${yieldBalance.sub(BUFFER).toString()}`);

            const taiKsmAmount = feeBalance.add(yieldBalance).sub(BUFFER).sub(BUFFER);
            // 4000 TAI per day
            const taiAmount = new BN("4000").mul(new BN("1000000000000")).mul(new BN(7));

            let fd = await fs.promises.open(distributionFile, "w");
            await fs.promises.writeFile(fd, "AccountId,0x0000000000000000000300000000000000000000,0x0000000000000000000100000000000000000084\n");
            for (const address in accountBalance) {
                if (!address)   continue;
                const taiKam = accountBalance[address].mul(taiKsmAmount).div(balanceTotal);
                const tai = accountBalance[address].mul(taiAmount).div(balanceTotal);
                await fs.promises.writeFile(fd, `${address},${taiKam.toString()},${tai.toString()}\n`);
            }
            await fd.close();
        });
}