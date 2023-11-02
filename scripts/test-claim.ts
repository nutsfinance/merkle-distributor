import { calcEthereumTransactionParams } from "@acala-network/eth-providers";
import { ethers } from "hardhat";

//const DISTRIBUTOR = '0xff066331be693BE721994CF19905b2DC7475C5c9'; //3usd
 const DISTRIBUTOR = '0xf595F4a81B27E5CC1Daca349A69c834f375224F4'; //taiKSM
// const DISTRIBUTOR = '0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9'; //tdot
//const DISTRIBUTOR = '0xc907CE08ac3f1AaD3AB0Adce5A20c907334C09B3'; // lksm
// const DISTRIBUTOR = '0x73D6df4395CD54DF2E07fD3880c1B47Aeb2Aed97'; // ldot
const NEW_ROOT = '0x0000000000000000000000000000000000000000000000000000000000000000';
const NEW_CYCLE = 1;
const NEW_START_BLOCK = 0;
const NEW_END_BLOCK = 2454000;

async function main() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const ethParams = calcEthereumTransactionParams({
        gasLimit: '800000',
        validUntil: (blockNumber + 100).toString(),
        storageLimit: '600',
        txFeePerGas: '199999946752',
        storageByteDeposit: '300000000000000'
    });
    const [deployer] = await ethers.getSigners();

    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    const distributor = MerkleDistributor.attach('0xff066331be693BE721994CF19905b2DC7475C5c9');
    console.log('Cycle before: ' + await distributor.currentCycle());

    // const roleAddress = '0x99537d82F6F4AAD1419dD14952B512c7959A2904';
    // const role1 = await distributor.ROOT_PROPOSER_ROLE();
    // console.log('Proposal role: ' + role1)
    // console.log('Has role: ' + await distributor.hasRole(role1, roleAddress));
    // const tx1 = await distributor.grantRole(role1, roleAddress);
    // await tx1.wait();
    // console.log('Has role: ' + await distributor.hasRole(role1, roleAddress));

    // const role2 = await distributor.ROOT_VALIDATOR_ROLE();
    // console.log('Proposal role: ' + role2)
    // console.log('Has role: ' + await distributor.hasRole(role2, roleAddress));
    // const tx2 = await distributor.grantRole(role2, roleAddress);
    // await tx2.wait();
    // console.log('Has role: ' + await distributor.hasRole(role2, roleAddress));

    // const tx3 = await distributor.proposeRoot(NEW_ROOT, ethers.utils.formatBytes32String(''), NEW_CYCLE, NEW_START_BLOCK, NEW_END_BLOCK, {
    //     gasPrice: ethParams.txGasPrice,
    //     gasLimit: ethParams.txGasLimit,
    // });
    // await tx3.wait();
    const amounts = [
        "0",
        "5384108",
        "0",
        "646083",
        "401619463936"
    ];
    const tokens = [
        "0x0000000000000000000100000000000000000080",
        "0x0000000000000000000100000000000000000083",
        "0x0000000000000000000100000000000000000084",
        "0x0000000000000000000300000000000000000000",
        "0x0000000000000000000300000000000000000001"
    ];
    const proof = [
        "0xf6f284e6a2fe31e125f6bd7b809e561a527c3c1bc21501ca65db399c9672138e",
        "0xcb8116c137c06aec2a6616c4028e11ce239ab8c11fc8b4bc636e27ff294b7582",
        "0xf05ca03638e5714b8ad07932d5126332a7cad8df29ea6fba9b90911b2c282a51",
        "0xbd1848c7aa506ecba5eb65012e6c84063dbe0c2447175faf8d5991d49d459ea7",
        "0xc572794a143e8021dcc2ee621bdf7355819d4507060f8b4e2e71f500fb757225",
        "0x816eeb4ca7ddc3945fa147071cb2c119e769810b1d2f32e9a692054c2227a1bf",
        "0xa5e34487549eab94b3f1f7f786d3a3802619608c01e83a7880b96ff4cb770266"
    ];
    const claimables = await distributor.getClaimableFor('0x1bff005918ab80f8f3b16fdd0722654a62aeb0d2ffd11b895fc305a77dee6933', tokens, amounts);
    console.log(claimables);
    console.log(distributor);
    //await distributor['claim(bytes32,address[],uint256[],uint256,uint256,bytes32[])']('0x1bff005918ab80f8f3b16fdd0722654a62aeb0d2ffd11b895fc305a77dee6933', tokens, amounts, "0x013d", 330, proof);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });
