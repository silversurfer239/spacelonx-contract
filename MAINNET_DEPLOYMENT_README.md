# SpacelonX (SLX) — Polygon Mainnet Deployment Package

This folder is a complete Hardhat project skeleton for testing, deploying and verifying the SpacelonX smart contract on Polygon mainnet.

## Included

- `contracts/SpacelonX.sol`
- `test/SpacelonX.test.js`
- `test/SpacelonX.additional.test.js`
- `hardhat.config.js`
- `scripts/deploy.js`
- `scripts/verify.js`
- `.env.example`
- `.gitignore`
- `TEST_REPORT.md`
- `README_TEST_REVIEW.md`
- logs from the previous professional test review

## Public deployment parameters

Constructor order:

1. `_taxWallet`
2. `_teamWallet`
3. `_advisorsWallet`
4. `_treasuryWallet`
5. `_ecosystemWallet`

Values hardcoded in `scripts/deploy.js`:

```text
TaxWallet:       0x3495c5F376c4EDeA3E62c3db5Bead33CB0415e81
TeamWallet:      0xd6E08c315703f9b0858d3F3dD8401bfAA515647e
AdvisorsWallet:  0x3a6DAD51c5711df3B147A5386c3FB5fC367424a3
TreasuryWallet:  0xd327f5a85b63ecd09e464298f3F5Dd5B0C859FdA
EcosystemWallet: 0x4b6ddF23729C1b42E717639C30A35d1e6C55f884
```

Expected deployer / initial owner:

```text
0x111829B2F80760Db1cFb51106b1a2d64FD1139f0
```

The deployment script stops if the signer address is not this deployer address on Polygon mainnet.

## Install

```bash
npm install
```

## Run tests

```bash
npm run compile
npm test
```

Expected result from reviewed suite:

```text
45 passing
0 failing
```

## Prepare `.env`

Copy `.env.example` to `.env` on your local computer only.

Never upload `.env` to GitHub.

```bash
cp .env.example .env
```

Fill:

```text
PRIVATE_KEY=...
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=...
```

## Deploy to Polygon mainnet

Only run this when the wallet, gas balance, tests and parameters are confirmed.

```bash
npm run deploy:polygon
```

Save immediately:

- deployed contract address;
- deployment transaction hash;
- deployer / owner address;
- date and time.

## Verify on Polygonscan

After deployment, add the new address into `.env`:

```text
SLX_MAINNET_ADDRESS=0x...
```

Then run:

```bash
npm run verify:polygon
```

## Post-deployment checklist

- Confirm contract source is verified on Polygonscan.
- Confirm total supply and owner.
- Confirm vesting schedules.
- Create SLX / POL liquidity pool.
- Add liquidity.
- Lock LP tokens.
- Publish lock proof and contract address on website, Telegram and X.

## Security note

This package contains no private key. Any real `.env` file must remain local only.
