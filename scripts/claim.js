const { WsProvider, Keyring } = require('@polkadot/api');
const { AccountSigningKey, Provider, Signer } = require("@acala-network/bodhi");
const { ethers } = require("hardhat");
require('dotenv').config();

async function main () {
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
  const distributor = MerkleDistributor.attach('0xBcFBD51aB3cEB6047100265a20486F694BCD3604').connect(wallet);

  console.log('Current cycle: ' + await distributor.currentCycle());
  const [encoded, hash] = await distributor.encodeClaim(
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ['100000000000000', '1000000000000'],
    keyring.decodeAddress('pJX8xiftB4jJPjmQkrD4G4fCTujLZajPXyek6PzPFVF6DoE'),
    0,
    2
  )
  console.log('Encoded: ' + encoded);
  console.log('Hash: ' + hash)


  const [tokens1, claimables1] = await distributor.getClaimableFor(
    keyring.decodeAddress('pJX8xiftB4jJPjmQkrD4G4fCTujLZajPXyek6PzPFVF6DoE'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ['100000000000000', '1000000000000'],
  );
  console.log('Tokens before: ' + tokens1)
  console.log('Claimables before: ' + claimables1)

  const tx1 = await distributor.claim(
    keyring.decodeAddress('pJX8xiftB4jJPjmQkrD4G4fCTujLZajPXyek6PzPFVF6DoE'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ['100000000000000', '1000000000000'],
    0,
    2,
    [
        "0x5c9e5fc45f59587eac534985f04bf7cef8d5d44ed1a7af71cf3791cfc0e5be8c", 
        "0x555cf56ff56d04d503e8b59980a1f0b606d006c73567d2e25fef22be2f305d34", 
        "0x682b49d9a769e6e651d8702402bc1ae66dea17707548c74362265b564bf5be15", 
        "0x2a2864e6e62520f06b37ab2dbf8704bf81b968028ca7d150e338fa806d372911", 
        "0xd45830e96a469787a257a87045ac1308c9cf5a43f17fef528e48eaaf378423b0", 
        "0xc55264e5b7b81850f49cc650819840b699cc964d3722198713237cf8c8a631b4", 
        "0xf0d9a7b98b02eeabbce86d17d1a7be7dd9b4080b64cc49db2c54b78d02d86f5c", 
        "0x98935e24f8d0baacebc248066dd2371902635c5edfad14d04d475d7e26c9d051", 
        "0x6f9b6ae3b1b7d45d4a9702c08f49939cbf9c65f67a2a34bb3d223680648fa62b", 
        "0x837bfa9b36f5b39b9721cb8cb5c7097e9f1684a6d48f5bfe8a5f18d90acb3601", 
        "0xb87a4083bd00e19f93a8e0e1e0e049f88f40cc1f9d127bbb4ad0e47669467898"
    ]
  );
  await tx1.wait();
  const [tokens2, claimables2] = await distributor.getClaimableFor(
    keyring.decodeAddress('pJX8xiftB4jJPjmQkrD4G4fCTujLZajPXyek6PzPFVF6DoE'),
    ['0x0000000000000000000100000000000000000084', '0x0000000000000000000300000000000000000000'],
    ['100000000000000', '1000000000000'],
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
