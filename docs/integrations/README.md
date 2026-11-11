# Integrations map

How the Osmossi ERP connects to the other systems in the operation.

| System | Role in the operation | Data the ERP needs | Connection method | Status |
|---|---|---|---|---|
| **Shopify** (osmossi.myshopify.com) | System of record for products, inventory, orders, customers, payments | Products/SKUs, unit cost, inventory levels, orders, transactions and fees, refunds, payouts | Admin GraphQL API (see [shopify.md](shopify.md)) | **Primary, connector verified 2026-11-11** |
| **Lovable storefront** (osmossi.com) | Customer-facing site on Lovable Cloud; reads catalog from Shopify and checks out via Shopify | Sales arrive as Shopify orders. Site activity (visits, cart funnel) for conversion-rate KPIs | Shopify for sales; storefront's owner-only MCP tools for activity (see [lovable.md](lovable.md)) | Confirmed |
| **Lovable platform** | Builds and hosts the storefront; proposed host for the ERP | Stack, auth/roles pattern, edge-function patterns, brand | Lovable connector; ERP reuses the same stack on its own Lovable Cloud database ([lovable.md](lovable.md)) | ERP project created 2026-11-11 (option A) |
| **Shopify Payments** | Card processing and payouts | Processing fees per transaction, payouts to bank, chargebacks | Shopify Admin API (payments scopes) | Needs scope, see shopify.md §3 and §6 |
| **Wells Fargo** | Operating bank account | Deposits (payouts), supplier payments, expenses | CSV/OFX export upload; bank feed later | Planned (Module 5) |
| **Instagram @osmossi.purpose** | Main marketing channel | Ad spend for CAC and ROAS | Manual entry of spend at first; Meta API later if spend justifies it | Planned (Module 7) |
| **Partner contributions** | Partners paying company costs personally (Claude, Lovable, Canva, ChatGPT; products on Juan Pablo's credit card; supplies) | Amount, currency, receipt, partner | Logged in Module 1 | Spec approved; capital-return logic built and tested |
| **Supplier payments (cross-border)** | Paying artisans in local currency | Amount in local currency, FX rate, transfer fees | Manual entry from transfer receipts | Planned (Modules 1 and 3) |

Principle: **pull, don't re-type.** If a number exists in a connected system, the ERP
imports it. Manual entry is only for data that exists nowhere else (supplier invoices,
freight and customs bills, FX rates on transfers).
