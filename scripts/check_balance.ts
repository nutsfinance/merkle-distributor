import ethers from "hardhat";

const DISTRIBUTOR = '0xF7A5B5792672D06d8FD2B5A6dAcE0C19d578BaCF';

async function main() {
    const ERC20 = await ethers.getContractFactory("ERC20");
    const tai = ERC20.attach('0x0000000000000000000100000000000000000084');
    console.log('TAI Balance before: ' + await tai.balanceOf(DISTRIBUTOR));
    // const tx1 = await tai.transfer(DISTRIBUTOR, '1000' + '000000000000');
    // await tx1.wait();
    console.log('TAI Balance after: ' + await tai.balanceOf(DISTRIBUTOR));

    const taiKSM = ERC20.attach('0x0000000000000000000300000000000000000000');
    console.log('taiKSM Balance before: ' + await taiKSM.balanceOf(DISTRIBUTOR));
    // const tx2 = await taiKSM.transfer(DISTRIBUTOR, '10' + '000000000000');
    // await tx2.wait();
    console.log('taiKSM Balance after: ' + await taiKSM.balanceOf(DISTRIBUTOR));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });