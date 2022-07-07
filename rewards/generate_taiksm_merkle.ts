import * as fs from 'fs';
import { keyring as Keyring } from '@polkadot/ui-keyring';
import { RewardList } from './reward-list';

const CYCLE = 1;
const START_BLOCK = 2039200;
const END_BLOCK = 2082400;

const main = async () => {
    Keyring.loadAll({ type: 'sr25519' });
    const data = fs.readFileSync('./taiksm_rewards.csv', {encoding:'utf8', flag:'r'});
    const rewardList = new RewardList(CYCLE, START_BLOCK, END_BLOCK);

    for (let line of data.split("\n")) {
        if (!line) continue;
        const [address, taiksmAmount, taiAmount] = line.split(",");
        rewardList.increaseUserRewards(address, "0x0000000000000000000100000000000000000084", taiAmount);
        rewardList.increaseUserRewards(address, "0x0000000000000000000300000000000000000000", taiksmAmount);
    }
    const distribution = rewardList.toMerkleTree();

    console.log('Merkle root: ' + distribution.merkleRoot);
    
    fs.writeFileSync(`./rewards_karura_0_${CYCLE}.json`, JSON.stringify(distribution));
}

main();