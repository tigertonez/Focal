
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
    "Salaries": "hsl(var(--chart-1))", 
    "Marketing": "hsl(var(--chart-2))",
    "Buffer": "hsl(var(--chart-3))", // For "Planning Buffer"
    "Contingency": "hsl(var(--chart-3))",
    "Deposits": "hsl(var(--chart-4))",
    "Final Payments": "hsl(var(--chart-5))", 
    "Admin": "hsl(var(--chart-6))",
    "Tools": "hsl(var(--chart-6))",
    "Overheads": "hsl(var(--chart-6))",

    // General application colors
    "Revenue": "hsl(var(--primary))",
    "Profit": "hsl(var(--accent))",
};
