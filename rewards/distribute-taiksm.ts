/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types';
import '@acala-network/types/interfaces/types-lookup';
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";

import { BN } from 'bn.js'
import runner from './lib/runner';
import { ethers } from 'ethers';
import { abi } from './merkle-distributor.abi';
import { createFile, fileExists, getFile } from './lib/s3_utils';

const TAIKSM_REWARD_DISTRIBUTOR = "0xf595F4a81B27E5CC1Daca349A69c834f375224F4";
// const TAIKSM_FEE_RECIPIENT = "qbK5taiSvrJy9LW5sVN7qYaQMb22bPfNb15zSixCrUypWuG";
// const TAIKSM_YIELD_RECIPIENT = "qbK5tbSnd1thFaKNgNCEZ9DsFzFHAq7xFJfLWaEm9HQY2eU";

const TAIKSM_FEE_RECIPIENT = "sGgT1bCh5sGBaK5LfzUmDWZbxUnRiqV2QK7oxNA4iixdamM";
const TAIKSM_YIELD_RECIPIENT = "sfyxDFLkQQCx9f7oJiL32725mF7dM5GXGphUSxmC9Zq9Xec";
const BUFFER = new BN("100000000000");

const ONE = new BN(10).pow(new BN(12));
const WEEKLY_TAI_REWARD = new BN("28000").mul(ONE);
// Number of blocks per week: 3600 * 24 * 7 / 12
const WEEKLY_BLOCK = new BN(50400);

export const distributeTaiKsm = async (block: number) => {
    console.log('\n------------------------------------------');
    console.log('*      Distribute taiKSM Rewards          *');
    console.log('------------------------------------------\n');

    const balanceFile = `balances/karura_taiksm_${block}.csv`;
    const distributionFile = `distributions/karura_taiksm_${block}.csv`;
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
            let feeBalance = new BN((await apiAt.query.tokens.accounts(TAIKSM_FEE_RECIPIENT, {'StableAssetPoolToken': 0}) as any).free.toString());
            let yieldBalance = new BN((await apiAt.query.tokens.accounts(TAIKSM_YIELD_RECIPIENT, {'StableAssetPoolToken': 0}) as any).free.toString());
            feeBalance = feeBalance.gt(BUFFER) ? feeBalance.sub(BUFFER) : new BN(0);
            yieldBalance = yieldBalance.gt(BUFFER) ? yieldBalance.sub(BUFFER) : new BN(0);

            console.log(`Fee balance: ${feeBalance.toString()}`);
            console.log(`Yield balance: ${yieldBalance.toString()}`);

            const taiKsmAmount = feeBalance.add(yieldBalance);
            const taiAmount = WEEKLY_TAI_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);

            let content = "AccountId,0x0000000000000000000300000000000000000000,0x0000000000000000000100000000000000000084\n";
            for (const address in accountBalance) {
                if (!address)   continue;
                const taiKam = accountBalance[address].mul(taiKsmAmount).div(balanceTotal);
                const tai = accountBalance[address].mul(taiAmount).div(balanceTotal);
                content += `${address},${taiKam.toString()},${tai.toString()}\n`;
            }
            await createFile(distributionFile, content);

            // TODO Transfer taiKSM to merkle distributor from fee and yield recipients
            // This can be done after fee and yield recipients are updated.
            // For now we need to continue to use multisig
        });
}