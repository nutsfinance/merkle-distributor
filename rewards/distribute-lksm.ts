/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types';
import '@acala-network/types/interfaces/types-lookup';
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";

import { BN } from 'bn.js'
import runner from './lib/runner';
import { ethers } from 'ethers';
import { abi } from './merkle-distributor.abi';
import { createFile, fileExists, getFile } from './lib/aws_utils';

const LKSM_MERKLE_DISTRIBUTOR = "0xff066331be693BE721994CF19905b2DC7475C5c9";
const KAR = "0x0000000000000000000100000000000000000080";

const ONE = new BN(10).pow(new BN(12));
// 7100 KAR / WEEK
const WEEKLY_KAR_REWARD = new BN(7100).mul(ONE);

// Number of blocks per week: 3600 * 24 * 7 / 12
const WEEKLY_BLOCK = new BN(50400);

// 50% reward will be reserved
const RESERVED_RATE = ONE.mul(new BN(5)).div(new BN(10));
const CLAIMABLE_RATE = ONE.mul(new BN(5)).div(new BN(10));

export const distributeLKSM = async (block: number) => {
    console.log('\n------------------------------------------');
    console.log('*      Distribute LKSM Rewards          *');
    console.log('------------------------------------------\n');

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

    const balanceFile = `balances/karura_lksm_${block}.csv`;
    const distributionFile = `distributions/karura_lksm_${block}.csv`;
    const merkleFile = `merkles/karura_lksm_${currentCycle}.json`;
    const claimerFile = `accounts/karura_lksm_kar_claimer_${block}.csv`;

    if (await fileExists(distributionFile)) {
        console.log(`${distributionFile} exists. Skip distribution.`);
        return;
    }

    // Step 1: Load current reserve from current merkle
    const balances = (await getFile(balanceFile)).split("\n") as string[];
    const claimers: string[] = (await getFile(claimerFile)).split('\n') as string[];
    const reserved: Record<string, any> = {};

    const currentMerkle = await getFile(merkleFile);
    for (const address in currentMerkle.claims) {
        const index = (currentMerkle.claims as any)[address].tokens.indexOf(KAR);
        if (index < 0)  continue;
        reserved[address] = new BN((currentMerkle.claims as any)[address].reserveAmounts[index]);
    }

    // Step 2: Load total LKSM balances
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
    
    await runner()
        .requiredNetwork(['karura'])
        .withApiPromise()
        .atBlock(block)
        .run(async ({ apiAt }) => {
            // TODO: mock block
            const totalReward = WEEKLY_KAR_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);
            const incressRewards: Record<string, any> = {};

            // Step 3: Split rewards to all
            for (const address in accountBalance) {
                incressRewards[address] = (accountBalance[address].free).mul(totalReward).div(balanceTotal).mul(CLAIMABLE_RATE).div(ONE);
            }

            // Step 4: Split rewards to reserved
            for (const address in incressRewards) {
                if (!reserved[address]) {
                    reserved[address] = new BN(0);
                }
                reserved[address] = reserved[address].add(accountBalance[address].free.mul(totalReward).div(balanceTotal).mul(RESERVED_RATE).div(ONE));
            }

            // Step 5: Redistribute reserved rewards
            let redistributePool = new BN(0);
            const nonClaimers = Object.keys(reserved).filter((i) => !claimers.includes(i));

            for (const address of claimers) {
                if (reserved[address]) {
                    // set reserved record to zero
                    reserved[address] = new BN(0);
                    // accumalate redistribute amount
                    redistributePool = redistributePool.add(reserved[address]);
                }
            }

            for (const address of nonClaimers) {
                if (!reserved[address]) {
                    reserved[address] = new BN(0);
                }

                reserved[address] = reserved[address].add(redistributePool.div(new BN(nonClaimers.length)));
            }

            // Step 6: Write reward records to file
            let content = 'AccountId,0x0000000000000000000100000000000000000080,reserve-0x0000000000000000000100000000000000000080\n';

            for (const address in accountBalance) {
                if (!address)   continue;
                content += `${address},${incressRewards[address].toString()},${reserved[address].toString()}\n`;
            }

            await createFile(distributionFile, content);
        });
}