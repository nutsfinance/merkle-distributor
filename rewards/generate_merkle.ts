/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import '@acala-network/types';
import '@acala-network/types/interfaces/types-lookup';
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";

import * as fs from 'fs';
import { keyring as Keyring } from '@polkadot/ui-keyring';
import { RewardList } from './reward-list';
import { abi } from './merkle-distributor.abi';
import { CONFIG } from './config';

export const generateMerkle = async (asset: string, block: number) => {
    Keyring.loadAll({ type: 'sr25519' });

    // Get the current cycle
    const provider = new Provider({
        provider: new WsProvider("wss://karura.api.onfinality.io/public-ws") 
    });
    await provider.api.isReady;
    const merkleDistributor = new ethers.Contract(CONFIG[asset].merkleDistributor, abi, provider);
    const currentCycle = (await merkleDistributor.currentCycle()).toNumber();
    const currentEndBlock = (await merkleDistributor.lastPublishEndBlock()).toNumber();
    console.log(`Current cycle: ${currentCycle}, current end block: ${currentEndBlock}`);
    if (block < currentEndBlock) {
        console.log(`Block behind current end block. Skip distribution.`);
        return;
    }

    const distributionFile = __dirname + `/data/distributions/taiksm_${block}.csv`;
    const currentMerkleFile = __dirname + `/data/merkle/${CONFIG[asset].network}_${CONFIG[asset].poolId}_${currentCycle}.json`;
    const merkleFile = __dirname + `/data/merkle/${CONFIG[asset].network}_${CONFIG[asset].poolId}_${currentCycle + 1}.json`;
    if (fs.existsSync(merkleFile)) {
        console.log(`${merkleFile} exists. Skip distribution.`);
        return;
    }

    const rewardList = new RewardList(currentCycle + 1, currentEndBlock, block);

    // Load the current merkle
    const currentMerkle = fs.readFileSync(currentMerkleFile, {encoding:'utf8', flag:'r'});
    const currentMerkleTree = JSON.parse(currentMerkle);
    for (const user in currentMerkleTree.claims) {
        const tokens = currentMerkleTree.claims[user].tokens;
        const cumulativeAmounts = currentMerkleTree.claims[user].cumulativeAmounts;

        for (let i = 0; i < tokens.length; i++) {
            rewardList.increaseUserRewards(user, tokens[i], cumulativeAmounts[i]);
        }
    }

    // Add new distribution
    const distributionList = fs.readFileSync(distributionFile, {encoding:'utf8', flag:'r'}).split("\n");
    const headers = distributionList[0].split(",");
    for (const distribution of distributionList) {
        // Skip header
        if (distribution.includes("AccountId")) continue;

        const values = distribution.split(",");
        if (values[0])  continue;
        for (let i = 1; i < headers.length; i++) {
            // values[0] is the address
            rewardList.increaseUserRewards(values[0], headers[i], values[i]);
        }
    }

    const newMerkleTree = rewardList.toMerkleTree();
    console.log('Merkle root: ' + newMerkleTree.merkleRoot);
    await fs.promises.writeFile(merkleFile, JSON.stringify(newMerkleTree));
}