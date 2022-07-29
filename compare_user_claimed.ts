import claimedOnChainJson from './user_claimed_onchain.json';
import claimedSubscanJson from './user_claimed_subscan.json';
import * as _ from 'lodash';
import BN from "bignumber.js";

// console.log(Object.keys(claimedOnChainJson).filter(user => Object.keys((claimedOnChainJson as any)[user]).length > 0).length);
// console.log(Object.keys(claimedSubscanJson).length)

const tokenTotal: {[token: string]: number} = {};

for (const user in claimedSubscanJson) {
    for (const token in (claimedSubscanJson as any)[user]) {
        if (!tokenTotal[token]) tokenTotal[token] = 0;

        const amount1 = (claimedOnChainJson as any)[user][token];
        const amount2 = (claimedSubscanJson as any)[user][token];

        if (Math.abs((amount1 - amount2) * 100 / amount2) > 1) {
            console.log('User: ' + user + ', token: ' + token + ': ' + amount1 + ', ' + amount2)
        }

        tokenTotal[token] += amount1;        
    }
}

console.log(tokenTotal);