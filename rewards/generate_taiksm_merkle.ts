import * as fs from 'fs';
import { keyring as Keyring } from '@polkadot/ui-keyring';
import { RewardList } from './reward-list';

const CYCLE = 5;
const START_BLOCK = 2039200;
const END_BLOCK = 2082400;

const main = async () => {
    Keyring.loadAll({ type: 'sr25519' });
    const rewardList = new RewardList(CYCLE, START_BLOCK, END_BLOCK);

    for (let i = 0; i <= CYCLE; i++) {
        const data = fs.readFileSync(`./data/rewards_karura_0_${i}.csv`, {encoding:'utf8', flag:'r'});
        for (let line of data.split("\n")) {
            if (!line) continue;
            const [address, taiksmAmount, taiAmount] = line.split(",");
            rewardList.increaseUserRewards(address, "0x0000000000000000000100000000000000000084", taiAmount);
            rewardList.increaseUserRewards(address, "0x0000000000000000000300000000000000000000", taiksmAmount);
        }
    }

    const distribution = rewardList.toMerkleTree();

    console.log('Merkle root: ' + distribution.merkleRoot);
    
    fs.writeFileSync(`./merkle/rewards_karura_0_${CYCLE}.json`, JSON.stringify(distribution));
}

main();