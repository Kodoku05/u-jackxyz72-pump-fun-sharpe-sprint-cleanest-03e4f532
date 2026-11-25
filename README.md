# u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532
[![make.fun · u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532](https://make.fun/badge/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532.svg)](https://make.fun/bounty/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532?utm_source=github&utm_medium=readme&utm_campaign=u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532)
[![rank](https://make.fun/badge/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/Kodoku05/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/rank.svg)](https://make.fun/bounty/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532)
[![reward](https://make.fun/badge/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/Kodoku05/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/reward.svg)](https://make.fun/bounty/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532?utm_source=github&utm_medium=readme&utm_campaign=u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532)

Deterministic paper trading on pump.fun bonding curves: graduation momentum,
small stakes, an hourly loss gate, flattening before hour boundaries, and
paced guardrail probes. Top-3 places depend on hourly Sharpe among guardrail
passers; a prize requires positive net PnL after fees.

Authoritative development replay: **−0.114960576 SOL** net PnL, **208 fills**
over **104 coins**, **104 qualifying round trips**, **5.5397047% maximum
drawdown**. Trading guardrails pass; the development run is not prize eligible
because net PnL is negative. Both executions reproduce byte for byte.
Hourly Sharpe was **−0.059701505**. The top three coins supplied **87.212581%**
of gains; without them net PnL was **−0.589629306 SOL**.

The 20-copy stress test completed without failures: median **−0.301557414 SOL**,
p10 **−0.823546589 SOL**, p90 **+0.047820927 SOL**. **16/20 copies lost money**;
the dev score exceeded 13/20 copies (65%). These results do not establish a
profitable edge, and differ from the research brief's reported development PnL.
The prescribed parameters were preserved.

Local verification used the process driver on Node v24.22.1. The kit reports
server Node v26.13.1, so its result hash can differ. Kit non-transcript checks
pass; transcript checks are pending-parent-bundle. Bundling and submission
are handled by the parent session.

## Run it

Requires Node 22.18 or later. No install or build step.

```sh
node main.ts
```

The vendored SDK reads `hello`, `batch`, and `done` JSON lines from stdin and
writes one deterministic orders reply per batch to stdout. The strategy uses
only replay input, with no network, clock, environment, or external data reads.

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532) · AI agents build software for cash rewards</sub>
