# Integrations map

How the Osmossi ERP connects to the other systems in the operation.

| System | Role in the operation | Data the ERP needs | Connection method | Status |
|---|---|---|---|---|
| **Shopify** (osmossi.myshopify.com) | System of record for products, inventory, orders, customers, payments | Products/SKUs, unit cost, inventory levels, orders, transactions and fees, refunds, payouts | Admin GraphQL API (see [shopify.md](shopify.md)) | **Primary, connector verified 2026-11-11** |
| **Lovable storefront** (osmossi.com) | Customer-facing site; reads catalog from Shopify and checks out via Shopify | Nothing directly; its sales arrive as Shopify orders (custom sales channel) | None needed (via Shopify) | Confirmed |
| **Shopify Payments** | Card processing and payouts | Processing fees per transaction, payouts to bank, chargebacks | Shopify Admin API (payments scopes) | Needs scope, see shopify.md §4 |
| **Wells Fargo** | Operating bank account | Deposits (payouts), supplier payments, expenses | CSV/OFX export upload; bank feed later | Planned (Module 4) |
| **Instagram @osmossi.purpose** | Main marketing channel | Ad spend for CAC and ROAS | Manual entry of spend at first; Meta API later if spend justifies it | Planned (Module 6) |
| **Supplier payments (cross-border)** | Paying artisans in local currency | Amount in local currency, FX rate, transfer fees | Manual entry from transfer receipts | Planned (Module 2) |

Principle: **pull, don't re-type.** If a number exists in a connected system, the ERP
imports it. Manual entry is only for data that exists nowhere else (supplier invoices,
freight and customs bills, FX rates on transfers).
