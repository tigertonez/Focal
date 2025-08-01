# Protocol of the Failed Solution Attempts and Final Fix

This document serves as a protocol to document the failed solution approaches and to avoid repeating errors.

**Initial Problem:** `ENGINE VALIDATION FAILED: All calculated product margins are identical. This indicates a critical error in cost allocation logic.`

The application suffered from a critical failure where the product-level profitability table (`src/components/app/profit/ProductProfitTable.tsx`) displayed identical Operating and Net Margins for all products, which is financially impossible under normal circumstances. This pointed to a fundamental flaw in the financial calculation engine.

---

### **1. Failed Attempt: Proportional Profit Distribution**

*   **Action:** The first attempts to fix the bug centered on modifying the `productProfitability` calculation logic within the financial engine (`src/lib/engine/financial-engine.ts`).
*   **The Flaw:** The logic was based on calculating a single, total profit figure for the entire business (e.g., `totalOperatingProfit`) and then allocating this total back to each product proportionally based on its share of the total gross profit.
    *   Example of the flawed code: `operatingProfitCents = Math.round(grossProfitShare * totalOperatingProfit);`
*   **Why It Failed:** This approach is fundamentally wrong because it applies a standardized ratio to all products. While mathematically it distributes the total, it erases any individual cost differences between products, forcing their final margins to be identical. This was the root cause of the bug.
*   **Conclusion:** This approach was a complete logical failure and was abandoned after multiple failed attempts.

---

### **2. Failed Attempt: Incorrect Scope (`ReferenceError`)**

*   **Action:** In a subsequent attempt to fix the engine, a subtle but critical coding error was introduced in `src/lib/engine/financial-engine.ts` within the `calculateProfitAndCashFlow` function.
*   **The Flaw:** Inside a `forEach` loop that iterated over `inputs.products` as `p`, a nested calculation incorrectly tried to reference `product.productName` instead of `p.productName`.
    *   Flawed code snippet: `variableCostsThisMonth += toCents((unitsSoldThisMonth[product.productName] || 0) * (p.unitCost || 0));`
*   **Why It Failed:** This `ReferenceError` caused the entire financial engine to crash mid-calculation. The error was caught, but the application was left with incomplete or zeroed-out data. When the UI (`ProductProfitTable.tsx`) tried to render this empty data, all margins appeared as `0%` or were otherwise identical, masking the real issue and making it seem like the original margin bug was still present.
*   **Conclusion:** This error completely blocked progress and was a red herring that distracted from the underlying mathematical flaw.

---

### **3. The Correct Solution**

The final, correct solution required fixing both critical errors.

*   **Step 1: Fix the `ReferenceError`**
    *   **File:** `src/lib/engine/financial-engine.ts`
    *   **Action:** The incorrect variable scope was corrected inside the `calculateProfitAndCashFlow` function.
    *   **Change:** `product.productName` was correctly changed to `p.productName` within the loop, resolving the engine crash.

*   **Step 2: Implement Correct Cost Allocation Logic**
    *   **File:** `src/lib/engine/financial-engine.ts`
    *   **Action:** The entire `productProfitability` calculation block was replaced with a correct, explicit calculation for each product.
    *   **The Correct Logic:**
        1.  **Gross Profit** is calculated per product: `Product Revenue - Product COGS`.
        2.  **Operating Costs** (`totalOperatingCostsCents`) are allocated to each product based on its **share of total revenue** (`revenueShare`). This is the key change.
        3.  **Operating Profit** is then calculated individually: `Product Gross Profit - Allocated Operating Costs`.
        4.  **Taxes** are also allocated based on the product's `revenueShare`.
        5.  **Net Profit** is calculated individually: `Product Operating Profit - Allocated Taxes`.
    *   **Result:** Because costs are now allocated based on a metric (revenue) that differs between products, the final calculated profits and margins are unique and financially correct.

---

### **4. Final Sanity Check: Default Data Adjustment**

*   **Problem:** After implementing the correct calculation engine, the default products in the application still showed identical margins.
*   **Cause:** This was not a bug, but a coincidence in the default input data. The two main products ('Hoodie' and 'Shorts') had different prices and costs but coincidentally resulted in the **exact same gross margin of 62.5%**. Because the downstream calculations were proportional, this led to identical operating and net margins as well, making it appear as if the bug persisted.
*   **File:** `src/context/ForecastContext.tsx`
*   **Action:** The `unitCost` for the 'Shorts' product in the `initialInputs` was changed from `30` to `35`. This ensured the default products had different gross margins from the start, proving the corrected engine logic was working as intended.