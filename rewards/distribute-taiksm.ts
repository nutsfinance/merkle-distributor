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

const TAIKSM_REWARD_DISTRIBUTOR = "0xf595F4a81B27E5CC1Daca349A69c834f375224F4";
const TAIKSM_FEE_RECIPIENT = "qbK5taiSvrJy9LW5sVN7qYaQMb22bPfNb15zSixCrUypWuG";
const TAIKSM_YIELD_RECIPIENT = "qbK5tbSnd1thFaKNgNCEZ9DsFzFHAq7xFJfLWaEm9HQY2eU";
const BUFFER = new BN("100000000000");

const ONE = new BN(10).pow(new BN(12));
const WEEKLY_TAI_REWARD = new BN("28000").mul(ONE);
// Number of blocks per week: 3600 * 24 * 7 / 12
const WEEKLY_BLOCK = new BN(50400);

export const distributeTaiKsm = async (block: number) => {
    const balanceFile = __dirname + `/data/balances/karura_taiksm_${block}.csv`;
    const distributionFile = __dirname + `/data/distributions/karura_taiksm_${block}.csv`;
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
    const merkleDistributor = new ethers.Contract(TAIKSM_REWARD_DISTRIBUTOR, abi, provider);
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
            const feeBalance = new BN((await apiAt.query.tokens.accounts(TAIKSM_FEE_RECIPIENT, {'StableAssetPoolToken': 0}) as any).free.toString());
            const yieldBalance = new BN((await apiAt.query.tokens.accounts(TAIKSM_YIELD_RECIPIENT, {'StableAssetPoolToken': 0}) as any).free.toString());

            console.log(`Fee balance: ${feeBalance.sub(BUFFER).toString()}`);
            console.log(`Yield balance: ${yieldBalance.sub(BUFFER).toString()}`);

            const taiKsmAmount = feeBalance.add(yieldBalance).sub(BUFFER).sub(BUFFER);
            const taiAmount = WEEKLY_TAI_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);

            let fd = await fs.promises.open(distributionFile, "w");
            await fs.promises.writeFile(fd, "AccountId,0x0000000000000000000300000000000000000000,0x0000000000000000000100000000000000000084\n");
            for (const address in accountBalance) {
                if (!address)   continue;
                const taiKam = accountBalance[address].mul(taiKsmAmount).div(balanceTotal);
                const tai = accountBalance[address].mul(taiAmount).div(balanceTotal);
                await fs.promises.writeFile(fd, `${address},${taiKam.toString()},${tai.toString()}\n`);
            }
            await fd.close();

            // TODO Transfer taiKSM to merkle distributor from fee and yield recipients
        });
}