
// This file is being created to centralize chart color definitions.

export const chartColorVars = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

export const productColorVars = [
    "hsl(217, 91%, 60%)", // Primary Blue
    "hsl(217, 80%, 75%)", // Lighter Blue
    "hsl(217, 95%, 45%)", // Darker Blue
    "hsl(210, 90%, 55%)", // Sky Blue
    "hsl(225, 85%, 65%)", // Indigo Blue
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
