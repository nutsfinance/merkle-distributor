const TestERC20 = artifacts.require("TestERC20");
const MerkleDistributorProxy = artifacts.require("MerkleDistributorProxy");

const BN = web3.utils.BN;
const toWei = web3.utils.toWei;
const MAX = new BN(2).pow(new BN(256)).sub(new BN(1));

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();

        // const erc20 = await TestERC20.new("test", "TC", "0xfffffffffffffffffffffffff");
        // console.log("erc20 address:" + erc20.address);
        const erc20 = await TestERC20.at("0x72993D5A4A1ebC7c8cb1883b672c39a0786A8e81");
        await erc20.transfer("0x21453a6eFd9741ddEBA6cb446abb656d3B699d97", "0xfffffffffffffffffffffffff");
        console.log(await erc20.balanceOf("0x21453a6eFd9741ddEBA6cb446abb656d3B699d97"));
        callback();
    } catch (e) {
        callback(e);
    }
}
