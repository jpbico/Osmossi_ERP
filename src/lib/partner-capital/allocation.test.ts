import { describe, expect, it } from "vitest";
import { computeWaterfall, type WaterfallInput } from "./allocation";
import { prorata, sumCents } from "./money";

type P = "juanpablo" | "andrea" | "lucelly";
const equalOwnership = [
  { partnerId: "juanpablo" as P, weight: 1 },
  { partnerId: "andrea" as P, weight: 1 },
  { partnerId: "lucelly" as P, weight: 1 },
];
const obj = (m: Map<string, number>) => Object.fromEntries(m);

describe("prorata", () => {
  it("splits $1.00 three ways without losing a cent", () => {
    const r = prorata(100, [
      { id: "a", weight: 1 },
      { id: "b", weight: 1 },
      { id: "c", weight: 1 },
    ]);
    expect(obj(r)).toEqual({ a: 34, b: 33, c: 33 });
  });

  it("gives the leftover cent to the largest remainder, then the larger weight", () => {
    // 1 cent split 2:1 -> exact shares 0.667 and 0.333 -> the 2-weight gets it
    expect(obj(prorata(1, [{ id: "small", weight: 1 }, { id: "big", weight: 2 }]))).toEqual({ small: 0, big: 1 });
  });

  it("allocates nothing when all weights are zero", () => {
    expect(obj(prorata(500, [{ id: "a", weight: 0 }]))).toEqual({ a: 0 });
  });

  it("rejects fractional cents and negatives", () => {
    expect(() => prorata(10.5, [{ id: "a", weight: 1 }])).toThrow();
    expect(() => prorata(-1, [{ id: "a", weight: 1 }])).toThrow();
  });
});

describe("computeWaterfall (illustrative numbers, not real data)", () => {
  // Spec §6 example: $1,000 available, 70% to inventory.
  // Inventory on Juan Pablo's card: $3,000.
  // Other contributions: Juan Pablo $600, Andrea $300, Lucelly $100.
  const base: WaterfallInput<P> = {
    cashAvailable: 100_000,
    inventoryShareBps: 7_000,
    inventoryBalances: [{ partnerId: "juanpablo", cents: 300_000 }],
    otherBalances: [
      { partnerId: "juanpablo", cents: 60_000 },
      { partnerId: "andrea", cents: 30_000 },
      { partnerId: "lucelly", cents: 10_000 },
    ],
    ownership: equalOwnership,
  };

  it("reproduces the spec example", () => {
    const r = computeWaterfall(base);
    expect(obj(r.inventoryReturn)).toEqual({ juanpablo: 70_000 });
    expect(obj(r.otherReturn)).toEqual({ juanpablo: 18_000, andrea: 9_000, lucelly: 3_000 });
    expect(r.remainder).toBe(0);
  });

  it("moves unused inventory share to other contributions once inventory is repaid", () => {
    const r = computeWaterfall({ ...base, inventoryBalances: [{ partnerId: "juanpablo", cents: 20_000 }] });
    expect(obj(r.inventoryReturn)).toEqual({ juanpablo: 20_000 });
    // other pool = 30,000 + 50,000 unused = 80,000, split 6:3:1
    expect(obj(r.otherReturn)).toEqual({ juanpablo: 48_000, andrea: 24_000, lucelly: 8_000 });
    expect(r.remainder).toBe(0);
  });

  it("moves unused other share back to inventory still owed", () => {
    const r = computeWaterfall({
      ...base,
      otherBalances: [{ partnerId: "andrea", cents: 5_000 }],
    });
    expect(obj(r.otherReturn)).toEqual({ andrea: 5_000 });
    expect(obj(r.inventoryReturn)).toEqual({ juanpablo: 95_000 });
    expect(r.remainder).toBe(0);
  });

  it("only leaves a remainder after all contributions are returned, split by ownership", () => {
    const r = computeWaterfall({
      ...base,
      inventoryBalances: [{ partnerId: "juanpablo", cents: 50_000 }],
      otherBalances: [{ partnerId: "lucelly", cents: 40_000 }],
    });
    expect(r.remainder).toBe(10_000);
    expect(obj(r.remainderByOwnership)).toEqual({ juanpablo: 3_334, andrea: 3_333, lucelly: 3_333 });
  });

  it("explains the math in ordered steps", () => {
    const labels = computeWaterfall(base).steps.map((s) => s.label);
    expect(labels[0]).toBe("Cash available for partners");
    expect(labels.at(-1)).toMatch(/Remainder/);
  });

  it("validates inputs", () => {
    expect(() => computeWaterfall({ ...base, inventoryShareBps: 12_000 })).toThrow();
    expect(() => computeWaterfall({ ...base, cashAvailable: 99.5 })).toThrow();
  });

  it("never loses or invents a cent and never returns more than is owed (randomized)", () => {
    let seed = 42;
    const rand = (max: number) => {
      seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
      return seed % (max + 1);
    };
    const ids: P[] = ["juanpablo", "andrea", "lucelly"];
    for (let i = 0; i < 500; i++) {
      const input: WaterfallInput<P> = {
        cashAvailable: rand(2_000_000),
        inventoryShareBps: rand(10_000),
        inventoryBalances: ids.map((id) => ({ partnerId: id, cents: rand(1_000_000) })),
        otherBalances: ids.map((id) => ({ partnerId: id, cents: rand(500_000) })),
        ownership: equalOwnership,
      };
      const r = computeWaterfall(input);
      const returned = sumCents(r.inventoryReturn.values()) + sumCents(r.otherReturn.values());
      expect(returned + r.remainder).toBe(input.cashAvailable);
      expect(sumCents(r.remainderByOwnership.values())).toBe(r.remainder);
      for (const b of input.inventoryBalances) expect(r.inventoryReturn.get(b.partnerId) ?? 0).toBeLessThanOrEqual(b.cents);
      for (const b of input.otherBalances) expect(r.otherReturn.get(b.partnerId) ?? 0).toBeLessThanOrEqual(b.cents);
      const totalOwed = sumCents([...input.inventoryBalances, ...input.otherBalances].map((b) => b.cents));
      if (r.remainder > 0) expect(returned).toBe(totalOwed);
    }
  });
});
