# SpacelonX (SLX) — Smart Contract

Official smart contract for the SpacelonX community memecoin.

## ⚠️ Disclaimer

SpacelonX is an independent community / parody project. It is **NOT affiliated** with, endorsed by, or connected to Elon Musk, Tesla, SpaceX, or X Corp. This repository is provided for transparency and audit purposes. Nothing here is financial advice. Always verify the contract address before any interaction.

## Overview

SpacelonX is an ERC-20 token built on OpenZeppelin v5 contracts (ERC20, ERC20Burnable, Ownable).

| Property | Value |
|----------|-------|
| Name | SpacelonX |
| Symbol | SLX |
| Total supply | 10,000,000,000 SLX (fixed) |
| Decimals | 18 |
| Mint after deploy | None |
| Burn | Yes (ERC20Burnable) |
| Buy tax | 2% (configurable) |
| Sell tax | 3% (configurable) |
| Max tax (hard cap) | 10% — enforced on-chain, immutable |
| Vesting locked | 40% of supply across 4 schedules |

## Vesting schedules

| Allocation | % | Cliff | Vesting | Revocable |
|------------|---|-------|---------|-----------|
| Team | 15% | 12 months | 36 months | No |
| Advisors | 5% | 6 months | 24 months | Yes |
| Treasury | 15% | none | 48 months | No |
| Ecosystem | 5% | 6 months | 36 months | Yes |

## Deployment (testnet)

| Property | Value |
|----------|-------|
| Network | Polygon Amoy (testnet) |
| Contract address | 0xDBF17Cc980Ae4f7db5119e8C9c3E2AD53023aC9E |
| Solidity version | ^0.8.20 (compiled with 0.8.34) |
| Optimizer | Enabled, 200 runs |
| OpenZeppelin | Contracts v5.x |

## Verified source

https://amoy.polygonscan.com/address/0xDBF17Cc980Ae4f7db5119e8C9c3E2AD53023aC9E

## Links

- Website: https://spacelonx-site.netlify.app
- Twitter / X: https://x.com/spacelonxslx
- Telegram: https://t.me/spacelonx_community

## License

MIT