import { calcEthereumTransactionParams } from "@acala-network/eth-providers";
import { ethers } from "ethers";
import { abi } from "./merkle-distributor.abi";
import { CONFIG } from "./config";
import * as fs from 'fs';
import { getFile } from "./lib/s3_utils";

export const submitMerkle = async (asset: string) => {

    // Get the current cycle
    const provider = new Provider({
        provider: new WsProvider("wss://karura.api.onfinality.io/public-ws") 
    });
    await provider.api.isReady;
    const merkleDistributor = new ethers.Contract(CONFIG[asset].merkleDistributor, abi, provider);
    const currentCycle = (await merkleDistributor.currentCycle()).toNumber();

    const newMerkleFile = `merkles/${CONFIG[asset].network}_${asset}_${currentCycle + 1}.json`;
    const newMerkle = await getFile(newMerkleFile);
    const newMerkleTree = JSON.parse(newMerkle);

    const blockNumber = await provider.getBlockNumber();
    const storageByteDeposit = CONFIG[asset].network === 'acala' ? "300000000000000" : "100000000000000";
    const ethParams = calcEthereumTransactionParams({
        gasLimit: '800000',
        validUntil: (blockNumber + 100).toString(),
        storageLimit: '600',
        txFeePerGas: '199999946752',
        storageByteDeposit
    });

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

    const tx2 = await merkleDistributor.approveRoot(newMerkleTree.merkleRoot, ethers.utils.formatBytes32String(''), currentCycle + 1, newMerkleTree.startBlock, newMerkleTree.endBlock, {
        gasPrice: ethParams.txGasPrice,
        gasLimit: ethParams.txGasLimit,
    });
    await tx2.wait();

    console.log('Cycle after approval: ' + await merkleDistributor.currentCycle());
    console.log('Merkle root: ' + await merkleDistributor.merkleRoot());
    console.log('Merkle content hash: ' + await merkleDistributor.merkleContentHash());
    console.log('Last publish start block: ' + await merkleDistributor.lastPublishStartBlock());
    console.log('Last publish end block: ' + await merkleDistributor.lastPublishEndBlock());
    console.log('Last publish timestamp: ' + await merkleDistributor.lastPublishTimestamp());
    console.log('Last publish block number: ' + await merkleDistributor.lastPublishBlockNumber());
}