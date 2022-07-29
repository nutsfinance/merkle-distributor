import claimedSubqueryJson from './lksm_claimed.json';
import claimedSubscanJson from './user_claimed_subscan.json';
import * as _ from 'lodash';
import { keyring as Keyring } from '@polkadot/ui-keyring';

Keyring.loadAll({ ss58Format: 42, type: 'sr25519' });
const nodes = claimedSubqueryJson.data.accountTokenClaimeds.nodes;

const users1 = nodes.map(node => Keyring.encodeAddress(Keyring.decodeAddress(node.accountId), 42));
const users2 = Object.keys(claimedSubscanJson);

console.log(users1.length)
console.log(users2.length);
console.log(_.difference(users1, users2))