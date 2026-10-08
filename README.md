# ELMALHY.3D Business Manager V2

Arabic-first, RTL web app for estimating 3D-printing costs and managing products, inventory, and orders. Designed around ELMALHY.3D and the Elegoo Neptune 4 Pro, with configurable machine assumptions.

## Run locally
1. Install Node.js 20+.
2. Run `npm test`.
3. Serve the folder over HTTP (service workers do not work reliably from `file://`): `npx serve .`
4. Open the local URL in your browser.

## Included in this V2 starter
- Pricing calculator: filament, electricity, printer depreciation, maintenance, labor, post-processing, packaging, shipping, marketing, setup, risk/waste allowance, minimum print charge/order, gross margin vs markup, discount, optional tax.
- Modes for parallel same-plate, sequential printing, and multiple plates. For parallel mode, enter the slicer's total plate time.
- Explicit warning that STL-based time/weight are estimates; G-code/slicer values should be the source of truth.
- Product catalog with SKU, cost, selling price, stock, and unit gross profit.
- Inventory for filament, hardware, packaging, and finished products, with reorder alerts.
- Order workflow, status changes, actual vs estimated cost/grams/hours, and variance.
- Local persistence, JSON backup export, basic PWA shell caching.
- Unit tests for core pricing math.

## Important limitations / next hardening phase
- This release stores data in the current browser only. It is not a multi-user database or a secure cloud backend.
- There is no server-side admin secret, because browser JavaScript cannot safely hold secrets. Before adding Google Sheets/Drive or customer-facing APIs, implement server-side authentication and authorization.
- Inventory deductions are intentionally not triggered by quote saves. Add a controlled production-consumption transaction with idempotency before relying on inventory quantities for bookkeeping.
- Validate local tax obligations and electricity tariff with your accountant/provider; tax is configurable and defaults to 0.
- The parallel-print calculation assumes the entered time is the whole plate's time. If each part's individual print time is known, calculate plate scheduling from slicer/G-code data rather than simply summing or taking a max.
- Do not treat the calculator as accounting or tax advice.

## Recommended production architecture
`src/core` contains pricing and storage logic. Expand into `models/`, `services/`, `3d/`, `inventory/`, `orders/`, and `analytics/` as the application grows. For a cloud release, use authenticated server APIs and a database such as PostgreSQL/Supabase. Keep private Drive files private; never publish customer uploads with `ANYONE_WITH_LINK` by default.

## Version
2.0.0 — independent starter build. It does not overwrite the original repository.
