# Module 1: Partner Expenses & Reimbursements
*Gastos de socios y reembolsos*

**Status:** Draft spec, pending owner review (decisions in §9)
**Last updated:** 2026-11-11

---

## 1. Purpose

Osmossi's partners are paying company costs out of their own pockets (software
licenses, products, materials, supplies) while the store builds revenue. This module
lets each partner **log what they paid**, keeps an **auditable balance of what the
company owes each partner**, and tells the owners **how much can be paid back, and to
whom, when cash is available**, without putting the business's cash at risk.

### Examples this module must handle

| Partner | Paid for | Pattern |
|---|---|---|
| Juan Pablo (CEO, founder) | Claude AI license | Monthly subscription |
| Andrea | Canva license | Monthly subscription |
| Lucelly (founder) | ChatGPT license | Monthly subscription |
| Any partner | Products from a supplier | One-off, **inventory** (not an expense) |
| Any partner | Packaging, materials, supplies | One-off |

## 2. Users and roles

| Role | Who | Can do |
|---|---|---|
| **Partner** | Juan Pablo, Andrea, Lucelly | Log own expenses, upload receipts, see own balance and statement, see team totals |
| **Approver** | Any partner **other than** the one who paid | Approve, reject, or ask for more information on an expense |
| **Admin** | Juan Pablo (CEO), or a partner designated by the owners | Manage partners, categories, and the repayment policy; record repayments |

**Control:** nobody approves their own expense. With three partners, every expense
gets one approval from one of the other two.

## 3. What it does (minimum useful version)

1. **Log an expense in under a minute**, on phone or computer.
2. **Recurring subscriptions:** set up once (e.g. "Canva, monthly, $X"); the module
   creates a draft each month for the partner to confirm with that month's receipt.
   No retyping.
3. **Receipt attached** to every expense (photo or PDF). Required to submit.
4. **Approval** by another partner.
5. **Balance per partner:** logged, approved, repaid, and **still owed**.
6. **Repayment proposal:** given the cash available, suggest how much to repay each
   partner according to the agreed policy (§6), showing the math.
7. **Record repayments** (full or partial) and apply them to the partner's balance.
8. **Import past expenses** from the spreadsheet template
   (`templates/partner-expenses-template.csv`) so history isn't lost.
9. **Export** any list or partner statement to Excel/CSV for the CPA.

## 4. Screens

| # | Screen | Answers / does |
|---|---|---|
| 1 | **Home** | "What does the company owe me?" Your balance, items waiting for your approval, and team totals per partner. |
| 2 | **Log expense** | The form in §5. |
| 3 | **My expenses** | List with status filter; edit drafts; resubmit items returned for more information. |
| 4 | **Approvals** | Queue of other partners' expenses with the receipt shown next to the details; Approve / Reject / Ask for info (comment required on the last two). |
| 5 | **Partner statement** | Per partner, by month: opening balance, + approved expenses, − repayments, = closing balance owed. Printable and exportable. |
| 6 | **Repay partners** (admin) | Enter available cash → module proposes split per policy → admin adjusts if needed → records the payment. |
| 7 | **Settings** (admin) | Partners, categories, recurring subscriptions, repayment policy, cash reserve amount. |

## 5. The expense form

| Field | Required | Notes |
|---|---|---|
| Date paid | Yes | Defaults to today. |
| Paid by | Yes | Defaults to the signed-in partner. |
| Vendor | Yes | Who was paid (Anthropic, Canva, OpenAI, a supplier…). Suggests previous vendors. |
| Description | Yes | What and why, in plain words. |
| Category | Yes | From the list in §7. Suggested from the vendor's last category. |
| Amount and currency | Yes | Amount as paid, in the currency actually charged (USD, COP…). |
| FX rate to USD | If not USD | Pre-filled with the rate for that date; editable to match the card or bank statement. USD amount shown live. |
| Payment method | Yes | Personal card, personal bank transfer, cash. |
| Receipt | Yes | Photo or PDF. |
| Recurring? | No | Monthly or annual; creates the subscription template. |
| Related supplier / SKUs | If category is Inventory | Links the purchase to the supplier and products so it feeds product cost later. |
| Business-use only? | Yes (checkbox) | Confirms the amount is 100% business. If a license is shared with personal use, log only the business portion. |

**Validation:** amount > 0; no future dates; receipt required to submit; possible
duplicate warning (same partner, vendor, amount within 7 days).

## 6. Repayment rules

These protect cash first. **The default policy below is a proposal; the owners must
agree on it (§9).**

1. **Only approved expenses** count toward a partner's balance.
2. **Cash reserve first.** Repayments only come from cash **above** a minimum reserve
   the owners set (proposed: enough to cover the next supplier order plus one month of
   fixed costs).
3. **Business obligations first.** Supplier payments, taxes, and committed bills are
   paid before partners are repaid.
4. **Split method (choose one in Settings):**
   - **Pro-rata by balance (proposed default):** each partner gets a share of the
     available amount in proportion to what they're owed. Fair to everyone and simple to
     explain.
   - **Oldest first:** repay expenses in date order regardless of partner.
   - **Equal shares:** each partner gets the same amount until a balance reaches zero.
5. **No interest** is charged on balances unless the owners decide otherwise in writing.
6. Partial repayments are allowed and applied to the partner's oldest approved expenses
   first, so each expense shows whether it has been repaid.

### Example (illustrative numbers, not real data)

Available cash above the reserve: **$900**. Balances owed: Juan Pablo $1,200,
Andrea $300, Lucelly $500 (total $2,000).

| Partner | Owed | Share of owed | Proposed repayment | Still owed |
|---|---|---|---|---|
| Juan Pablo | $1,200 | 60% | $540 | $660 |
| Andrea | $300 | 15% | $135 | $165 |
| Lucelly | $500 | 25% | $225 | $275 |
| **Total** | **$2,000** | **100%** | **$900** | **$1,100** |

Rounding: amounts are computed in cents; any leftover cent goes to the largest balance.

## 7. Categories and accounting treatment

| Category (EN / ES) | Accounting treatment |
|---|---|
| Software & subscriptions / Software y suscripciones | Operating expense |
| Inventory purchases / Compra de inventario | **Inventory (asset)**, becomes COGS when sold; feeds product landed cost |
| Freight & customs on inventory / Fletes y aduana | **Inventory (asset)**, part of landed cost |
| Packaging & supplies / Empaques y suministros | Operating expense (or inventory if part of the product) |
| Marketing & advertising / Mercadeo y publicidad | Operating expense |
| Shipping to customers / Envíos a clientes | Operating expense (fulfillment) |
| Professional fees / Honorarios profesionales | Operating expense |
| Government fees & licenses / Licencias y trámites | Operating expense |
| Travel / Viajes | Operating expense |
| Other / Otros | Operating expense; description required |

**Journal entries** (posted when an expense is approved and when a repayment is made):

| Event | Debit | Credit |
|---|---|---|
| Expense approved | Expense account (or Inventory) | **Due to member: [partner]** (liability) |
| Repayment made | Due to member: [partner] | Cash, Wells Fargo |

Each partner has their own "Due to member" sub-account, so balances are exact.

## 8. Data model (summary)

- **partners:** name, role, ownership % (if relevant, §9), active.
- **expenses:** partner, date, vendor, description, category, amount + currency, FX
  rate + date + source, USD amount, payment method, status, linked supplier/SKUs,
  recurring template ID.
- **receipts:** file, expense ID, uploaded by, uploaded at.
- **approvals:** expense ID, approver, decision, comment, timestamp.
- **repayments:** partner, date, amount, method, bank reference.
- **repayment_allocations:** repayment ID → expense IDs and amounts.
- **recurring_templates:** partner, vendor, category, expected amount, frequency, next date.
- **audit_log:** who changed what, when (all tables).

**Statuses:** Draft → Submitted → Approved / Rejected / Needs info → Partially repaid →
Repaid. Approved expenses can't be edited; corrections are a new adjusting entry.

## 9. Decisions needed from the owners

| # | Decision | Why it matters | Proposal |
|---|---|---|---|
| 1 | **Loan or capital contribution?** Are these expenses a debt the company repays (reimbursement), or the partners' investment in the company (capital, recovered through future profit distributions by ownership %)? | Changes the accounting, the tax treatment, and who gets paid first. **Confirm with your CPA.** | Treat as **reimbursable** (liability "Due to member"), with an option to convert a balance to capital later. |
| 2 | **Repayment split method** | Determines who gets repaid how fast. | Pro-rata by balance. |
| 3 | **Cash reserve before any repayment** | Protects inventory purchases and bills. | Next supplier order + 1 month fixed costs. |
| 4 | **Ownership % and roles** of Juan Pablo, Andrea, Lucelly (is Andrea a partner/member of the LLC?) | Needed if decision 1 is "capital", and for the LLC's tax filings. | — |
| 5 | **Currencies used** by each partner when paying | Some costs may be paid in COP or other currencies. | Support any currency, convert to USD at the payment-date rate. |
| 6 | **Cut-off date** for past expenses to import | How far back to go. | From the date the LLC was formed; anything earlier flagged for the CPA as possible startup costs. |

### Tax notes to review with a CPA (not legal or tax advice)
- How a multi-member LLC's reimbursements to members are treated depends on its tax
  classification (partnership by default, or S-corp if elected). Reimbursements under a
  documented policy, with receipts, are generally not income to the member. Capital
  contributions are not deductible as such, but the underlying business expenses are.
- Costs incurred **before** the business started operating may be **startup costs**
  (generally up to $5,000 deductible in the first year, the rest amortized over 15
  years, IRC §195). Costs after operations began are ordinary expenses.
- Keep receipts for every expense; the module stores them for this reason.

## 10. Definition of done

- A partner can log a USD expense with a receipt on a phone in under a minute.
- A non-USD expense shows the USD amount and stores the rate, date, and source used.
- A partner cannot approve their own expense.
- Recurring subscriptions generate a monthly draft automatically.
- Partner statements reconcile: opening + approved − repaid = closing, for every month.
- The repayment proposal reproduces the §6 example exactly (automated test), handles
  rounding to the cent, and never proposes more than the cash available above the reserve.
- Past expenses can be imported from the CSV template, with errors reported row by row.
- All screens available in English and Spanish.
- Every list and statement exports to CSV/Excel.
