/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types'
import { WsProvider } from "@polkadot/api";
import { BodhiProvider } from "@acala-network/bodhi";

import { BN } from 'bn.js'
import runner from './lib/runner';
import { createFile, fileExists, getFile, publishMessage } from './lib/aws_utils';
import { merkletDistributorAbi } from './merkle-distributor.abi';
import { CONFIG, PROTOCOL_ADDRESS } from './config';

const TDOT_FEE_RECIPIENT = "23AdbsfTWCWtRFweQF4f3iZLcLBPwSHci9CXuMhqFirZmUZj";
const BUFFER = new BN("10000000000");

export const distributeTDot = async (block: number) => {
    console.log('\n------------------------------------------');
    console.log('*      Distribute tDOT Rewards            *');
    console.log('------------------------------------------\n');

    const provider = new BodhiProvider({
        provider: new WsProvider("wss://acala-rpc-3.aca-api.network/ws") 
    });
    await provider.isReady();
    const merkleDistributor = new ethers.Contract(CONFIG["tdot"].merkleDistributor, merkletDistributorAbi, provider);
    const currentCycle = (await merkleDistributor.currentCycle()).toNumber();
    const currentEndBlock = (await merkleDistributor.lastPublishEndBlock()).toNumber();
    console.log(`Current cycle: ${currentCycle}, current end block: ${currentEndBlock}`);
    if (block < currentEndBlock) {
        console.log(`Block behind current end block. Skip distribution.`);
        return;
    }

    const balanceFile = `balances/acala_tdot_${block}.csv`;
    const distributionFile = `distributions/acala_tdot_${block}.csv`;
    const statsFile = `stats/acala_tdot.json`;
    if (await fileExists(distributionFile)) {
        console.log(`${distributionFile} exists. Skip distribution.`);
        return;
    }

    const balances = (await getFile(balanceFile)).split("\n");
    let balanceTotal = new BN(0);
    let accountBalance: {[address: string]: any} = {};
    for (const balanceLine of balances) {
        const [address, balance, incentive] = balanceLine.split(",");
        if (!accountBalance[address])   accountBalance[address] = new BN(0);
        accountBalance[address] = accountBalance[address].add(new BN(balance)).add(new BN(incentive));

        balanceTotal = balanceTotal.add(new BN(balance)).add(new BN(incentive));
    }
    
    await runner()
        .requiredNetwork(['acala'])
        .withApiPromise()
        .atBlock(block)
        .run(async ({ apiAt }) => {
            const feeBalance = new BN((await apiAt.query.tokens.accounts(TDOT_FEE_RECIPIENT, {'StableAssetPoolToken': 0}) as any).free.toString());

            console.log(`Fee balance: ${feeBalance.sub(BUFFER).toString()}`);

            let tdotAmount = feeBalance.sub(BUFFER);
            let protocolFee = tdotAmount.mul(new BN("2")).div(new BN("100"));
            tdotAmount = tdotAmount.sub(protocolFee);

            let content = "AccountId,0x0000000000000000000300000000000000000000\n";
            for (const address in accountBalance) {
                if (!address)   continue;
                const tdot = accountBalance[address].mul(tdotAmount).div(balanceTotal);
                content += `${address},${tdot.toString()}\n`;
            }
            content += `${PROTOCOL_ADDRESS},${protocolFee.toString()}\n`;
            await createFile(distributionFile, content);

            // TODO Transfer tDOT to merkle distributor from fee and yield recipients

            // Notify the fee and yield amount with SNS
            const message = `tDOT fee amount: ${feeBalance.toString()}\n`
                + `tDOT total: ${tdotAmount.toString()}`;
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
                    tdot: balanceTotal.toString(),
                },
                rewards: {
                    tdot: tdotAmount.toString()
                }
            };
            await createFile(statsFile, JSON.stringify(stats));
        });
}