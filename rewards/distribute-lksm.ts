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

const LKSM_MERKLE_DISTRIBUTOR = "0xff066331be693BE721994CF19905b2DC7475C5c9";

const ONE = new BN(10).pow(new BN(12));
// 75000 TAI / WEEK
const WEEKLY_KAR_REWARD = new BN(75000).mul(ONE);

// Number of blocks per week: 3600 * 24 * 7 / 12
const WEEKLY_BLOCK = new BN(50400);

// 80% rewards will award free lksm(free lksm + in loan)
const FREE_REWARD_RATE = new BN(10).pow(new BN(17)).mul(new BN(8));
// 20% rewards will award lksm in taiKSM 
const IN_TAI_REWARD_RATE = new BN(10).pow(new BN(17)).mul(new BN(2));
// 50% reward will be reserved
const RESERVED_RATE = new BN(10).pow(new BN(17)).mul(new BN(5));

export const distributeLKSM = async (block: number) => {
    const balanceFile = __dirname + `/data/balances/karura_lksm_${block}.csv`;
    const distributionFile = __dirname + `/data/distributions/karura_lksm_${block}.csv`;
    const reservedFile = __dirname + `/data/distributions/karura_lksm_reserved.csv`;
    const claimedAccountsFile = __dirname + `/data/accounts/claimed_lksm_${block}.csv`;

    if (fs.existsSync(distributionFile)) {
        console.log(`${distributionFile} exists. Skip distribution.`);
        return;
    }

    const balances = fs.readFileSync(balanceFile, {encoding:'utf8', flag:'r'}).split("\n");
    const claimedAccounts: string[] = fs.readFileSync(claimedAccountsFile, {encoding:'utf8', flag:'r'}).split('\n');

    const reserved: Record<string, any> = {};

    if (fs.existsSync(reservedFile)) {
        const reservedFileContent =  fs.readFileSync(reservedFile, {encoding:'utf8', flag:'r'}).split("\n");

        for (const line of reservedFileContent) {
            const [address, amount] = line.split(',');

            reserved[address] = new BN(amount);
        }
    }

    let balanceTotal = new BN(0);
    let balanceInTaiTotal = new BN(0);
    let accountBalance: {[address: string]: any} = {};

    for (const balanceLine of balances) {
        const [address, free, inTai] = balanceLine.split(",");
        if (!accountBalance[address]) {
            accountBalance[address] = {};
            accountBalance[address].free = new BN(0);
            accountBalance[address].inTai = new BN(0);
        }
        accountBalance[address].free = accountBalance[address].free.add(new BN(free));
        accountBalance[address].inTai = accountBalance[address].inTai.add(new BN(inTai));
        balanceTotal = balanceTotal.add(new BN(free));
        balanceInTaiTotal = balanceInTaiTotal.add(new BN(inTai));
    }

    console.log(balanceTotal.toString(), balanceInTaiTotal.toString());

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
            const block = 3000000;
            const totalReward = WEEKLY_KAR_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);
            const totalFreeRewardAmount = totalReward.mul(FREE_REWARD_RATE).div(new BN(10).pow(new BN(8)));
            const totalInTaiRewardAmount = totalReward.mul(IN_TAI_REWARD_RATE).div(new BN(10).pow(new BN(8)));
            const incressRewards: Record<string, any> = {};

            // calculate rewards and reserved
            for (const address in accountBalance) {
                incressRewards[address] = accountBalance[address].free.mul(totalFreeRewardAmount).div(balanceTotal);
                incressRewards[address] = incressRewards[address].add(accountBalance[address].inTai.mul(totalInTaiRewardAmount).div(balanceInTaiTotal));
            }

            // split rewards to reserved
            for (const address in incressRewards) {
                if (!reserved[address]) {
                    reserved[address] = new BN(0);
                }

                reserved[address] = reserved[address].add(incressRewards[address].mul(RESERVED_RATE).div(new BN(10).pow(new BN(18))));
            }

            // redistribute reserved rewards
            let redistributePool = new BN(0);
            const redistributeAccounts = Object.keys(reserved).filter((i) => claimedAccounts.find(j => i === j));

            for (const address of claimedAccounts) {
                if (reserved[address]) {
                    reserved[address] = new BN(0);
                    redistributePool = redistributePool.add(reserved[address]);
                }
            }

            for (const address of redistributeAccounts) {
                if (!reserved[address]) {
                    reserved[address] = new BN(0);
                }

                reserved[address] = reserved[address].add(redistributePool.div(new BN(redistributeAccounts.length)));
            }


            // write reserved records to file
            let reservedFd = await fs.promises.open(reservedFile, 'w');
            for (const record of Object.entries(reserved)) {
                await fs.promises.writeFile(reservedFd, `${record[0]},${record[1].toString() || '0'}\n`)
            }

            let fd = await fs.promises.open(distributionFile, "w");
            await fs.promises.writeFile(fd, "0x0000000000000000000100000000000000000080\n");
            for (const address in accountBalance) {
                if (!address)   continue;
                const kar = incressRewards[address];

                await fs.promises.writeFile(fd, `${address},${incressRewards[address].toString()}\n`);
                await fs.promises.writeFile(fd, `reserved-${address},${reserved[address].toString()}\n`);
            }
            await fd.close();
        });
}