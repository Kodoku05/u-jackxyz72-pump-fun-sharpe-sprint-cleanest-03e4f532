import type { Batch, BotState, OrderInput } from './vendor/makefun-bot.ts';

/* Top-3 only, ranked by hourly Sharpe among guardrail passers; a prize
 * requires net PnL > 0. This is the risk-adjusted-consistency case, not a
 * raw-PnL race. Small stakes, hourly loss gating and pre-boundary flattening
 * seek steady realized hours; paced probes supply the round-trip guardrail.
 */
const SOL = 1e9;
type Trade = { slot: number; isBuy: boolean; solAmount: number; user: string; price: number };
type Tape = {
  trades: Trade[]; creator: string; createSlot: number; createPrice: number;
  peakPrice: number; lastPrice: number; realSol: number; creatorSellSlot: number; feeBps: number;
};
type Entry = { openedSlot: number; cost: number; probe: boolean };

class GraduationStrategy {
  tapes = new Map<string, Tape>();
  held = new Map<string, Entry>();
  coreEntered = new Set<string>();
  guardrailCoins = new Set<string>();
  coreEntries = 0;
  t0: number | null = null;
  blockTime = 0;
  hour = -1;
  hourStartEquity = 10;
  lastEquity = 10;

  updateTape(batch: Batch): void {
    for (const e of batch.events) {
      let tape = this.tapes.get(e.mint);
      if (!tape) {
        tape = { trades: [], creator: '', createSlot: e.slot, createPrice: 0,
          peakPrice: 0, lastPrice: 0, realSol: 0, creatorSellSlot: -1, feeBps: 125 };
        this.tapes.set(e.mint, tape);
      }
      if (e.event === 'CreateEvent') {
        tape.creator = e.creator;
        tape.createSlot = e.slot;
        tape.createPrice = Number(e.virtual_quote_reserves) / Number(e.virtual_token_reserves);
        tape.lastPrice = tape.createPrice;
        tape.peakPrice = Math.max(tape.peakPrice, tape.createPrice);
      } else if (e.event === 'TradeEvent') {
        const price = Number(e.virtual_quote_reserves) / Number(e.virtual_token_reserves);
        tape.lastPrice = price;
        tape.peakPrice = Math.max(tape.peakPrice, price);
        tape.realSol = Number(e.real_quote_reserves) / SOL;
        tape.feeBps = Number(e.fee_basis_points ?? 95) + Number(e.creator_fee_basis_points ?? 30);
        tape.trades.push({ slot: e.slot, isBuy: e.is_buy,
          solAmount: Number(e.sol_amount) / SOL, user: e.user, price });
        if (!e.is_buy && e.user === tape.creator) tape.creatorSellSlot = e.slot;
        // Retain the complete 60-slot window and at least the last ten trades.
        let remove = 0;
        while (remove < tape.trades.length - 10 && tape.trades[remove].slot <= batch.slot - 60) remove++;
        if (remove) tape.trades.splice(0, remove);
      }
    }
  }

  closeValue(state: BotState, mint: string): number {
    const p = state.positions.get(mint);
    const c = state.curves.get(mint);
    if (!p || !c) return 0;
    const tokens = Number(p.token_amount);
    const quote = tokens * Number(c.virtual_quote_reserves) / (Number(c.virtual_token_reserves) + tokens);
    return Math.max(0, (quote * (1 - (this.tapes.get(mint)?.feeBps ?? 125) / 10000)
      - Number(state.txFeeLamports())) / SOL);
  }

  onBatch(state: BotState, batch: Batch): OrderInput[] {
    this.updateTape(batch);
    const firstTime = batch.events[0]?.block_time;
    if (firstTime != null) {
      this.blockTime = firstTime;
      if (this.t0 === null) this.t0 = firstTime;
    }
    for (const fill of batch.fills) {
      if (fill.side === 'buy' && fill.status === 'filled' && BigInt(fill.quote_lamports) >= 10000000n)
        this.guardrailCoins.add(fill.mint);
    }
    const pendingBuy = new Set<string>();
    const pendingSell = new Set<string>();
    for (const { order } of state.pending.values()) {
      (order.side === 'buy' ? pendingBuy : pendingSell).add(order.mint);
    }
    for (const [mint, entry] of this.held) {
      if (!state.positions.has(mint) && !pendingBuy.has(mint) && batch.slot - entry.openedSlot > 4)
        this.held.delete(mint);
    }
    let equity = Number(state.cash) / SOL;
    for (const mint of state.positions.keys()) equity += this.closeValue(state, mint);
    const elapsed = this.t0 === null ? 0 : this.blockTime - this.t0;
    const hour = Math.floor(elapsed / 3600);
    const secsInHour = elapsed % 3600;
    if (hour !== this.hour) {
      this.hourStartEquity = this.lastEquity;
      this.hour = hour;
    }
    this.lastEquity = equity;
    const hourPnl = equity - this.hourStartEquity;
    const flatten = secsInHour >= 3300;
    const orders: OrderInput[] = [];
    let freeCash = state.freeCashLamports();
    const tx = state.txFeeLamports();
    const orderCap = state.hello.caps.max_orders_per_batch;
    for (const [mint, entry] of this.held) {
      const position = state.positions.get(mint);
      if (!position || pendingSell.has(mint)) continue;
      const tape = this.tapes.get(mint);
      const exit = entry.probe || flatten || this.closeValue(state, mint) <= entry.cost * 0.88
        || batch.slot - entry.openedSlot >= 600
        || (tape?.creatorSellSlot ?? -1) > entry.openedSlot;
      if (exit && orders.length < orderCap && freeCash >= tx) {
        orders.push({ side: 'sell', mint, token_amount: position.token_amount, max_slippage_bps: 10000 });
        freeCash -= tx;
      }
    }
    if (this.t0 === null || flatten || hourPnl <= -0.08) return orders;

    let newEntries = 0;
    let exposure = 0;
    for (const entry of this.held.values()) exposure += entry.cost;
    const buy = (mint: string, stake: bigint, minimum: bigint, probe: boolean): boolean => {
      if ((!probe && newEntries >= 2) || orders.length >= orderCap || (!probe && this.coreEntered.has(mint))
        || this.held.has(mint) || state.positions.has(mint)
        || state.committedPositionCount() + newEntries >= state.hello.caps.max_open_positions) return false;
      const cap = state.maxBuyLamports(mint);
      const amount = stake < cap ? stake : cap;
      if (amount < minimum || freeCash < amount + tx || exposure + Number(amount) / SOL > 1.2) return false;
      orders.push({ side: 'buy', mint, quote_lamports: amount, max_slippage_bps: 800 });
      const cost = Number(amount + tx) / SOL;
      this.held.set(mint, { openedSlot: batch.slot, cost, probe });
      if (!probe) this.coreEntered.add(mint);
      exposure += cost;
      freeCash -= amount + tx;
      if (!probe) newEntries++;
      return true;
    };
    const considered = new Set<string>();
    for (const event of batch.events) {
      const mint = event.mint;
      if (considered.has(mint)) continue;
      considered.add(mint);
      const tape = this.tapes.get(mint)!;
      if (state.curves.get(mint)?.complete || this.coreEntered.has(mint)) continue;
      const window = tape.trades.filter(t => t.slot > batch.slot - 60);
      const flow = window.reduce((sum, t) => sum + (t.isBuy ? t.solAmount : -t.solAmount), 0);
      const core = window.length >= 3 && batch.slot - tape.createSlot >= 50 && tape.realSol >= 45 && flow >= 3;
      const fallback = window.length >= 3 && hour >= 2 && this.coreEntries < 3 && tape.realSol >= 35 && flow >= 3
        && window.length > 0 && tape.lastPrice / window[0].price - 1 >= 0.2;
      if (core && buy(mint, 300000000n, 12000000n, false)) this.coreEntries++;
      else if (!core && fallback) buy(mint, 100000000n, 12000000n, false);
    }
    const paceTarget = Math.min(26, Math.ceil(26 * (hour + 1) / 6));
    if (this.guardrailCoins.size < 26 && this.guardrailCoins.size < paceTarget) {
      let bestMint: string | null = null;
      let bestScore = -Infinity;
      for (const [mint, tape] of this.tapes) {
        if (this.held.has(mint) || this.guardrailCoins.has(mint)
          || state.positions.has(mint) || state.curves.get(mint)?.complete || tape.realSol < 3) continue;
        const score = tape.realSol + tape.trades.slice(-10)
          .reduce((sum, t) => sum + (t.isBuy ? t.solAmount : -t.solAmount), 0);
        if (score > bestScore) { bestMint = mint; bestScore = score; }
      }
      if (bestMint !== null) buy(bestMint, 12000000n, 11000000n, true);
    }
    return orders;
  }
}

export const strategy = new GraduationStrategy();
