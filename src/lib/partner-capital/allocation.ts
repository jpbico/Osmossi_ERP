/**
 * Partner capital return ("waterfall") for Osmossi.
 *
 * Policy agreed by the owners (2026-11-11), see docs/modules/01-partner-expenses.md §6:
 *  - Everything partners paid is a capital contribution (investment).
 *  - Cash available for partners is first used to RETURN contributions, before any
 *    profit distribution by ownership.
 *  - A larger, configurable share goes to returning INVENTORY contributions
 *    (products bought on a partner's credit card); the rest returns all OTHER
 *    contributions (licenses, supplies...) pro-rata to what each partner is owed.
 *  - If one pool is fully returned, its unused share flows to the other pool.
 *  - Only once all contributions are returned does a remainder exist; it is shown
 *    split by ownership as a PROPOSAL (owners decide to distribute or keep it).
 */

import { assertCents, prorata, sumCents, type Cents } from "./money";

export interface PartnerBalance<Id extends string = string> {
  partnerId: Id;
  /** Contributions not yet returned, in cents. */
  cents: Cents;
}

export interface OwnershipShare<Id extends string = string> {
  partnerId: Id;
  /** Relative weight; equal partners can all use 1. */
  weight: number;
}

export interface WaterfallInput<Id extends string = string> {
  /** Cash the owners decided is available for partners this period, in cents. */
  cashAvailable: Cents;
  /** Share of cash for inventory contributions, in basis points (7000 = 70%). */
  inventoryShareBps: number;
  inventoryBalances: PartnerBalance<Id>[];
  otherBalances: PartnerBalance<Id>[];
  ownership: OwnershipShare<Id>[];
}

export interface WaterfallStep {
  label: string;
  amount: Cents;
}

export interface WaterfallResult<Id extends string = string> {
  inventoryReturn: Map<Id, Cents>;
  otherReturn: Map<Id, Cents>;
  /** Cash left after every contribution is returned. */
  remainder: Cents;
  /** Proposed split of the remainder by ownership (not automatically paid). */
  remainderByOwnership: Map<Id, Cents>;
  /** Ordered explanation of the math, for "show the math" in the UI. */
  steps: WaterfallStep[];
}

function add<Id extends string>(a: Map<Id, Cents>, b: Map<Id, Cents>): Map<Id, Cents> {
  const out = new Map(a);
  for (const [id, v] of b) out.set(id, (out.get(id) ?? 0) + v);
  return out;
}

function returnPool<Id extends string>(amount: Cents, balances: PartnerBalance<Id>[]) {
  const owed = sumCents(balances.map((b) => b.cents));
  const paid = Math.min(amount, owed);
  const split = prorata(paid, balances.map((b) => ({ id: b.partnerId, weight: b.cents })));
  return { paid, unused: amount - paid, split };
}

export function computeWaterfall<Id extends string>(input: WaterfallInput<Id>): WaterfallResult<Id> {
  const { cashAvailable, inventoryShareBps, inventoryBalances, otherBalances, ownership } = input;
  assertCents(cashAvailable, "cashAvailable");
  if (!Number.isInteger(inventoryShareBps) || inventoryShareBps < 0 || inventoryShareBps > 10_000) {
    throw new Error(`inventoryShareBps must be between 0 and 10000, got ${inventoryShareBps}`);
  }
  inventoryBalances.forEach((b) => assertCents(b.cents, `inventory balance for ${b.partnerId}`));
  otherBalances.forEach((b) => assertCents(b.cents, `other balance for ${b.partnerId}`));

  const steps: WaterfallStep[] = [];
  const inventoryTarget = Math.floor((cashAvailable * inventoryShareBps) / 10_000);
  const otherTarget = cashAvailable - inventoryTarget;
  steps.push({ label: "Cash available for partners", amount: cashAvailable });
  steps.push({ label: `Inventory share (${inventoryShareBps / 100}%)`, amount: inventoryTarget });
  steps.push({ label: "Other contributions share", amount: otherTarget });

  // 1. Inventory pool.
  const inv1 = returnPool(inventoryTarget, inventoryBalances);
  steps.push({ label: "Returned: inventory contributions", amount: inv1.paid });

  // 2. Other pool, plus any unused inventory share.
  const otherPool = otherTarget + inv1.unused;
  if (inv1.unused > 0) steps.push({ label: "Unused inventory share moved to other contributions", amount: inv1.unused });
  const other = returnPool(otherPool, otherBalances);
  steps.push({ label: "Returned: other contributions (pro-rata to amount owed)", amount: other.paid });

  // 3. Unused other share flows back to any inventory still owed.
  const inventoryStillOwed = inventoryBalances.map((b) => ({
    partnerId: b.partnerId,
    cents: b.cents - (inv1.split.get(b.partnerId) ?? 0),
  }));
  const inv2 = returnPool(other.unused, inventoryStillOwed);
  if (inv2.paid > 0) steps.push({ label: "Unused other share moved to inventory contributions", amount: inv2.paid });

  // 4. Remainder: only after all contributions are returned.
  const remainder = inv2.unused;
  const remainderByOwnership = prorata(remainder, ownership.map((o) => ({ id: o.partnerId, weight: o.weight })));
  steps.push({ label: "Remainder (all contributions returned): owners decide", amount: remainder });

  return {
    inventoryReturn: add(inv1.split, inv2.split),
    otherReturn: other.split,
    remainder,
    remainderByOwnership,
    steps,
  };
}
