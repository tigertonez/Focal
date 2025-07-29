# Protokoll der fehlgeschlagenen Lösungsversuche

Dieses Dokument dient als Protokoll, um fehlgeschlagene Lösungsansätze zu dokumentieren und eine Wiederholung von Fehlern zu vermeiden.

## Problem: `npm install` schlägt fehl & `Module not found` Build-Fehler

Die Anwendung litt unter einer Kombination von Problemen, die zu Build-Fehlern und fehlgeschlagenen `npm install`-Befehlen führten.

### 1. Fehlgeschlagener Versuch: PDF-Generierung mit `jspdf`

*   **Aktion:** Es wurde versucht, eine PDF-Download-Funktion mit den Bibliotheken `html2canvas` und `jspdf` zu implementieren.
*   **Fehler:** Der Build schlug mit der Meldung `Module not found: Can't resolve 'jspdf'` fehl.
*   **Ursache:** Die `jspdf`-Abhängigkeit wurde zwar im Code (`DownloadReportButton.tsx`) importiert, aber **nicht** in der `package.json` deklariert. Dadurch wurde das Paket nie installiert.
*   **Ergebnis:** Dieser Ansatz führte zu einer Endlosschleife von Build-Fehlern, da das Kernproblem der fehlenden Abhängigkeit zunächst übersehen wurde.
*   **Schlussfolgerung:** Jede neue clientseitige Bibliothek, die verwendet wird, MUSS korrekt in `package.json` deklariert werden. Dieser Versuch wurde vollständig zurückgenommen.

### 2. Fehlgeschlagener Versuch: Behebung von `genkit`-Abhängigkeitskonflikten

*   **Aktion:** Es wurde mehrfach versucht, die `ERESOLVE`- und `ETARGET`-Fehler von `npm` durch Anpassung der `genkit`-Paketversionen in `package.json` zu beheben.
*   **Fehler:** `npm install` schlug wiederholt fehl. Der Log zeigte einen unlösbaren Konflikt: `@genkit-ai/next@1.15.x` benötigt `next@^15.0.0`, während das Projekt `next@14.2.4` verwendet. Gleichzeitig gab es Konflikte zwischen den `genkit`-Versionen selbst.
*   **Ursache:** Es wurde fälschlicherweise versucht, die `@genkit-ai/`-Pakete auf neuere Versionen zu aktualisieren, ohne die Inkompatibilität mit der bestehenden Next.js-Version zu berücksichtigen. Die Versuche, die Versionen manuell anzugleichen, führten zu weiteren Konflikten.
*   **Ergebnis:** Die `package.json` geriet in einen instabilen Zustand. Die Abhängigkeitsprobleme wurden nicht gelöst.
*   **Schlussfolgerung:** Eine einfache Aktualisierung von Teilen eines Frameworks wie Genkit ohne Berücksichtigung der Peer-Dependencies (insbesondere `next`) ist nicht möglich. Der richtige Ansatz muss darin bestehen, einen Satz von Versionen zu finden, die nachweislich miteinander kompatibel sind.

**Nächster strategischer Schritt:** Basierend auf diesen Erkenntnissen wurde entschieden, alle `jspdf`-Änderungen zu verwerfen und die `genkit`-Versionen auf einen bekanntermaßen stabilen und kompatiblen Stand zurückzusetzen, der zu `next@14.2.4` passt.
