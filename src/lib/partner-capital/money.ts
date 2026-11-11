/**
 * Money helpers. All amounts are integer US cents; floats are never used for money.
 */

export type Cents = number;

export function assertCents(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative whole number of cents, got ${value}`);
  }
}

export interface Weighted<Id extends string = string> {
  id: Id;
  weight: number;
}

/**
 * Split `amount` cents across `weights` in proportion to each weight, using the
 * largest-remainder method so the parts always add up exactly to `amount`.
 * Leftover cents go to the largest remainder; ties go to the larger weight, then
 * to the earlier entry in the list.
 *
 * If every weight is zero, nothing is allocated (all parts are 0).
 */
export function prorata<Id extends string>(amount: Cents, weights: Weighted<Id>[]): Map<Id, Cents> {
  assertCents(amount, "amount");
  weights.forEach((w) => assertCents(w.weight, `weight for ${w.id}`));

  const result = new Map<Id, Cents>(weights.map((w) => [w.id, 0]));
  const total = weights.reduce((sum, w) => sum + BigInt(w.weight), 0n);
  if (total === 0n || amount === 0) return result;

  const big = BigInt(amount);
  const parts = weights.map((w, index) => {
    const numerator = big * BigInt(w.weight);
    return { id: w.id, index, weight: w.weight, base: numerator / total, remainder: numerator % total };
  });

  let left = big - parts.reduce((sum, p) => sum + p.base, 0n);
  const order = [...parts].sort((a, b) =>
    a.remainder !== b.remainder
      ? a.remainder > b.remainder ? -1 : 1
      : b.weight - a.weight || a.index - b.index,
  );
  for (const p of order) {
    if (left === 0n) break;
    if (p.weight === 0) continue;
    p.base += 1n;
    left -= 1n;
  }

  for (const p of parts) result.set(p.id, Number(p.base));
  return result;
}

export function sumCents(values: Iterable<Cents>): Cents {
  let total = 0;
  for (const v of values) total += v;
  return total;
}
