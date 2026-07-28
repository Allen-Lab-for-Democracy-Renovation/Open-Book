# Sutton Live-Site Review (2026-07-14)

## Evidence boundary

This review uses the public deployment at
<https://finance.suttonma.gov/openbook> as the product reference. The Sutton
source fork and the older static portal are intentionally excluded from the
review and implementation decisions below.

The deployment was inspected with Playwright at desktop and 393px mobile
widths. Public navigation, view toggles, search, column controls, hierarchy
expansion, exports, project rows, mobile navigation, and wide tables were
exercised directly.

## Observed public behavior

| Public route | Directly observed behavior |
| --- | --- |
| [`/openbook`](https://finance.suttonma.gov/openbook) | FY2027 at-a-glance figures, a guided budget narrative, expense and revenue balance, capital summary, reserve summary, and links into every explorer. |
| [`/openbook/expenses`](https://finance.suttonma.gov/openbook/expenses) | Function/type views, multi-year trend/growth controls, explicit Budget and Actual columns, show/hide column controls, hierarchical Function Area -> Department -> Location -> Category rows, branch-preserving search, collapse controls, and CSV export. Searching `Police` reduced the visible result from 9 function areas to 3 while retaining matching parent context. |
| [`/openbook/revenues`](https://finance.suttonma.gov/openbook/revenues) | Category/subcategory views, multi-year Budget and Actual columns, hierarchical search, show/hide columns, collapse controls, explanatory context, and CSV export. |
| [`/openbook/capital`](https://finance.suttonma.gov/openbook/capital) | 90 projects over four fiscal years, department/funding-source modes, a four-year stacked comparison, funding explanations, fiscal-year project groups, expandable project rows, and CSV export. |
| [`/openbook/reserves`](https://finance.suttonma.gov/openbook/reserves) | Seven funds over 18 fiscal years, latest total and change, largest fund, proportional fund breakdown, stacked historical trend, category summary, full historical table, and CSV export. |
| [`/openbook/documents`](https://finance.suttonma.gov/openbook/documents) | A document-library shell with one published FY2025 audit PDF. Copy refers residents to an FAQ form that is not present. |
| [`/openbook/budget-book`](https://finance.suttonma.gov/openbook/budget-book) | Generated printable FY2027 book with executive totals, detailed expense hierarchy, revenue detail, capital projects, and Print / Save as PDF. |
| [`/openbook/faq`](https://finance.suttonma.gov/openbook/faq) | Empty published state: no FAQs and no contact form. |

## Responsive and runtime findings

- Wide expense tables remain inside an `overflow-x: auto` container. At 393px,
  the document width remained 393px while the table itself was 1650px wide.
- The headline counters animate from partial values to the final values. They
  completed correctly during this review.
- No browser console errors or warnings were recorded.
- The live mobile drawer has a stacking defect when opened over the expense
  table: underlying table cells intercept navigation taps. This behavior must
  not be copied.
- Scroll-reveal effects can leave blank regions in full-page captures. They are
  presentation-specific and are not an implementation target.

## Clean-main comparison

The clean OpenBook baseline already provides searchable/exportable public
tables, expense and revenue summaries, trend charts, capital data, supporting
documents, FAQs, a printable budget book, admin upload/mapping, and responsive
navigation.

The reusable gaps demonstrated by the live deployment are:

1. Expense and revenue detail must preserve separate Budget and Actual series
   instead of combining them into one fiscal-year value.
2. Column controls must identify the fiscal year and series type explicitly.
3. Hierarchical search must retain matching ancestors without displaying every
   unrelated group and subtotal.
4. Hierarchical tables need collapse controls.
5. Capital needs a multi-year comparison and department/funding-source modes.
6. Reserves need a complete public explorer and an upload path that recognizes
   balance columns.
7. The overview should surface operating balance, capital, and reserves when
   those datasets exist.

## Implementation mapping

| Live evidence | Reusable implementation |
| --- | --- |
| Expenses and Revenues show `FY2025 Budget` and `FY2025 Actual` independently. | Build typed financial columns from stored `fiscalYear` + `amountType`; use them in tables and exports; never add Budget and Actual together. |
| Search for `Police` retains Public Safety context and removes unrelated branches. | Add branch-preserving hierarchical filtering to the shared budget table. |
| Expense and Revenue explorers expose Columns and Collapse controls. | Generalize shared table controls for typed columns and hierarchy collapse. |
| Capital switches between Department and Funding and compares four years. | Add a reusable ranked breakdown toggle plus a stacked multi-year capital chart. |
| Reserves presents totals, fund/category composition, trend, detail, and CSV. | Add a generic reserves route, navigation entry, aggregation helpers, upload validation, balance-column detection, and overview summary. |
| Overview connects budget, revenue, capital, reserves, documents, and budget book. | Add compact operating balance, capital, and reserve sections to the existing overview without copying Sutton branding or prose. |

## Explicit exclusions

- Sutton seal, aerial imagery, green/gold styling, town-specific copy, and town
  financial values.
- The live drawer and scroll-reveal behavior.
- The empty FAQ state and the Documents-to-FAQ form mismatch.
- Any inference from private deployment configuration or source code.
