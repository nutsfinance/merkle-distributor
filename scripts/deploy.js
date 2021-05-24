const MerkleDistributor = artifacts.require("MerkleDistributor");
const MerkleDistributorProxy = artifacts.require("MerkleDistributorProxy");

const BN = web3.utils.BN;
const toWei = web3.utils.toWei;
const MAX = new BN(2).pow(new BN(256)).sub(new BN(1));

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();

        console.log('account: ' + accounts[0]);
        const merkleDistributorImpl = await MerkleDistributor.new();
        const merkleDistributorProxy = await MerkleDistributorProxy.new(merkleDistributorImpl.address, "0x365fF136745Cd3a25715AaC3f327a79bB4041910", Buffer.from(''));
        const merkleDistributor = await MerkleDistributor.at(merkleDistributorProxy.address);
        await merkleDistributor.initialize('0x9a0aba393aac4dfbff4333b06c407458002c6183', '0x4fff5f0e886ce71e0f66857ea8e7ae52452f42f717cceedba844a7270701f223', 1624352400);
        console.log(`impl: ${merkleDistributorImpl.address}`);
        console.log(`proxy: ${merkleDistributorProxy.address}`);
        callback();
    } catch (e) {
        callback(e);
    }
}
