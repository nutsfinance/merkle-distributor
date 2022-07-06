import fetch from 'axios';
import * as fs from 'fs';

const main = async () => {
    const distribution = (await fetch('https://api.taigaprotocol.io/rewards_karura_0_4.json')).data;
    const data: string[] = [];

    for (let user in distribution.claims) {
        const userData = distribution.claims[user];
        data.push(`${user},${userData.cumulativeAmounts[1]},${userData.cumulativeAmounts[0]}`);
    }

    fs.writeFileSync('./taiksm_rewards.csv', data.join("\n"));
}

main();