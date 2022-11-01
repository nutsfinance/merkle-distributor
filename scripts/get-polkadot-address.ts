import { ethers } from "hardhat";
const { WsProvider, Keyring } = require('@polkadot/api');

const DISTRIBUTOR = '0x05fC4e64B4242ef130F14Da7DFBCd0fD0266bFe7';

async function main() {
    const keyring = new Keyring();
    //const evm = await ethers.getContractAt("IEVMAccounts", '0xC1232863e2EF45cd0e9c68c408303371437afAa2');
    const evm = await ethers.getContractAt("IEVMAccounts", '0x18f918fb02FCd59062625a4a54bEA325e1Ce0bb3');
    let hex = await evm.getAccountId(DISTRIBUTOR);
    console.log('TAI Balance before: ' + keyring.encodeAddress(hex, 8));
    // const tx1 = await tai.transfer(DISTRIBUTOR, '1000' + '000000000000');
    // await tx1.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });