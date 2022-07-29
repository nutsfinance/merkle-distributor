import rewardJson from './rewards_karura_1_7.json';
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";
import { abi } from './abi';
import { BigNumber, ethers } from 'ethers';
import * as fs from 'fs';
import { keyring as Keyring } from '@polkadot/ui-keyring';
import BN from "bignumber.js";

async function main() {
    const provider = new Provider({
        provider: new WsProvider("wss://karura-rpc-2.aca-api.network/ws") 
    });

    Keyring.loadAll({ ss58Format: 42, type: 'sr25519' });
    
    // await provider.api.isReady;
    const contract = new ethers.Contract("0xff066331be693BE721994CF19905b2DC7475C5c9", abi, provider);
    const tokens = Object.keys(rewardJson.tokenTotals);
    const userClaimed: {[user: string]: {[asset: string]: number}} = {};

    let i = 0;
    for (let user in rewardJson.claims) {
        const [, claimed] = await contract.getClaimedFor(Keyring.decodeAddress(user), tokens);
        const claimedAmounts = (claimed as BigNumber[]).map(amount => amount.toString());
        userClaimed[user] = {};
        for (let i = 0; i < tokens.length; i++) {
            if (claimedAmounts[i] == "0")   continue;

            userClaimed[user][getAsset(tokens[i])] = new BN(claimedAmounts[i]).div(new BN("1000000000000")).toNumber();
        }
        i++;
        console.log('User ' + i + ": " + user);
    }

    fs.writeFileSync('user_claimed_onchain.json', JSON.stringify(userClaimed));    
}

function getAsset(token: string) {
    switch (token) {
        case "0x0000000000000000000300000000000000000001":
            return "3USD";
        case "0x0000000000000000000100000000000000000084":
            return "TAI";
        case "0x0000000000000000000300000000000000000000":
            return "taiKSM";
        case "0x0000000000000000000100000000000000000083":
            return "LKSM";
        case "0x0000000000000000000100000000000000000080":
            return "KAR";
    }

    return '';
}

main();