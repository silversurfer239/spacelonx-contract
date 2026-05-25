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

40% of total supply is locked in vesting at deployment. Vesting is **linear from deployment time** (`startTime`), with no tokens released before the cliff ends. At the end of the cliff, the amount accrued so far becomes releasable.

| Allocation | % | Cliff | Fully vested at | Revocable |
|------------|---|-------|-----------------|-----------|
| Team | 15% | 12 months | month 36 (from deploy) | No |
| Advisors | 5% | 6 months | month 24 (from deploy) | Yes |
| Treasury | 15% | none | month 48 (from deploy) | No |
| Ecosystem | 5% | 6 months | month 36 (from deploy) | Yes |

> Note: durations are counted from deployment, not added after the cliff. Example: Team has a 12-month cliff and is fully vested at month 36 (total), so a proportional amount becomes releasable when the cliff ends.


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