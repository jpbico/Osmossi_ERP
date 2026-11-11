# Shopify integration

Shopify is the source of truth for products, inventory, orders, and payments.
The ERP **reads** from Shopify. It never writes to Shopify without explicit owner
approval of that specific change (see CLAUDE.md §6).

## 1. Store facts (from the connector, 2026-11-11)

| Item | Value |
|---|---|
| Store | Osmossi, `osmossi.myshopify.com` |
| Plan | Basic |
| Currency / timezone | USD / America/New_York |
| Locations | 1: **Boca Raton** (all inventory) |
| Products | 43 (42 active, 1 draft) |
| Suppliers (Shopify `vendor`) | **Pausayu** (25 SKUs, prefix `PAU`), **Opalo** (18 SKUs, prefix `OPA`) |
| Orders to date | 5 (Jun–Sep 2026), all through the storefront's custom sales channel |
| Payment gateway | `shopify_payments` |

## 2. Two ways Claude and the ERP talk to Shopify

| | Claude's Shopify connector | ERP app connection |
|---|---|---|
| What it is | The Shopify connector attached to Claude sessions | A Shopify **custom app** created in the Shopify admin, with its own Admin API access token |
| Used for | Analysis, data pulls, audits, seeding and checking ERP data during work sessions | The running ERP syncing data automatically, with no Claude session needed |
| Access | Read-only queries; writes only through explicit mutations | Read-only scopes listed in §3 |
| Credentials | Managed by Claude, nothing stored in this repo | Token stored as an environment secret, **never committed** |

Both use the same **Admin GraphQL API**, so queries written and tested through the
connector are reused in the ERP's sync code. The connector is pinned to API version
**2026-10**; the ERP uses the same version.

## 3. Access scopes for the ERP custom app (read-only)

| Scope | Why |
|---|---|
| `read_products` | SKUs, prices, vendor (supplier), product type |
| `read_inventory` | Inventory levels, **unit cost**, country of origin, HS code |
| `read_orders` | Orders, line items, discounts, shipping, taxes, refunds, transactions and fees |
| `read_shopify_payments_payouts` | Payouts and balance transactions, used to reconcile to Wells Fargo deposits |
| `read_shopify_payments_disputes` | Chargebacks |
| `read_locations` | Inventory location (Boca Raton) |
| `read_customers` | Only if repeat-purchase rate and LTV can't be computed from order customer IDs |

No `write_*` scopes until there's a specific, approved need.

## 4. Data mapping to ERP modules

| ERP module | Shopify data | Notes |
|---|---|---|
| 1. Products & landed cost | `products`, `variants.price`, `inventoryItem.unitCost`, `vendor` | ERP owns the **full landed cost**; Shopify `unitCost` is only an input to it. |
| 2. Suppliers | `vendor` | Map each Shopify vendor to an ERP supplier record. |
| 3. Purchasing & inventory | `inventoryLevels`, `inventoryItem` | Purchase orders and receipts live in the ERP; Shopify quantities are reconciled against them. |
| 4. Sales & reconciliation | `orders`, `transactions.fees`, `refunds`, payouts, disputes | Sales booked gross; fees, refunds, and chargebacks separately. |
| 6. KPIs | Orders, line items, customers, refunds | AOV, repeat rate, return rate, sell-through by SKU/supplier. Conversion rate needs Shopify Analytics. |

## 5. Sync design

- **Scheduled pull** (e.g. nightly, plus a "Sync now" button) using `updated_at` cursors.
  This is simple and robust at Osmossi's volume.
- **Webhooks** (`orders/create`, `orders/updated`, `refunds/create`,
  `inventory_levels/update`) added later if near-real-time data is needed.
- Every imported record keeps its Shopify GID so re-syncs update it instead of
  duplicating it.
- Imported financial data is never edited in the ERP. Corrections are made in Shopify
  and re-synced, or recorded as ERP adjustments with a reason.

## 6. Data gaps found (2026-11-11 audit), action needed

| # | Finding | Impact | Action |
|---|---|---|---|
| 1 | **Unit cost missing on 42 of 43 SKUs** | Margin can't be calculated for almost the whole catalog | Owners provide supplier price per SKU (in local currency); Module 1 captures it. |
| 2 | **PAU001 Gold Key Placemat: cost $40.00 vs. price $37.00** | Sells at a loss before any shipping or fees, **or** the cost is wrong (e.g. it may be the set-of-4 cost; PAU001X4 sells at $148) | Owners confirm the real cost per unit. |
| 3 | Country of origin and HS code empty on all SKUs | Needed for customs declarations and duty estimates | Fill in during Module 1 / supplier onboarding. |
| 4 | Payouts not readable by the connector (`read_shopify_payments` scope missing) | Payout-to-bank reconciliation not possible through the connector yet | Grant the scope to the ERP custom app (§3); use Shopify payout CSV exports meanwhile. |
| 5 | 3 of 5 orders fully refunded; some line items have no SKU, and one SKU (`WAYUU-MOCHILA-GREY`) isn't in the catalog | Looks like test or legacy orders | Owners confirm which orders are real; ERP lets you tag test orders and exclude them from KPIs. |

## 7. Observed processing fees

Fees are read per transaction from Shopify (`transactions.fees`), so the ERP doesn't
need to assume a rate. On the orders to date, they match:

| Order total | Fee charged | 2.9% + $0.30 | 3.9% + $0.30 |
|---|---|---|---|
| $18.52 | $0.84 | **$0.84** | $1.02 |
| $71.00 | $3.07 | $2.36 | **$3.07** |
| $75.62 | $3.25 | $2.49 | **$3.25** |
| $410.03 | $16.29 | $12.19 | **$16.29** |

These are **estimates of the rate structure** based on 4 orders: 2.9% + $0.30 for one
transaction and 3.9% + $0.30 for the others (typically international or premium cards).
For forecasting, use **3.9% + $0.30** as the conservative assumption until more order
history exists.

## 8. Snapshot

`data/shopify/catalog-snapshot-2026-11-11.csv` is the catalog as of this audit (SKU,
vendor, type, status, price, unit cost, inventory, origin, HS code). It contains no
customer data. It's a point-in-time reference; the live data stays in Shopify.
