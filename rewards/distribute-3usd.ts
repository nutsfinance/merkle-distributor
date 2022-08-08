/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types';
import '@acala-network/types/interfaces/types-lookup';
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";

import { BN } from 'bn.js'
import * as fs from 'fs'
import runner from './lib/runner';
import { ethers } from 'ethers';
import { abi } from './merkle-distributor.abi';

const THREEUSD_MERKLE_DISTRIBUTOR = "0xff066331be693BE721994CF19905b2DC7475C5c9";
const THREEUSD_FEE_RECIPIENT = "qbK5tbM7hvEZwXZFhC8Y5Kfg2YTq4fjHGc1XyRdYBqxo92z";
const THREEUSD_YIELD_RECIPIENT = "Karura: qbK5tagX35AtEeBBWeXEX1FJSoNbVEdC2RzaxPkEmTSuB6Q";
const BUFFER = new BN("100000000000");

const ONE = new BN(10).pow(new BN(12));
// 12000 TAI
const WEEKLY_TAI_REWARD = new BN(12000).mul(ONE);
// 30 taiKSM
const WEEKLY_TAIKSM_REWARD = new BN(30).mul(ONE);
// 250 LKSM
const WEEKLY_LKSM_REWARD = new BN(250).mul(ONE);
// 2000 KAR
const WEEKLY_KAR_REWARD = new BN(2000).mul(ONE);

// Number of blocks per week: 3600 * 24 * 7 / 12
const WEEKLY_BLOCK = new BN(50400);

export const distributeTaiKsm = async (block: number) => {
    const balanceFile = __dirname + `/data/balances/karura_3usd_${block}.csv`;
    const distributionFile = __dirname + `/data/distributions/karura_3usd_${block}.csv`;
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

    const provider = new Provider({
        provider: new WsProvider("wss://karura.api.onfinality.io/public-ws") 
    });
    await provider.api.isReady;
    const merkleDistributor = new ethers.Contract(THREEUSD_MERKLE_DISTRIBUTOR, abi, provider);
    const currentCycle = (await merkleDistributor.currentCycle()).toNumber();
    const currentEndBlock = (await merkleDistributor.lastPublishEndBlock()).toNumber();
    console.log(`Current cycle: ${currentCycle}, current end block: ${currentEndBlock}`);
    if (block < currentEndBlock) {
        console.log(`Block behind current end block. Skip distribution.`);
        return;
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

            const threeUsdAmount = feeBalance.add(yieldBalance).sub(BUFFER).sub(BUFFER);
            const taiAmount = WEEKLY_TAI_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);
            const taiKsmAmount = WEEKLY_TAIKSM_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);
            const lksmAmount = WEEKLY_LKSM_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);
            const karAmount = WEEKLY_KAR_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);

            let fd = await fs.promises.open(distributionFile, "w");
            await fs.promises.writeFile(fd, "AccountId,0x0000000000000000000300000000000000000001,0x0000000000000000000100000000000000000084,0x0000000000000000000300000000000000000000,0x0000000000000000000100000000000000000083,0x0000000000000000000100000000000000000080\n");
            for (const address in accountBalance) {
                if (!address)   continue;
                const threeUsd = accountBalance[address].mul(threeUsdAmount).div(balanceTotal);
                const tai = accountBalance[address].mul(taiAmount).div(balanceTotal);
                const taiKsm = accountBalance[address].mul(taiKsmAmount).div(balanceTotal);
                const lksm = accountBalance[address].mul(lksmAmount).div(balanceTotal);
                const kar = accountBalance[address].mul(karAmount).div(balanceTotal);
                await fs.promises.writeFile(fd, `${address},${threeUsd.toString()},${tai.toString()},${taiKsm.toString()},${lksm.toString()},${kar.toString()}\n`);
            }
            await fd.close();

            // TODO Transfer 3USD to merkle distributor from fee and yield recipients
        });
}