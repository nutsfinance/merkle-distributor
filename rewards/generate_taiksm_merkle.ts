import * as fs from 'fs';
import { keyring as Keyring } from '@polkadot/ui-keyring';
import { RewardList } from './reward-list';

const CYCLE = 4;
const START_BLOCK = 2039200;
const END_BLOCK = 2082400;

const main = async () => {
    Keyring.loadAll({ type: 'sr25519' });
    const data = fs.readFileSync('./taiksm_rewards.csv', {encoding:'utf8', flag:'r'});
    const rewardList = new RewardList(CYCLE, START_BLOCK, END_BLOCK);

    for (let line of data.split("\n")) {
        if (!line) continue;
        const [address, taiksmAmount, taiAmount] = line.split(",");
        const userAddress = Keyring.encodeAddress(Keyring.decodeAddress(address), 42);
        rewardList.increaseUserRewards(userAddress, "0x0000000000000000000100000000000000000084", taiAmount);
        rewardList.increaseUserRewards(userAddress, "0x0000000000000000000300000000000000000000", taiksmAmount);
    }
    const distribution = rewardList.toMerkleTree();

    console.log('Merkle root: ' + distribution.merkleRoot);
    console.log('taiKSM Total: ' + distribution.tokenTotals["0x0000000000000000000300000000000000000000"]);
    console.log('TAI Total: ' + distribution.tokenTotals["0x0000000000000000000100000000000000000084"]);
    console.log("Node: " + distribution.claims["5Gru3MF8nF9W1gaZDgXq5QaKTAAT3WktTk1RU7t6Ca2UXshx"].node)

    fs.writeFileSync(`./rewards_karura_0_${CYCLE}.json`, JSON.stringify(distribution));
}

main();