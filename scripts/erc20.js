const MockToken = artifacts.require("MockToken");
const MerkleDistributorProxy = artifacts.require("MerkleDistributorProxy");

const BN = web3.utils.BN;
const toWei = web3.utils.toWei;
const MAX = new BN(2).pow(new BN(256)).sub(new BN(1));

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();

        // const erc20 = await TestERC20.new("test", "TC", "0xfffffffffffffffffffffffff");
        // console.log("erc20 address:" + erc20.address);
        const erc20 = await MockToken.at("0xe9c1b8993a8750ae65607ef91ebcde595deb4ec3");
        await erc20.mint("0x740e2D176ef3EdEF642c3d9F196afa5Fc5c28267", "0x0131beb925ffd3200000");
        console.log(await erc20.balanceOf("0x740e2D176ef3EdEF642c3d9F196afa5Fc5c28267"));
        callback();
    } catch (e) {
        callback(e);
    }
}
