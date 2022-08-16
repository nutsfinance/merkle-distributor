/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types';
import '@acala-network/types/interfaces/types-lookup';
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";

import { BN } from 'bn.js'
import runner from './lib/runner';
import { ethers } from 'ethers';
import { abi } from './merkle-distributor.abi';
import { createFile, fileExists, getFile, publishMessage } from './lib/aws_utils';

const TAIKSM_REWARD_DISTRIBUTOR = "0xf595F4a81B27E5CC1Daca349A69c834f375224F4";
// const TAIKSM_FEE_RECIPIENT = "qbK5taiSvrJy9LW5sVN7qYaQMb22bPfNb15zSixCrUypWuG";
// const TAIKSM_YIELD_RECIPIENT = "qbK5tbSnd1thFaKNgNCEZ9DsFzFHAq7xFJfLWaEm9HQY2eU";

const TAIKSM_FEE_RECIPIENT = "sGgT1bCh5sGBaK5LfzUmDWZbxUnRiqV2QK7oxNA4iixdamM";
const TAIKSM_YIELD_RECIPIENT = "sfyxDFLkQQCx9f7oJiL32725mF7dM5GXGphUSxmC9Zq9Xec";
const KAR = "0x0000000000000000000100000000000000000080";
const BUFFER = new BN("100000000000");

const ONE = new BN(10).pow(new BN(12));
const WEEKLY_TAI_REWARD = new BN("28000").mul(ONE);
// Number of blocks per week: 3600 * 24 * 7 / 12
const WEEKLY_BLOCK = new BN(50400);

// lksm rewards config
// 7100 KAR / WEEK for LKSM
const WEEKLY_KAR_REWARD = new BN(7100).mul(ONE);
// reserved 50%
const RESERVED_RATE = ONE.mul(new BN(5)).div(new BN(10));
const CLAIMABLE_RATE = ONE.mul(new BN(5)).div(new BN(10));

// Loan, Rewards
const EXCLUDED_ADDRESS = ['5EYCAe5fiQJsnqbdsqzNnWhEAGZkyK8uqahrmhwVvcuNRhpd', '5EYCAe5fiQJso5shMc1vDwj12vXpXhuYHDwVES1rKRJwcWVj'];

export const distributeTaiKsm = async (block: number) => {
    console.log('\n------------------------------------------');
    console.log('*      Distribute taiKSM Rewards          *');
    console.log('------------------------------------------\n');

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

    const balanceFile = `balances/karura_taiksm_${block}.csv`;
    const lksmBalanceFile = `balances/karura_lksm_${block}.csv`;
    const merkleFile = `merkles/karura_lksm_${currentCycle}.csv`;
    const distributionFile = `distributions/karura_taiksm_${block}.csv`;
    const claimerFile = `accounts/karura_taiksm_kar_claimer_${block}.csv`;
    if (await fileExists(distributionFile)) {
        console.log(`${distributionFile} exists. Skip distribution.`);
        return;
    }

    const taiKsmBalances = (await getFile(balanceFile)).split("\n");
    const lksmBalances = (await getFile(lksmBalanceFile)).split("\n");

    // Step 1: Loads taiKSM balances
    let taiKsmAccountBalance: {[address: string]: any} = {};
    for (const balanceLine of taiKsmBalances) {
        const [address, free, loan, dex] = balanceLine.split(",");
        taiKsmAccountBalance[address] = new BN(free).add(new BN(loan)).add(new BN(dex));
    }

    // Step 2: Loads LKSM balances
    let lksmAccountBalance: {[address: string]: any} = {};
    for (const balanceLine of lksmBalances) {
        const [address, free, inTai] = balanceLine.split(",");
        // Only count LKSM in taiKSM
        lksmAccountBalance[address] = new BN(inTai);
    }

    // Step 3: Load current KAR reserve from current merkle
    const claimers: string[] = (await getFile(claimerFile)).split('\n') as string[];
    const reserved: Record<string, any> = {};

    const currentMerkle = await getFile(merkleFile);
    for (const address in currentMerkle.claims) {
        const index = (currentMerkle.claims as any)[address].tokens.indexOf(KAR);
        if (index < 0)  continue;
        reserved[address] = new BN((currentMerkle.claims as any)[address].reserveAmounts[index]);
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
            const karTotalReward = WEEKLY_KAR_REWARD.mul(new BN(block - currentEndBlock)).div(WEEKLY_BLOCK);
            const taiKsmIssuance = await apiAt.query.tokens.totalIssuance({'StableAssetPoolToken': 0}) as any;
            const lksmIssuance = await apiAt.query.tokens.totalIssuance({ 'Token': 'LKSM' }) as any;

            // Step 4: Split rewards to reserves
            for (const address in taiKsmAccountBalance) {
                if (!reserved[address]) {
                    reserved[address] = new BN(0);
                }
                reserved[address] = reserved[address].add(lksmAccountBalance[address].mul(karTotalReward).div(lksmIssuance).mul(RESERVED_RATE).div(ONE));
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

            // Step 6: Write rewards to file
            let content = "AccountId,0x0000000000000000000300000000000000000000,0x0000000000000000000100000000000000000084,0x0000000000000000000100000000000000000080,reserve-0x0000000000000000000100000000000000000080\n";
            for (const address in taiKsmAccountBalance) {
                // Step 4: Distribute rewards
                if (!address || EXCLUDED_ADDRESS.includes(address))   continue;
                const taiKam = taiKsmAccountBalance[address].mul(taiKsmAmount).div(taiKsmIssuance);
                const tai = taiKsmAccountBalance[address].mul(taiAmount).div(taiKsmIssuance);
                const kar = (lksmAccountBalance[address]).mul(karTotalReward).div(lksmIssuance).mul(CLAIMABLE_RATE).div(ONE);
                // TODO kar will only release 13 week
                content += `${address},${taiKam.toString()},${tai.toString()},${kar.toString()},${reserved[address].toString()}\n`;
            }
            await createFile(distributionFile, content);

            // TODO Transfer taiKSM to merkle distributor from fee and yield recipients
            // This can be done after fee and yield recipients are updated.
            // For now we need to continue to use multisig

            // Notify the fee and yield amount with SNS
            const message = `taiKSM fee amount: ${feeBalance.toString()}\n`
                + `taiKSM yield amount: ${yieldBalance.toString()}\n`
                + `TAI amount: ${taiAmount.toString()}`;
            await publishMessage(message);
        });
}