
export const translations = {
  en: {
    nav: {
      inputs: 'Inputs',
      revenue: 'Revenue',
      costs: 'Costs',
      profit: 'Profit',
      cashFlow: 'Cash Flow',
      summary: 'Summary',
      askAI: 'Ask AI',
      toggleLanguage: 'Sprache wechseln',
    },
    toasts: {
      draftLoadedTitle: "Draft loaded",
      draftLoadedDescription: "Your previous session has been restored.",
      saveErrorTitle: "Cannot save draft",
      saveErrorDescription: "Please fix the errors on the input sheet before saving.",
      draftSavedTitle: "Draft saved!",
      draftSavedDescription: "Your inputs have been saved to this browser.",
      saveFailedTitle: "Save failed",
      saveFailedDescription: "Could not save draft to local storage.",
    },
    inputs: {
        title: "Input Sheet",
        description: "Define your forecast assumptions",
        products: {
            title: "Products & Services",
            addProduct: "Add Product / Service",
            productName: "Product / Service Name",
            plannedUnits: "Planned Units",
            units: "units",
            unitCost: "Unit Cost",
            sellPrice: "Sales Price",
            deposit: "Deposit %",
            depositTooltip: "The percentage of the total production cost you pay to your supplier up-front as a deposit. The rest is paid upon delivery.",
            estimatedSales: "Estimated Sales (Units)",
            saleMonth: "Sale Month",
            sellThrough: "Sell-Through %",
            sellThroughTooltip: "The percentage of your total planned stock that you expect to sell. A crucial driver for your revenue forecast.",
            salesModel: {
                title: "Sales Model",
                tooltip: "How sales are distributed over time. 'Launch' is front-loaded, 'Even' is stable, 'Seasonal' peaks mid-period, and 'Growth' increases steadily.",
                launch: "Launch",
                even: "Even",
                seasonal: "Seasonal",
                growth: "Growth",
            }
        },
        fixedCosts: {
            title: "Fixed Costs",
            addFixedCost: "Add Fixed Cost",
            costName: "Cost Name (e.g., Salaries)",
            amount: "Amount",
            total: "Total",
            perMonth: "/ month",
            paymentSchedule: {
                title: "Payment Schedule",
                upFront: "Paid Up-Front",
                monthly: "Allocated Monthly",
                quarterly: "Allocated Quarterly",
                accordingToSales: "Allocated According to Sales",
            },
            startIn: {
                title: "Start In",
                upFront: "Up-front (in M0)",
                month0: "Month 0 Onward",
                month1: "Month 1 Onward",
            },
            planningBuffer: "A contingency fund for unexpected costs. Typically set at 10-20% of total fixed costs to provide a safety net for your forecast."
        },
        parameters: {
            title: "General Parameters",
            forecastMonths: {
                label: "Forecast Months",
                tooltip: "How many months into the future to forecast.",
            },
            taxRate: {
                label: "Tax Rate %",
                tooltip: "Your estimated corporate tax rate.",
            },
            currency: "Currency",
            preOrder: {
                title: "Pre-Order Mode",
                tooltip: "Enables a 'Month 0' for pre-launch costs (e.g., deposits) and revenue before the main forecast begins in Month 1.",
                badge: "+ Month 0",
            },
        },
        realtime: {
            title: "Realtime Settings",
            dataSource: "Data Source",
            manual: "Manual Forecast",
            comingSoon: "Coming Soon",
            apiKeyPlaceholder: "Required for data source",
        },
        footer: {
            saveDraft: "Save Draft",
            getReport: "Get Report",
        }
    }
  },
  de: {
    nav: {
      inputs: 'Eingaben',
      revenue: 'Umsatz',
      costs: 'Kosten',
      profit: 'Gewinn',
      cashFlow: 'Cashflow',
      summary: 'Zusammenfassung',
      askAI: 'KI fragen',
      toggleLanguage: 'Switch Language',
    },
    toasts: {
      draftLoadedTitle: "Entwurf geladen",
      draftLoadedDescription: "Ihre vorherige Sitzung wurde wiederhergestellt.",
      saveErrorTitle: "Entwurf kann nicht gespeichert werden",
      saveErrorDescription: "Bitte beheben Sie die Fehler im Eingabeblatt vor dem Speichern.",
      draftSavedTitle: "Entwurf gespeichert!",
      draftSavedDescription: "Ihre Eingaben wurden in diesem Browser gespeichert.",
      saveFailedTitle: "Speichern fehlgeschlagen",
      saveFailedDescription: "Der Entwurf konnte nicht im lokalen Speicher gesichert werden.",
    },
    inputs: {
        title: "Eingabeblatt",
        description: "Definieren Sie Ihre Prognose-Annahmen",
        products: {
            title: "Produkte & Dienstleistungen",
            addProduct: "Produkt / Dienstleistung hinzufügen",
            productName: "Produkt- / Dienstleistungsname",
            plannedUnits: "Geplante Einheiten",
            units: "Stück",
            unitCost: "Stückkosten",
            sellPrice: "Verkaufspreis",
            deposit: "Anzahlung %",
            depositTooltip: "Der Prozentsatz der gesamten Produktionskosten, den Sie Ihrem Lieferanten im Voraus als Anzahlung leisten. Der Rest wird bei Lieferung bezahlt.",
            estimatedSales: "Geschätzter Absatz (Einheiten)",
            saleMonth: "Verkaufsmonat",
            sellThrough: "Abverkaufsrate %",
            sellThroughTooltip: "Der Prozentsatz Ihres geplanten Lagerbestands, den Sie voraussichtlich verkaufen werden. Ein entscheidender Faktor für Ihre Umsatzprognose.",
            salesModel: {
                title: "Verkaufsmodell",
                tooltip: "Wie sich der Umsatz über die Zeit verteilt. 'Launch' ist zu Beginn hoch, 'Even' ist stabil, 'Seasonal' hat Spitzen in der Mitte des Zeitraums und 'Growth' steigt stetig an.",
                launch: "Launch",
                even: "Gleichmäßig",
                seasonal: "Saisonal",
                growth: "Wachstum",
            }
        },
        fixedCosts: {
            title: "Fixkosten",
            addFixedCost: "Fixkosten hinzufügen",
            costName: "Kostenart (z.B. Gehälter)",
            amount: "Betrag",
            total: "Gesamt",
            perMonth: "/ Monat",
            paymentSchedule: {
                title: "Zahlungsplan",
                upFront: "Vorauszahlung",
                monthly: "Monatlich zugewiesen",
                quarterly: "Quartalsweise zugewiesen",
                accordingToSales: "Umsatzabhängig zugewiesen",
            },
            startIn: {
                title: "Beginnt in",
                upFront: "Vorauszahlung (in M0)",
                month0: "Ab Monat 0",
                month1: "Ab Monat 1",
            },
            planningBuffer: "Ein Notfallfonds für unerwartete Kosten. Typischerweise 10-20% der gesamten Fixkosten, um ein Sicherheitsnetz für Ihre Prognose zu schaffen."
        },
        parameters: {
            title: "Allgemeine Parameter",
            forecastMonths: {
                label: "Prognosemonate",
                tooltip: "Wie viele Monate in die Zukunft prognostiziert werden soll.",
            },
            taxRate: {
                label: "Steuersatz %",
                tooltip: "Ihr geschätzter Körperschaftsteuersatz.",
            },
            currency: "Währung",
            preOrder: {
                title: "Vorbestellungsmodus",
                tooltip: "Aktiviert einen 'Monat 0' für Kosten (z.B. Anzahlungen) und Einnahmen vor Beginn der Hauptprognose in Monat 1.",
                badge: "+ Monat 0",
            },
        },
        realtime: {
            title: "Echtzeit-Einstellungen",
            dataSource: "Datenquelle",
            manual: "Manuelle Prognose",
            comingSoon: "Bald verfügbar",
            apiKeyPlaceholder: "Erforderlich für Datenquelle",
        },
        footer: {
            saveDraft: "Entwurf speichern",
            getReport: "Bericht erstellen",
        }
    }
  },
};

export type Translations = typeof translations;
