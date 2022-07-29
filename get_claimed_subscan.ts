import * as fs from 'fs';
import { keyring as Keyring } from '@polkadot/ui-keyring';

const content = fs.readFileSync('claims.csv').toString();
const tokenTotal: {[token: string]: number} = {};
const claimed: {[user: string]: {[token: string]: number}} = {};

Keyring.loadAll({ ss58Format: 42, type: 'sr25519' });
for (let line of content.split('\r\n')) {
    const ss: string[] = line.split(',');
    const user = ss[5];
    const amount = Number(ss[6]);
    const token = ss[8];
    if (user == 'qbK5tbWD3ZLy5xB3KdoJqBttoRpvFfZ8JfM743xLrx9YiN2')   continue;

    const userKey = Keyring.encodeAddress(Keyring.decodeAddress(user), 42);

    if (!tokenTotal[token]) tokenTotal[token] = 0;
    if (!claimed[userKey]) claimed[userKey] = {};
    if (!claimed[userKey][token])  claimed[userKey][token] = 0;

    claimed[userKey][token] += amount;
    tokenTotal[token] += amount;
}

// console.log(claimed);
console.log(Object.keys(claimed).length);

console.log(tokenTotal)

fs.writeFileSync('./user_claimed_subscan.json', JSON.stringify(claimed));
