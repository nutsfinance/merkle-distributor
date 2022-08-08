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
  //   keyring.decodeAddress('5Fq8tS415SUAuokTX5UnBsefN1w2zVLqDMFqgKBK5wGRMdgX'),
  //   0,
  //   2
  // )
  // console.log('Encoded: ' + encoded);
  // console.log('Hash: ' + hash)


  const [tokens1, claimables1] = await distributor.getClaimableFor(
    keyring.decodeAddress('5Fq8tS415SUAuokTX5UnBsefN1w2zVLqDMFqgKBK5wGRMdgX'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ["3258820501819154","1100000"],
  );
  console.log('Tokens before: ' + tokens1)
  console.log('Claimables before: ' + claimables1)

  const tx1 = await distributor.claim(
    keyring.decodeAddress('5Fq8tS415SUAuokTX5UnBsefN1w2zVLqDMFqgKBK5wGRMdgX'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ["3258820501819154","1100000"],
    0,
    5,
    [
      "0x1251152446f42efb1229b718adc452eee78d2990b67e762af9ccbea2a87a676c","0xab7b4552de8dec8b785d20b7b3bf64c71841476ba27f8a7499257bb43d0c6a58","0xa2e42ac6b7ad6372f63f64ab5f75938121c713a4545a045915e942ff90e6a6ae","0x240eb8d08e96e514935812b1749247878825562f0bbbd32ea3c169286270f707","0x8a3d1953b2b118478f9d3277df7e99fa785686a9f9180875acc4e87b6b237908","0xc93b9453b905c7e8ca56f9bf98ff8d71c090198e7a4a14e174041f5a1d660cca","0xf0331407d85b49fee6f49d77102ba1ca64f57089bd5648fb6ec28194452c4000","0x306952088c23bb3145ea5e443dee06fb36adf521c0ef6202b4f63fab8cc53baf","0xca6e833d5277a552777971c056df3c04ba368f5864a8be7577b5fb6e8800f2f8","0xc2a47cc5d4bf9823a9cee82be1309c6e4582368cbd57e0085692816a1edf9114","0xe92acbf01362e691a1759d2f25e4e1d55696f5f8bb6f5a04afb899e3c0954d03"
    ]
  );
  await tx1.wait();
  const [tokens2, claimables2] = await distributor.getClaimableFor(
    keyring.decodeAddress('5Fq8tS415SUAuokTX5UnBsefN1w2zVLqDMFqgKBK5wGRMdgX'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ["3258820501819154","1100000"],
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
