const { WsProvider, Keyring } = require('@polkadot/api');
const { AccountSigningKey, Provider, Signer } = require("@acala-network/bodhi");
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  const provider = new Provider({
    provider: new WsProvider('wss://mandala-tc7-rpcnode.aca-dev.network/ws'),
  });
  await provider.api.isReady;

  const keyring = new Keyring({ type: 'sr25519' })
  const pair = keyring.addFromUri(process.env.POLKADOT_SEED);
  const signingKey = new AccountSigningKey(provider.api.registry);
  signingKey.addKeyringPair(pair);

  const wallet = new Signer(provider, pair.address, signingKey);
  const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
  const distributor = MerkleDistributor.attach('0x77C3248643130b594385386453e7263dBF23C1cF').connect(wallet);

  console.log('Current cycle: ' + await distributor.currentCycle());
  // const [encoded, hash] = await distributor.encodeClaim(
  //   ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
  //   ["3258820501819154", "500000"],
  //   keyring.decodeAddress('5FLatVBwAAfjX7yKt2d1TGZWJFxNC9yAnRzxxyQbQQeRg6My'),
  //   0,
  //   2
  // )
  // console.log('Encoded: ' + encoded);
  // console.log('Hash: ' + hash)


  const [tokens1, claimables1] = await distributor.getClaimableFor(
    keyring.decodeAddress('5FLatVBwAAfjX7yKt2d1TGZWJFxNC9yAnRzxxyQbQQeRg6My'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ["3258820501819154", "500000"],
  );
  console.log('Tokens before: ' + tokens1)
  console.log('Claimables before: ' + claimables1)

  const tx1 = await distributor.claim(
    keyring.decodeAddress('5FLatVBwAAfjX7yKt2d1TGZWJFxNC9yAnRzxxyQbQQeRg6My'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ["3258820501819154", "500000"],
    6,
    1,
    [
      "0xbf3385a55c723d270b2c5ee84eaf9f228c958dd96040993d5905328e05e8e02b", "0x4f76bedb6181ce24267b08c6eab7cf58f7d66cc28664af623f5206e4e44547a6", "0xd6ba004383e27a60a3501c2ccdf01417585dbc66351750069941d6ca3666f7b9", "0x8fecc8911e5f6fa4e90f9f99c338153c755f1fb2fb9aa873e4870847db116bbe", "0x8c78d25f66b216ad9f9de0334947494bd401d290e07ba84a1788f1a6750368bb", "0x6719400a4843c1847dc41c6cb6a6899016d04e64504c18d3af77bf4f9fa8d53b", "0x2ec7ae796781aa5a113f51e1576e171d00ce6ec4f8951b7de1dff9b23a396a08", "0x74651498c62beee6ddd725fbfdeba4fe5bbecc494754fbf61f3856f7f9f23c7a", "0xabd405a09a42ed21a5c08814878a48fedabc3245a625e9a51039a3cb781c2b6d", "0x367c066d828ef99e6414fdf82bd846b6c0208c16bb2ca1ac7928883ef3364e52", "0x76f79aab0efe7fc2434ca4d10993a5ddc46821ad9c7288d53b975fb140381570"
    ]
  );
  await tx1.wait();
  const [tokens2, claimables2] = await distributor.getClaimableFor(
    keyring.decodeAddress('5FLatVBwAAfjX7yKt2d1TGZWJFxNC9yAnRzxxyQbQQeRg6My'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ["3258820501819154", "500000"],
  );
  console.log('Tokens after: ' + tokens2)
  console.log('Claimables after: ' + claimables2)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
