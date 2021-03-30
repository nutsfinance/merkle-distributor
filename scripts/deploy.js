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
        const merkleDistributorProxy = await MerkleDistributorProxy.new(merkleDistributorImpl.address, Buffer.from(''));
        const merkleDistributor = await MerkleDistributor.at(merkleDistributorProxy.address);
        await merkleDistributor.initialize('0x15caed6bd75bfb22590a9af053d0fe89f287c066', '0x8c81ccac1f1258f6fd39b6dcf75fc509179a1e2436f1724a964894769c98d7cf');

        console.log(`implementation: ${merkleDistributorImpl.address}`);
        console.log(`proxy: ${merkleDistributorProxy.address}`);
        callback();
    } catch (e) {
        callback(e);
    }
}
