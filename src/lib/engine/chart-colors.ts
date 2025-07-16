
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
    "hsl(217, 50%, 70%)", // Muted Lighter Blue
    "hsl(217, 40%, 50%)", // Muted Darker Blue
    "hsl(210, 60%, 65%)", // Muted Sky Blue
    "hsl(225, 50%, 60%)", // Muted Indigo
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
