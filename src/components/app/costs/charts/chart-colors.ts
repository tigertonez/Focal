
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
    // Specific keywords
    "revenue": "hsl(var(--chart-1))",
    "profit": "hsl(var(--chart-4))",
    "costs": "hsl(var(--destructive))",
    "salaries": "hsl(var(--chart-2))", 
    "marketing": "hsl(var(--chart-4))",
    "deposits": "hsl(var(--chart-2))", 
    "payments": "hsl(var(--chart-5))", 
    "legal": "hsl(var(--chart-3))", 
    "software": "hsl(var(--chart-6))", 
    "admin": "hsl(var(--chart-3))",
    "buffer": "hsl(var(--muted-foreground))",
    "production": "hsl(var(--chart-3))",

    // General types
    "fixed": "hsl(var(--chart-5))",
    "variable": "hsl(var(--chart-1))",
    "operating": "hsl(var(--chart-2))",
};
