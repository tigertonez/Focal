# Protokoll der fehlgeschlagenen Lösungsversuche

Dieses Dokument dient als Protokoll, um fehlgeschlagene Lösungsansätze zu dokumentieren und eine Wiederholung von Fehlern zu vermeiden.

## Problem: `ENGINE VALIDATION FAILED: All calculated product margins are identical`

Die Anwendung litt unter einem kritischen Fehler, bei dem die Tabelle zur Produktrentabilität (`src/components/app/profit/ProductProfitTable.tsx`) für alle Produkte identische Betriebs- und Nettomargen anzeigte, was unter normalen Umständen finanziell unmöglich ist. Dies deutete auf einen grundlegenden Fehler in der Finanzberechnungs-Engine hin.

### 1. Fehlgeschlagener Versuch: Proportionale Gewinnverteilung

*   **Aktion:** Die ersten Versuche, den Fehler zu beheben, konzentrierten sich auf die Änderung der Berechnungslogik von `productProfitability` in der Finanz-Engine (`src/lib/engine/financial-engine.ts`).
*   **Der Fehler:** Die Logik basierte darauf, eine einzige, gesamte Gewinnzahl für das gesamte Unternehmen (z. B. `totalOperatingProfit`) zu berechnen und diese Gesamtsumme dann proportional auf jedes Produkt basierend auf seinem Anteil am gesamten Bruttogewinn zurück zu verteilen.
    *   Beispiel für den fehlerhaften Code: `operatingProfitCents = Math.round(grossProfitShare * totalOperatingProfit);`
*   **Warum es fehlschlug:** Dieser Ansatz ist grundlegend falsch, da er ein standardisiertes Verhältnis auf alle Produkte anwendet. Obwohl er die Gesamtsumme mathematisch verteilt, eliminiert er alle individuellen Kostenunterschiede zwischen den Produkten, was dazu führt, dass ihre Endmargen identisch sein müssen. Dies war die Hauptursache des Fehlers.
*   **Schlussfolgerung:** Dieser Ansatz war ein vollständiger logischer Fehlschlag und wurde nach mehreren erfolglosen Versuchen aufgegeben.

### 2. Fehlgeschlagener Versuch: Falscher Geltungsbereich (`ReferenceError`)

*   **Aktion:** Bei einem nachfolgenden Versuch, die Engine zu reparieren, wurde ein subtiler, aber kritischer Programmierfehler in der Funktion `calculateProfitAndCashFlow` in `src/lib/engine/financial-engine.ts` eingeführt.
*   **Der Fehler:** Innerhalb einer `forEach`-Schleife, die über `inputs.products` als `p` iterierte, versuchte eine verschachtelte Berechnung fälschlicherweise, auf `product.productName` anstatt auf `p.productName` zuzugreifen.
*   **Fehlerhafter Codeausschnitt:** `variableCostsThisMonth += toCents((unitsSoldThisMonth[product.productName] || 0) * (p.unitCost || 0));`
*   **Warum es fehlschlug:** Dieser `ReferenceError` führte dazu, dass die gesamte Finanz-Engine mitten in der Berechnung abstürzte. Der Fehler wurde abgefangen, aber die Anwendung blieb mit unvollständigen oder auf Null gesetzten Daten zurück. Als die Benutzeroberfläche (`ProductProfitTable.tsx`) versuchte, diese leeren Daten darzustellen, erschienen alle Margen als `0%` oder waren anderweitig identisch, was das eigentliche Problem verschleierte und den Anschein erweckte, der ursprüngliche Margenfehler sei immer noch vorhanden.
*   **Schlussfolgerung:** Dieser Fehler blockierte den Fortschritt vollständig und war eine falsche Fährte, die vom eigentlichen mathematischen Fehler ablenkte.

### 3. Die korrekte Lösung

Die endgültige, korrekte Lösung erforderte die Behebung beider kritischer Fehler.

*   **Schritt 1: Behebung des `ReferenceError`**
    *   **Datei:** `src/lib/engine/financial-engine.ts`
    *   **Aktion:** Der falsche Variablenbereich wurde innerhalb der `calculateProfitAndCashFlow`-Funktion korrigiert.
    *   **Änderung:** `product.productName` wurde innerhalb der Schleife korrekt in `p.productName` geändert, wodurch der Absturz der Engine behoben wurde.

*   **Schritt 2: Implementierung der korrekten Kostenverteilungslogik**
    *   **Datei:** `src/lib/engine/financial-engine.ts`
    *   **Aktion:** Der gesamte Berechnungsblock `productProfitability` wurde durch eine korrekte, explizite Berechnung für jedes Produkt ersetzt.
    *   **Die korrekte Logik:**
        1.  Der **Bruttogewinn** wird pro Produkt berechnet: `Produktumsatz - Produkt-COGS`.
        2.  Die **Betriebskosten** (`totalOperatingCostsCents`) werden jedem Produkt basierend auf seinem **Anteil am Gesamtumsatz** (`revenueShare`) zugewiesen. Dies ist die entscheidende Änderung.
        3.  Der **Betriebsgewinn** wird dann einzeln berechnet: `Produkt-Bruttogewinn - Zugeordnete Betriebskosten`.
        4.  Die **Steuern** werden ebenfalls basierend auf dem `revenueShare` des Produkts zugewiesen.
        5.  Der **Nettogewinn** wird einzeln berechnet: `Produkt-Betriebsgewinn - Zugeordnete Steuern`.
    *   **Ergebnis:** Da die Kosten nun auf einer Metrik (Umsatz) basieren, die sich zwischen den Produkten unterscheidet, sind die endgültig berechneten Gewinne und Margen einzigartig und finanziell korrekt.

### 4. Letzte Überprüfung: Anpassung der Standarddaten

*   **Problem:** Nach der Implementierung der korrekten Berechnungs-Engine zeigten die Standardprodukte in der Anwendung immer noch identische Margen.
*   **Ursache:** Dies war kein Fehler, sondern ein Zufall in den Standard-Eingabedaten. Die beiden Hauptprodukte ('Hoodie' und 'Shorts') hatten unterschiedliche Preise und Kosten, was aber zufällig zur **exakt gleichen Bruttomarge von 62,5 %** führte. Da die nachgelagerten Berechnungen proportional waren, führte dies auch zu identischen Betriebs- und Nettomargen, was den Anschein erweckte, der Fehler bestünde weiterhin.
*   **Datei:** `src/context/ForecastContext.tsx`
*   **Aktion:** Die `unitCost` für das 'Shorts'-Produkt in den `initialInputs` wurde von `30` auf `35` geändert. Dadurch wurde sichergestellt, dass die Standardprodukte von Anfang an unterschiedliche Bruttomargen hatten, was bewies, dass die korrigierte Engine-Logik wie beabsichtigt funktionierte.
