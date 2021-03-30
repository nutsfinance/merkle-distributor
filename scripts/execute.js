const MerkleDistributor = artifacts.require("MerkleDistributor");
const MerkleDistributorProxy = artifacts.require("MerkleDistributorProxy");

const BN = web3.utils.BN;
const toWei = web3.utils.toWei;
const MAX = new BN(2).pow(new BN(256)).sub(new BN(1));

module.exports = async function (callback) {
    try {
        const accounts = await web3.eth.getAccounts();

        console.log('account: ' + accounts[0]);
        const merkleDistributor = await MerkleDistributor.at('0x6aBbFaa716D352e5c3D9cf99ECE255DF035BfEFd');
        await merkleDistributor.claim(1, "0xEf6FE9C9B351824c96e5C7a478C1e52BAdCBAEe0", "0x30ca024f987b900000", "0x618156cb", ["0x83ce80c7f6c5fa698a9b231b2899865572905efc0c76af5acb0a08239bbedf8c", "0xc08bf6147f0eedefb256528c3bee870ea9a538faab15fac72344e604835cbede"]);
        callback();
    } catch (e) {
        callback(e);
    }
}
