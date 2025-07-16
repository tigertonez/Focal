
// A shared list of HSL color strings for charts to ensure consistency.

// Semantic color mapping can be done by checking for keywords in data keys (e.g., 'revenue', 'cost')
// and assigning a specific color from this list. A simple modulo operator can be used as a fallback.

export const chartColorVars = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export const semanticColorMap: Record<string, string> = {
    // Keywords from the new muted palette
    "salaries": "hsl(var(--chart-1))", 
    "marketing": "hsl(var(--chart-2))",
    "buffer": "hsl(var(--chart-3))", // For "Planning Buffer"
    "contingency": "hsl(var(--chart-3))",
    "deposits": "hsl(var(--chart-4))",
    "payments": "hsl(var(--chart-5))", // For "Final Payments"
    "admin": "hsl(var(--chart-6))",
    "tools": "hsl(var(--chart-6))",
    "overheads": "hsl(var(--chart-6))",

    // Legacy/General keywords
    "revenue": "hsl(var(--primary))",
    "profit": "hsl(var(--accent))",
    "costs": "hsl(var(--destructive))",
    "production": "hsl(var(--chart-5))",
    "fixed": "hsl(var(--chart-5))",
    "variable": "hsl(var(--chart-4))",
    "operating": "hsl(var(--chart-2))",
};
