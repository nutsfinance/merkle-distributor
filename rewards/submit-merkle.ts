import { calcEthereumTransactionParams } from "@acala-network/eth-providers";
import { WsProvider } from "@polkadot/api";
import { BodhiProvider } from "@acala-network/bodhi";
import { ethers } from "ethers";
import { merkletDistributorAbi } from "./merkle-distributor.abi";
import { rewardCollectorAbi } from "./reward-collector.abi";
import { rewardCollectorAggregatorAbi } from "./reward-collector-aggregator.abi";
import { CONFIG } from "./config";
import { getFile } from "./lib/aws_utils";
import { BN } from 'bn.js'
import * as dotenv from 'dotenv';

dotenv.config();

export const submitMerkle = async (asset: string, automated: boolean) => {

    // Get the current cycle
    let provider;
    if (asset != "tdot") {
        provider = new BodhiProvider({
            provider: new WsProvider("wss://karura-rpc-3.aca-api.network/ws")
        });
    } else {
        provider = new BodhiProvider({
            provider: new WsProvider("wss://acala-rpc-3.aca-api.network/ws") 
        });
    }
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC!).connect(provider);
    console.log(`Signing address: ${wallet.address}`);

    await provider.isReady();
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
        if (CONFIG[asset].aggregator) {
            console.log(`Reward collector aggregator address: ${CONFIG[asset].aggregator}`);
            const aggregator = new ethers.Contract(CONFIG[asset].aggregator, rewardCollectorAggregatorAbi, wallet);
            const roleAddress = '0x99537d82F6F4AAD1419dD14952B512c7959A2904';
            const role1 = await aggregator.DISTRIBUTOR_ROLE();
            console.log('Proposal role: ' + role1)
            console.log('Has role: ' + await aggregator.hasRole(role1, roleAddress));
            const tx2 = await aggregator.distribute(CONFIG[asset].merkleDistributor, CONFIG[asset].rewardCollectorForFee, 
                CONFIG[asset].rewardCollectorForOther,
                feeTokens, feeAmounts, otherTokens, otherAmounts, {
                gasPrice: ethParams.txGasPrice,
                gasLimit: ethParams.txGasLimit,
            });
            await tx2.wait();
            console.log("all rewards distributed");
        } else {
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

        if (asset == "tdot") {
            const claimAddress = '5EMjsd17QbANZBFZMkSfPbvNpijT1qR9r5BwoaoNV6deeRFo';
            const evmAddress = '0x65766d3ae1bd4306a178f86a9214c39abcd53d021bedb0f90000000000000000';
            const claim = newMerkleTree.claims[claimAddress];
            if (claim) {
                const tx4 = await merkleDistributor.claim(evmAddress, claim.tokens, claim.cumulativeAmounts, claim.index, claim.cycle, claim.proof, {
                    gasPrice: ethParams.txGasPrice,
                    gasLimit: ethParams.txGasLimit,
                });
                await tx4.wait();
                console.log('Claimed tDOT for ' + claimAddress);
            }
        }
        const claimAddress = '5ChQuE91nkwu2C2LF3j8BUgBfCcrMR7CLDaR9rvLmyZLJ7hq';
        const evmAddress = '0x1bff005918ab80f8f3b16fdd0722654a62aeb0d2ffd11b895fc305a77dee6933';
        const claim = newMerkleTree.claims[claimAddress];
        if (claim) {
            const tx4 = await merkleDistributor.claim(evmAddress, claim.tokens, claim.cumulativeAmounts, claim.index, claim.cycle, claim.proof, {
                gasPrice: ethParams.txGasPrice,
                    gasLimit: ethParams.txGasLimit,
            });
            await tx4.wait();
            console.log('Claimed tDOT for ' + claimAddress);
        }
    }
}
