# SpacelonX — Corrected Hardhat Test Suite

This package contains the reviewed and corrected test suite for `SpacelonX.sol`.

## Files

- `contracts/SpacelonX.sol` — contract source copy used for this local test run. Verify against the canonical repository before mainnet.
- `test/SpacelonX.test.js` — corrected original test suite.
- `test/SpacelonX.additional.test.js` — additional professional checks.
- `hardhat.config.js` — offline-compatible Hardhat configuration using local `solc-js` 0.8.34.
- `TEST_REPORT.md` — professional execution summary.
- `logs/slx_original_test_run.log` — first run with the original submitted tests.
- `logs/slx_corrected_test_run.log` — corrected suite result.
- `logs/slx_extended_test_run.log` — extended suite result.

## Install and run

```bash
npm install
npx hardhat test
```

Expected final result:

```text
45 passing
```

## Important

The original test suite had three vesting failures due to using 30-day months while the contract uses Solidity day constants based on 365-day years for 1/2/3/4-year schedules.
