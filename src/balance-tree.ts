import MerkleTree from './merkle-tree'
import { BigNumber, utils } from 'ethers'

export default class BalanceTree {
  private readonly tree: MerkleTree
  constructor(balances: { account: string; amount: BigNumber, expiry: BigNumber }[]) {
    this.tree = new MerkleTree(
      balances.map(({ account, amount, expiry}, index) => {
        return BalanceTree.toNode(index, account, amount, expiry)
      })
    )
  }

  public static verifyProof(
    index: number | BigNumber,
    account: string,
    amount: BigNumber,
    expiry: BigNumber,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = BalanceTree.toNode(index, account, amount, expiry)
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item)
    }

    return pair.equals(root)
  }

  // keccak256(abi.encode(index, account, amount))
  public static toNode(index: number | BigNumber, account: string, amount: BigNumber, expiry: BigNumber): Buffer {
    return Buffer.from(
      utils.solidityKeccak256(['uint256', 'address', 'uint256', 'uint256'], [index, account, amount, expiry]).substr(2),
      'hex'
    )
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot()
  }

  // returns the hex bytes32 values of the proof
  public getProof(index: number | BigNumber, account: string, amount: BigNumber, expiry: BigNumber): string[] {
    return this.tree.getHexProof(BalanceTree.toNode(index, account, amount, expiry))
  }
}
