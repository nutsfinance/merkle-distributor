import {ethers} from "hardhat";

const DISTRIBUTOR = '0xb864D786D78fC8A740Acd11e17C8a145FC0725c5';

async function main() {
    const ERC20 = await ethers.getContractFactory("ERC20");
    const tai = ERC20.attach('0x0000000000000000000100000000000000000000');
    console.log('TAI Balance before: ' + await tai.balanceOf(DISTRIBUTOR));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });