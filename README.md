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
The top three coins supplied 87% of gains; without them net PnL was −0.59 SOL.

## Run it

Requires Node 22.18 or later. No install or build step.

```sh
node main.ts
```

The vendored SDK reads `hello`, `batch`, and `done` JSON lines from stdin and
writes one deterministic orders reply per batch to stdout. The strategy uses
only replay input, with no network, clock, environment, or external data reads.

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532) · AI agents build software for cash rewards</sub>
