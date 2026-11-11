# Module 1: Partner Contributions & Capital Returns
*Aportes de socios y devolución de capital*

**Status:** Spec approved in principle (owner decisions 2026-11-11); open items in §9
**Last updated:** 2026-11-11

---

## 1. Purpose

Osmossi's partners are paying company costs out of their own pockets (software
licenses, products, materials, supplies) while the store builds revenue. **These
payments are the partners' investment in the company (capital contributions).**

This module lets each partner **log what they contributed**, keeps an **auditable capital
account per partner**, and, when sales bring in cash, **calculates how much of each
partner's contributions to return, and in what order**, according to the policy agreed
by the owners (§6).

### Partners

| Partner | Role | Ownership |
|---|---|---|
| Juan Pablo | CEO, founder | ⅓ (33.3%) |
| Andrea | Marketing | ⅓ (33.3%) |
| Lucelly | Operations, founder | ⅓ (33.3%) |

### Examples this module must handle

| Partner | Paid for | Pattern | Pool (§6) |
|---|---|---|---|
| Juan Pablo | Claude AI license | Monthly subscription | Other contributions |
| Juan Pablo | Lovable license | Monthly subscription | Other contributions |
| Andrea | Canva license | Monthly subscription | Other contributions |
| Lucelly | ChatGPT license | Monthly subscription | Other contributions |
| Juan Pablo | Products from suppliers, on his credit card | One-off purchases | **Inventory contributions** |
| Any partner | Packaging, materials, supplies | One-off | Other contributions |

## 2. Users and roles

| Role | Who | Can do |
|---|---|---|
| **Partner** | Juan Pablo, Andrea, Lucelly | Log own contributions, upload receipts, see own capital account, see team totals |
| **Approver** | Any partner **other than** the one who paid | Approve, reject, or ask for more information |
| **Admin** | Juan Pablo (CEO) | Manage partners, categories, and policy settings; run the capital-return calculation; record payments |

**Control:** nobody approves their own contribution. With three partners, every entry
gets one approval from one of the other two. The capital-return calculation is run by
the admin and the result is visible to all partners.

## 3. What it does (minimum useful version)

1. **Log a contribution in under a minute**, on phone or computer.
2. **Recurring subscriptions:** set up once (e.g. "Canva, monthly"); the module creates
   a draft each month for the partner to confirm with that month's receipt.
3. **Receipt attached** to every entry (photo or PDF). Required to submit.
4. **Approval** by another partner.
5. **Capital account per partner:** contributed, approved, returned, and **still to
   return**, split into *inventory* and *other* contributions.
6. **Capital-return calculation:** the admin enters the cash available from sales for
   the period; the module applies the policy in §6 and shows exactly how much goes to
   each partner and why.
7. **Record payments** (full or partial) and apply them to the partner's balance.
8. **Import past contributions since January 1, 2026** from the spreadsheet template
   (`templates/partner-expenses-template.csv`).
9. **Export** any list or partner statement to Excel/CSV for the CPA.

## 4. Screens

| # | Screen | Answers / does |
|---|---|---|
| 1 | **Home** | "How much have I put in, and how much has been returned?" Your capital account, items waiting for your approval, team totals. |
| 2 | **Log contribution** | The form in §5. |
| 3 | **My contributions** | List with status filter; edit drafts; resubmit items returned for more information. |
| 4 | **Approvals** | Queue of other partners' entries with the receipt shown next to the details; Approve / Reject / Ask for info (comment required on the last two). |
| 5 | **Capital accounts** | Per partner, by month: opening balance, + approved contributions, − returns, = closing balance to return. Inventory and other shown separately. Printable and exportable. |
| 6 | **Return capital** (admin) | Enter cash available → module proposes the split per §6 with the math shown → admin confirms → records the payments. |
| 7 | **Settings** (admin) | Partners and ownership, categories, recurring subscriptions, inventory share %. |

## 5. The contribution form

| Field | Required | Notes |
|---|---|---|
| Date paid | Yes | Defaults to today. Not before 2026-01-01 or in the future. |
| Paid by | Yes | Defaults to the signed-in partner. |
| Vendor | Yes | Who was paid (Anthropic, Lovable, Canva, OpenAI, a supplier…). Suggests previous vendors. |
| Description | Yes | What and why, in plain words. |
| Category | Yes | From the list in §7, which decides the pool (inventory or other). Suggested from the vendor's last category. |
| Amount and currency | Yes | Amount as paid, in the currency actually charged (USD, COP…). |
| FX rate to USD | If not USD | Pre-filled with the rate for that date; editable to match the card or bank statement. USD amount shown live. |
| Payment method | Yes | Personal credit card, personal debit/bank transfer, cash. |
| Receipt | Yes | Photo or PDF. |
| Recurring? | No | Monthly or annual; creates the subscription template. |
| Related supplier / SKUs | If inventory | Links the purchase to the supplier and products so it feeds product cost (Module 2). |
| Business-use only? | Yes (checkbox) | Confirms the amount is 100% business. If a license is shared with personal use, log only the business portion. |

**Validation:** amount > 0; date between 2026-01-01 and today; receipt required to
submit; possible-duplicate warning (same partner, vendor, amount within 7 days).

## 6. Capital-return policy (agreed 2026-11-11)

1. **Contributions are investment.** Only *approved* contributions count.
2. **No minimum cash reserve.** The admin decides each period how much cash from sales
   is available for partners. Sales tax collected is **never** available: it belongs to
   the state and is set aside automatically. Shopify fees and refunds are already netted out.
3. **Return contributions before any profit split.** Cash available is used to return
   contributions first. Profit is split by ownership (⅓ each) only after **all**
   contributions are returned.
4. **Inventory gets the larger share.** Products are currently bought on Juan Pablo's
   personal credit card, so a configurable share of the cash available (**proposed:
   70%**) goes to returning **inventory contributions**. The rest (**30%**) returns **other
   contributions** (licenses, supplies…) **pro-rata to what each partner is owed**.
5. **Nothing sits idle.** When one pool is fully returned, its share flows to the other
   pool. When both are fully returned, the remainder is shown split ⅓ each as a
   proposal; the owners decide whether to distribute it or keep it in the company.
6. **Rounding:** all math in cents; leftover cents go to the largest remainder, then the
   largest balance. The total returned always equals the cash available, to the cent.
7. **No interest** on contributions unless the owners decide otherwise in writing.
8. Partial returns are applied to each partner's oldest approved contributions first,
   so each entry shows whether it has been returned.

The rules are implemented and tested in `src/lib/partner-capital/allocation.ts`.

### Example (illustrative numbers, not real data)

Cash available: **$1,000**. Inventory share: **70%**.
Still to return: inventory on Juan Pablo's card **$3,000**; other contributions Juan Pablo
**$600**, Andrea **$300**, Lucelly **$100**.

| Step | Calculation | Amount |
|---|---|---|
| Inventory share | $1,000 × 70% | $700 |
| Other share | $1,000 − $700 | $300 |

| Partner | Inventory return | Other return (owed share) | Total this period |
|---|---|---|---|
| Juan Pablo | $700 | $180 (60%) | $880 |
| Andrea | — | $90 (30%) | $90 |
| Lucelly | — | $30 (10%) | $30 |
| **Total** | **$700** | **$300** | **$1,000** |

### Why 70%
Paying down the credit card fast is cheaper for everyone: credit card interest is
typically far higher than any other cost of capital the business has. 70% also keeps
some money flowing back to all three partners from the first sale. The percentage is a
setting and can be changed each period.

**Check built in:** if the inventory share for a period is less than the product cost
of the units sold, the module warns that inventory is being repaid more slowly than it
is being sold.

## 7. Categories and accounting treatment

| Category (EN / ES) | Pool | Accounting treatment |
|---|---|---|
| Inventory purchases / Compra de inventario | Inventory | **Inventory (asset)**, becomes COGS when sold; feeds product landed cost |
| Freight & customs on inventory / Fletes y aduana | Inventory | **Inventory (asset)**, part of landed cost |
| Software & subscriptions / Software y suscripciones | Other | Operating expense |
| Packaging & supplies / Empaques y suministros | Other | Operating expense (or inventory if part of the product) |
| Marketing & advertising / Mercadeo y publicidad | Other | Operating expense |
| Shipping to customers / Envíos a clientes | Other | Operating expense (fulfillment) |
| Professional fees / Honorarios profesionales | Other | Operating expense |
| Government fees & licenses / Licencias y trámites | Other | Operating expense |
| Travel / Viajes | Other | Operating expense |
| Other / Otros | Other | Operating expense; description required |

**Journal entries:**

| Event | Debit | Credit |
|---|---|---|
| Contribution approved | Expense account (or Inventory) | **Member capital, contributions: [partner]** (equity) |
| Capital returned | **Member capital, distributions: [partner]** (equity) | Cash, Wells Fargo |

Each partner has their own capital sub-accounts, so every balance is exact.

## 8. Data model (summary)

Built on Lovable Cloud (Supabase Postgres) using the same patterns as the storefront
(see CLAUDE.md §7).

- **partners:** name, role, ownership weight, linked user account, active.
- **contributions:** partner, date, vendor, description, category, pool, amount +
  currency, FX rate + date + source, USD cents, payment method, status, linked
  supplier/SKUs, recurring template ID.
- **receipts:** file in private storage, contribution ID, uploaded by, uploaded at.
- **approvals:** contribution ID, approver, decision, comment, timestamp.
- **capital_return_runs:** period, cash available, inventory share, computed split and
  steps (stored as calculated, so the decision is auditable), confirmed by, at.
- **capital_returns:** partner, run ID, date, amount, pool, bank reference.
- **return_allocations:** capital return → contribution IDs and amounts.
- **recurring_templates:** partner, vendor, category, expected amount, frequency, next date.
- **audit_log:** who changed what, when (all tables).

**Statuses:** Draft → Submitted → Approved / Rejected / Needs info → Partially returned
→ Returned. Approved entries can't be edited; corrections are a new adjusting entry.

## 9. Decisions

| # | Decision | Status |
|---|---|---|
| 1 | Contributions are **investment (capital)** | **Decided** |
| 2 | Return contributions **pro-rata to what each is owed**, before any profit split | **Decided** |
| 3 | **No cash reserve**; larger share of cash to inventory on Juan Pablo's card | **Decided**; share proposed at **70%**, owners to confirm |
| 4 | Roles and ownership: Juan Pablo CEO, Andrea marketing, Lucelly operations; ⅓ each | **Decided** |
| 5 | Import contributions since **2026-01-01** (operations began in 2026) | **Decided** |
| 6 | Tech stack | **Decided**: reuse the storefront's stack and Lovable Cloud (CLAUDE.md §7) |
| 7 | Is the credit card paid in full each month, or does it carry interest? If it carries interest, should interest charges be logged as contributions? | **Open** |

### To review with a CPA and attorney (not legal or tax advice)
- **Write the policy into the LLC operating agreement.** Returning capital in proportion
  to what each partner contributed, before splitting profit ⅓ each, is common, but for a
  multi-member LLC it must match the operating agreement and how capital accounts are kept
  for tax purposes. Partners contributing unequal amounts while owning equal shares is
  exactly the case where this matters.
- Returns of capital are generally not taxable to the partner up to their basis;
  profit allocations are taxed to each partner whether or not cash is distributed. The
  CPA should confirm the treatment for Osmossi's tax classification.
- Costs incurred **before** the business began operating may be **startup costs**
  (generally up to $5,000 deductible in the first year, the rest amortized over 15
  years, IRC §195). Since operations began in 2026, the CPA should confirm the start date.
- Keep a receipt for every contribution; the module stores them for this reason.

## 10. Definition of done

- A partner can log a USD contribution with a receipt on a phone in under a minute.
- A non-USD contribution shows the USD amount and stores the rate, date, and source used.
- A partner cannot approve their own contribution.
- Recurring subscriptions generate a monthly draft automatically.
- Capital accounts reconcile: opening + approved − returned = closing, for every month and pool.
- The capital-return calculation reproduces the §6 example exactly, never returns more
  than is owed, and the total always equals the cash available to the cent (automated tests).
- Past contributions since 2026-01-01 import from the CSV template, with errors reported row by row.
- All screens available in English and Spanish.
- Every list and statement exports to CSV/Excel.
- Only signed-in partners can see any data; receipts are in private storage.
