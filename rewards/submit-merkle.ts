import { calcEthereumTransactionParams } from "@acala-network/eth-providers";
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";
import { ethers } from "ethers";
import { merkletDistributorAbi } from "./merkle-distributor.abi";
import { rewardCollectorAbi } from "./reward-collector.abi";
import { CONFIG } from "./config";
import { getFile } from "./lib/aws_utils";
import { BN } from 'bn.js'
import * as dotenv from 'dotenv';

dotenv.config();

export const submitMerkle = async (asset: string) => {

    // Get the current cycle
    let provider;
    if (asset != "tdot") {
        provider = new Provider({
            provider: new WsProvider("wss://karura.api.onfinality.io/public-ws") 
        });
    } else {
        provider = new Provider({
            provider: new WsProvider("wss://acala-polkadot.api.onfinality.io/public-ws") 
        });
    }
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC!).connect(provider);
    console.log(`Signing address: ${wallet.address}`);

    await provider.api.isReady;
    const merkleDistributor = new ethers.Contract(CONFIG[asset].merkleDistributor, merkletDistributorAbi, wallet);
    const currentCycle = (await merkleDistributor.currentCycle()).toNumber();

    console.log(`Current cycle: ${currentCycle}`);

    const newMerkleFile = `merkles/${CONFIG[asset].network}_${asset}_${currentCycle + 1}.json`;
    const newMerkleTree = await getFile(newMerkleFile);
    const oldMerkleFile = `merkles/${CONFIG[asset].network}_${asset}_${currentCycle}.json`;
    const oldMerkleTree = await getFile(oldMerkleFile);

    const blockNumber = await provider.getBlockNumber();
    const storageByteDeposit = CONFIG[asset].network === 'acala' ? "300000000000000" : "100000000000000";
    const ethParams = calcEthereumTransactionParams({
        gasLimit: '800000',
        validUntil: (blockNumber + 100).toString(),
        storageLimit: '600',
        txFeePerGas: '199999946752',
        storageByteDeposit
    });
    const oldMerkleTotal = oldMerkleTree.tokenTotals;
    const newMerkleTotal = newMerkleTree.tokenTotals;
    const tokens = [];
    const amounts = [];
    for (const key in newMerkleTotal) {
        let oldValue = new BN(oldMerkleTotal[key] || "0");
        let value = newMerkleTotal[key];
        let diff = new BN(value).sub(oldValue);
        tokens.push(key);
        amounts.push(diff.toString);
        console.log(key, diff.toString());
    }

    console.log(`Proposing cycle: ${currentCycle + 1}: root = ${newMerkleTree.merkleRoot}, start = ${newMerkleTree.startBlock}, end = ${newMerkleTree.endBlock}`);

    const tx1 = await merkleDistributor.proposeRoot(newMerkleTree.merkleRoot, ethers.utils.formatBytes32String(''), currentCycle + 1, newMerkleTree.startBlock, newMerkleTree.endBlock, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx1.wait();

    console.log('Cycle after proposal: ' + await merkleDistributor.currentCycle());
    console.log('Pending cycle: ' + await merkleDistributor.pendingCycle());
    console.log('Pending Merkle root: ' + await merkleDistributor.pendingMerkleRoot());
    console.log('Pending Merkle content hash: ' + await merkleDistributor.pendingMerkleContentHash());
    console.log('Last proposed start block: ' + await merkleDistributor.lastProposeStartBlock());
    console.log('Last proposed end block: ' + await merkleDistributor.lastProposeEndBlock());
    console.log('Last proposed timestamp: ' + await merkleDistributor.lastProposeTimestamp());
    console.log('Last proposed block number: ' + await merkleDistributor.lastProposeBlockNumber());
    
    console.log(`Reward collector address: ${CONFIG[asset].rewardCollector}`);
    const rewardCollector = new ethers.Contract(CONFIG[asset].rewardCollector, rewardCollectorAbi, wallet);
    const tx2 = await rewardCollector.distribute(tokens, amounts, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx2.wait();

    const tx3 = await merkleDistributor.approveRoot(newMerkleTree.merkleRoot, ethers.utils.formatBytes32String(''), currentCycle + 1, newMerkleTree.startBlock, newMerkleTree.endBlock, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx3.wait();

    console.log('Cycle after approval: ' + await merkleDistributor.currentCycle());
    console.log('Merkle root: ' + await merkleDistributor.merkleRoot());
    console.log('Merkle content hash: ' + await merkleDistributor.merkleContentHash());
    console.log('Last publish start block: ' + await merkleDistributor.lastPublishStartBlock());
    console.log('Last publish end block: ' + await merkleDistributor.lastPublishEndBlock());
    console.log('Last publish timestamp: ' + await merkleDistributor.lastPublishTimestamp());
    console.log('Last publish block number: ' + await merkleDistributor.lastPublishBlockNumber());
}
