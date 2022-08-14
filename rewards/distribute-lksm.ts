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
import { createFile, fileExists, getFile } from './lib/s3_utils';

const LKSM_MERKLE_DISTRIBUTOR = "0xff066331be693BE721994CF19905b2DC7475C5c9";

const ONE = new BN(10).pow(new BN(12));
// 75000 TAI / WEEK
const WEEKLY_KAR_REWARD = new BN(7100).mul(ONE);

// Number of blocks per week: 3600 * 24 * 7 / 12
const WEEKLY_BLOCK = new BN(50400);

// 50% reward will be reserved
const RESERVED_RATE = ONE.mul(new BN(5)).div(new BN(10));
const CLAIMABLE_RATE = ONE.mul(new BN(5)).div(new BN(10));

export const distributeLKSM = async (block: number) => {
    const balanceFile = `balances/karura_lksm_${block}.csv`;
    const distributionFile = `distributions/karura_lksm_${block}.csv`;
    const reservedFile = `distributions/karura_lksm_reserved.csv`;
    const claimedAccountsFile = `accounts/claimed_lksm_${block}.csv`;

    if (await fileExists(distributionFile)) {
        console.log(`${distributionFile} exists. Skip distribution.`);
        return;
    }

    const balances = (await getFile(balanceFile)).split("\n") as string[];
    const claimedAccounts: string[] = (await getFile(claimedAccountsFile)).split('\n') as string[];

    const reserved: Record<string, any> = {};

    // read resered configs in local file
    if (await fileExists(reservedFile)) {
        const reservedFileContent =  (await getFile(reservedFile)).split("\n") as string;

        for (const line of reservedFileContent) {
            const [address, amount] = line.split(',');

            reserved[address] = new BN(amount);
        }
    }

    let balanceTotal = new BN(0);
    let accountBalance: {[address: string]: any} = {};

    for (const balanceLine of balances) {
        const [address, free, inTai] = balanceLine.split(",");
        if (!accountBalance[address]) {
            accountBalance[address] = {
                free: new BN(0),
                inTai: new BN(0)
            };
        }
        accountBalance[address].free = accountBalance[address].free.add(new BN(free));
        accountBalance[address].inTai = accountBalance[address].inTai.add(new BN(inTai));
        balanceTotal = balanceTotal.add(new BN(free)).add(new BN(inTai));
    }

    const provider = new Provider({ provider: new WsProvider("wss://karura.api.onfinality.io/public-ws") });

    await provider.api.isReady;

    const merkleDistributor = new ethers.Contract(LKSM_MERKLE_DISTRIBUTOR, abi, provider);
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
            // TODO: mock block
            const totalReward = WEEKLY_KAR_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);
            const incressRewards: Record<string, any> = {};

            // calculate rewards and reserved
            for (const address in accountBalance) {
                incressRewards[address] = (accountBalance[address].free).mul(totalReward).div(balanceTotal).mul(CLAIMABLE_RATE).div(ONE);
            }

            // split rewards to reserved
            for (const address in incressRewards) {
                if (!reserved[address]) {
                    reserved[address] = new BN(0);
                }
                const total = accountBalance[address].free.add(accountBalance[address].inTai);

                reserved[address] = reserved[address].add(total.mul(totalReward).div(balanceTotal).mul(RESERVED_RATE).div(ONE));
            }

            // redistribute reserved rewards
            let redistributePool = new BN(0);
            const noClaimedAccounts = Object.keys(reserved).filter((i) => !claimedAccounts.includes(i));

            for (const address of claimedAccounts) {
                if (reserved[address]) {
                    // set reserved record to zero
                    reserved[address] = new BN(0);
                    // accumalate redistribute amount
                    redistributePool = redistributePool.add(reserved[address]);
                }
            }

            for (const address of noClaimedAccounts) {
                if (!reserved[address]) {
                    reserved[address] = new BN(0);
                }

                reserved[address] = reserved[address].add(redistributePool.div(new BN(noClaimedAccounts.length)));
            }


            // write reserved records to file
            let reservedContent = '';

            for (const record of Object.entries(reserved)) {
                reservedContent += `${record[0]},${record[1].toString() || '0'}\n`;
            }

            await createFile(reservedFile, reservedContent);

            // write reward records to file

            let fd = await fs.promises.open(distributionFile, "w");
            let distributionContent = 'AccountId, 0x0000000000000000000100000000000000000080\n';

            for (const address in accountBalance) {
                if (!address)   continue;
                distributionContent += `${address},${incressRewards[address].toString()}\n`;
                distributionContent += `reserved-${address},${reserved[address].toString()}\n`;
            }

            await createFile(distributionFile, distributionContent);
        });
}