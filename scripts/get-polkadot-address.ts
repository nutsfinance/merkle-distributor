import { ethers } from "hardhat";
const { WsProvider, Keyring } = require('@polkadot/api');

const DISTRIBUTOR = '0xb864D786D78fC8A740Acd11e17C8a145FC0725c5';

async function main() {
    const keyring = new Keyring();
    const evm = await ethers.getContractAt("IEVMAccounts", '0xC1232863e2EF45cd0e9c68c408303371437afAa2');
    let hex = await evm.getAccountId(DISTRIBUTOR);
    console.log('TAI Balance before: ' + keyring.encodeAddress(hex, 10));
    // const tx1 = await tai.transfer(DISTRIBUTOR, '1000' + '000000000000');
    // await tx1.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });