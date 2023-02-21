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

export const submitMerkle = async (asset: string, automated: boolean) => {

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
    const feeTokens = [];
    const feeAmounts = [];
    const otherTokens = [];
    const otherAmounts = [];
    for (const key in newMerkleTotal) {
        let oldValue = new BN(oldMerkleTotal[key] || "0");
        let value = newMerkleTotal[key];
        let diff = new BN(value).sub(oldValue);
        if (diff.gt(new BN(0))) {
            if (key == CONFIG[asset].feeAddress) {
                feeTokens.push(key);
                feeAmounts.push(diff.toString());
            } else {
                otherTokens.push(key);
                otherAmounts.push(diff.toString());
            }
            console.log(key, diff.toString());
        }
    }
    console.log(`feeTokens: ${feeTokens}, feeAmounts: ${feeAmounts}, otherTokens: ${otherTokens}, otherAmounts: ${otherAmounts}`);
    console.log(`Reward collector address for fee/yield: ${CONFIG[asset].rewardCollectorForFee}`);
    if (CONFIG[asset].rewardCollectorForOther) {
        console.log(`Reward collector address for other: ${CONFIG[asset].rewardCollectorForOther}`);
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


    if (automated) {
        console.log(`Reward collector address for fee/yield: ${CONFIG[asset].rewardCollectorForFee}`);
        const rewardCollector = new ethers.Contract(CONFIG[asset].rewardCollectorForFee, rewardCollectorAbi, wallet);
        const roleAddress = '0x99537d82F6F4AAD1419dD14952B512c7959A2904';
        const role1 = await rewardCollector.DISTRIBUTOR_ROLE();
        console.log('Proposal role: ' + role1)
        console.log('Has role: ' + await rewardCollector.hasRole(role1, roleAddress));
        const tx2 = await rewardCollector.distribute(CONFIG[asset].merkleDistributor, feeTokens, feeAmounts, {
            gasPrice: ethParams.txGasPrice,
            gasLimit: ethParams.txGasLimit,
        });
        await tx2.wait();
        console.log("fee/yield distributed");
        if (CONFIG[asset].rewardCollectorForOther) {
            console.log(`Reward collector address for other: ${CONFIG[asset].rewardCollectorForOther}`);
            const rewardCollector = new ethers.Contract(CONFIG[asset].rewardCollectorForOther, rewardCollectorAbi, wallet);
            const roleAddress = '0x99537d82F6F4AAD1419dD14952B512c7959A2904';
            const role1 = await rewardCollector.DISTRIBUTOR_ROLE();
            console.log('Proposal role: ' + role1)
            console.log('Has role: ' + await rewardCollector.hasRole(role1, roleAddress));
            const tx2 = await rewardCollector.distribute(CONFIG[asset].merkleDistributor, otherTokens, otherAmounts, {
                gasPrice: ethParams.txGasPrice,
                gasLimit: ethParams.txGasLimit,
            });
            await tx2.wait();
            console.log("other rewards distributed");
        }

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
}
