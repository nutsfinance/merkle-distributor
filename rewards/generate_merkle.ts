/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types';
import { WsProvider } from "@polkadot/api";
import { BodhiProvider } from "@acala-network/eth-providers";

import { RewardList } from './lib/reward-list';
import { merkletDistributorAbi } from './merkle-distributor.abi';
import { CONFIG } from './config';
import { createFile, getFile, publishMessage } from './lib/aws_utils';

export const generateMerkle = async (asset: string, block: number) => {
    console.log('\n------------------------------------------');
    console.log('*        Generate Merkle Tree            *');
    console.log('------------------------------------------\n');

    // Get the current cycle
    let provider;
    if (asset != "tdot") {
        provider = new BodhiProvider({
            provider: new WsProvider("wss://karura.api.onfinality.io/public-ws") 
        });
    } else {
        provider = new BodhiProvider({
            provider: new WsProvider("wss://acala-rpc-3.aca-api.network/ws") 
        });
    }
    await provider.isReady();
    const merkleDistributor = new ethers.Contract(CONFIG[asset].merkleDistributor, merkletDistributorAbi, provider);
    const currentCycle = (await merkleDistributor.currentCycle()).toNumber();
    const currentEndBlock = (await merkleDistributor.lastPublishEndBlock()).toNumber();
    console.log(`Current cycle: ${currentCycle}, current end block: ${currentEndBlock}`);
    if (block < currentEndBlock) {
        console.log(`Block behind current end block. Skip distribution.`);
        return;
    }

    const distributionFile = `distributions/${CONFIG[asset].network}_${asset}_${block}.csv`;
    const currentMerkleFile = `merkles/${CONFIG[asset].network}_${asset}_${currentCycle}.json`;
    const merkleFile = `merkles/${CONFIG[asset].network}_${asset}_${currentCycle + 1}.json`;
    const rewardList = new RewardList(currentCycle + 1, currentEndBlock, block);

    // Load the current merkle
    const currentMerkleTree = await getFile(currentMerkleFile);
    for (const user in currentMerkleTree.claims) {
        const tokens = currentMerkleTree.claims[user].tokens;
        const cumulativeAmounts = currentMerkleTree.claims[user].cumulativeAmounts;
        const reserveAmounts = currentMerkleTree.claims[user].reserveAmounts;

        for (let i = 0; i < tokens.length; i++) {
            if (reserveAmounts) {
                rewardList.updateUserReserve(user, tokens[i], reserveAmounts[i]);
            }
            rewardList.increaseUserRewards(user, tokens[i], cumulativeAmounts[i]);
        }
    }

    // Add new distribution
    const distributionList = (await getFile(distributionFile)).split("\n");
    const headers = distributionList[0].split(",");
    for (const distribution of distributionList) {
        // Skip header
        if (distribution.includes("AccountId")) continue;

        const values = distribution.split(",");
        if (!values[0])  continue;
        for (let i = 1; i < headers.length; i++) {
            // values[0] is the address
            // If this is a reserve
            if (headers[i].startsWith("reserve-")) {
                rewardList.updateUserReserve(values[0], headers[i].replace("reserve-", ""), values[i]);
            } else {
                rewardList.increaseUserRewards(values[0], headers[i], values[i]);
            }
        }
    }

    const newMerkleTree = rewardList.toMerkleTree();
    console.log('Merkle root: ' + newMerkleTree.merkleRoot);
    
    await createFile(merkleFile, JSON.stringify(newMerkleTree));

    const message = `New ${asset} cycle: ${newMerkleTree.cycle}\n`
        + `New root: ${newMerkleTree.merkleRoot}\n`
        + `Start block: ${newMerkleTree.startBlock}\n`
        + `End block: ${newMerkleTree.endBlock}\n`;

    await publishMessage(message);
}