/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types';
import { WsProvider } from "@polkadot/api";
import { BodhiProvider } from "@acala-network/bodhi";
import * as _ from "lodash";

import { BN } from 'bn.js'
import runner from './lib/runner';
import { ethers } from 'ethers';
import { merkletDistributorAbi } from './merkle-distributor.abi';
import { createFile, fileExists, getFile, publishMessage } from './lib/aws_utils';
import { CONFIG, PROTOCOL_ADDRESS } from './config';

const TAIKSM_FEE_RECIPIENT = "qbK5taeJoMcwJoK3hZ7W8y2KkGu1iDRUvjrg9xQMsUKrrv7";
const BUFFER = new BN("100000000000");

const ONE = new BN(10).pow(new BN(12));
const WEEKLY_TAI_REWARD = new BN("0").mul(ONE);
// Number of blocks per week: 3600 * 24 * 7 / 12
const WEEKLY_BLOCK = new BN(50400);

const unique = (array: any[]) => {
    return _.uniq(array).length == array.length;
}

export const distributeTaiKsm = async (block: number) => {
    console.log('\n------------------------------------------');
    console.log('*      Distribute taiKSM Rewards          *');
    console.log('------------------------------------------\n');

    const provider = new BodhiProvider({
        provider: new WsProvider("wss://karura-rpc-3.aca-api.network/ws") 
    });
    await provider.isReady();
    const merkleDistributor = new ethers.Contract(CONFIG["taiksm"].merkleDistributor, merkletDistributorAbi, provider);
    const currentCycle = (await merkleDistributor.currentCycle()).toNumber();
    const currentEndBlock = (await merkleDistributor.lastPublishEndBlock()).toNumber();
    console.log(`Current cycle: ${currentCycle}, current end block: ${currentEndBlock}`);
    if (block < currentEndBlock) {
        console.log(`Block behind current end block. Skip distribution.`);
        return;
    }

    const balanceFile = `balances/karura_taiksm_${block}.csv`;
    const lksmBalanceFile = `balances/karura_lksm_${block}.csv`;
    const distributionFile = `distributions/karura_taiksm_${block}.csv`;
    const statsFile = `stats/karura_taiksm.json`;
    if (await fileExists(distributionFile)) {
        console.log(`${distributionFile} exists. Skip distribution.`);
        return;
    }


    // Step 1: Loads taiKSM balances
    const taiKsmBalances = (await getFile(balanceFile)).split("\n");
    let taiKsmTotal = new BN(0);
    let taiKsmAccountBalance: {[address: string]: any} = {};
    for (const balanceLine of taiKsmBalances) {
        const [address, free, loan, dex] = balanceLine.split(",");
        taiKsmAccountBalance[address] = new BN(free).add(new BN(loan)).add(new BN(dex));
        taiKsmTotal = taiKsmTotal.add(new BN(free)).add(new BN(loan)).add(new BN(dex));
    }

    // Step 2: Loads LKSM balances
    const lksmBalances = (await getFile(lksmBalanceFile)).split("\n");
    let lksmTotal = new BN(0);
    let lksmAccountBalance: {[address: string]: any} = {};
    for (const balanceLine of lksmBalances) {
        const [address, free, inTai] = balanceLine.split(",");
        // Only count LKSM in taiKSM
        lksmAccountBalance[address] = new BN(inTai);
        lksmTotal = lksmTotal.add(new BN(free)).add(new BN(inTai));
    }

    
    await runner()
        .requiredNetwork(['karura'])
        .withApiPromise()
        .atBlock(block)
        .run(async ({ apiAt }) => {
            let feeBalance = new BN((await apiAt.query.tokens.accounts(TAIKSM_FEE_RECIPIENT, {'StableAssetPoolToken': 0}) as any).free.toString());
            feeBalance = feeBalance.gt(BUFFER) ? feeBalance.sub(BUFFER) : new BN(0);

            console.log(`Fee balance: ${feeBalance.toString()}`);

            let protocolFee = feeBalance.mul(new BN("2")).div(new BN("100"));
            const taiKsmAmount = feeBalance.sub(protocolFee);
            const taiAmount = WEEKLY_TAI_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);

            // Step 3: Write rewards to file
            let content = "AccountId,0x0000000000000000000300000000000000000000,0x0000000000000000000100000000000000000084\n";
            for (const address in taiKsmAccountBalance) {
                // Step 4: Distribute rewards
                if (!address)   continue;
                const taiKam = taiKsmAccountBalance[address].mul(taiKsmAmount).div(taiKsmTotal);
                const tai = taiKsmAccountBalance[address].mul(taiAmount).div(taiKsmTotal);
                content += `${address},${taiKam.toString()},${tai.toString()}\n`;
            }
            content += `${PROTOCOL_ADDRESS},${protocolFee.toString()},0\n`;
            await createFile(distributionFile, content);

            // Notify the fee and yield amount with SNS
            const message = `taiKSM fee amount: ${feeBalance.toString()}\n`
                + `taiKSM total: ${taiKsmAmount.toString()}\n`
                + `TAI amount: ${taiAmount.toString()}\n`;
            await publishMessage(message);

            // Save to stats
            let stats: any = { cycles: {} };
            if (await fileExists(statsFile)) {
                stats = await getFile(statsFile);
            }
            
            stats.cycles[currentCycle + 1] = {
                startBlock: currentEndBlock,
                endBlock: block,
                balances: {
                    taiksm: taiKsmTotal.toString(),
                    lksm: lksmTotal.toString()
                },
                rewards: {
                    taiksm: taiKsmAmount.toString(),
                    tai: taiAmount.toString()
                }
            };
            await createFile(statsFile, JSON.stringify(stats));
        });
}
