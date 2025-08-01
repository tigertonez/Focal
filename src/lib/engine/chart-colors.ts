

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
    // Specific keywords for fixed costs
    "Salaries": "hsl(var(--chart-1))", 
    "Marketing": "hsl(var(--chart-2))",
    "Buffer": "hsl(var(--chart-3))",
    "Contingency": "hsl(var(--chart-3))",
    "Admin": "hsl(var(--chart-6))",
    "Tools": "hsl(var(--chart-6))",
    "Overheads": "hsl(var(--chart-6))",
    "Equip": "hsl(var(--chart-5))",

    // Specific keywords for cash flow items that need reliable colors
    // These are now a distinct orange/amber color to avoid collision with fixed costs.
    "Deposits": "hsl(32, 90%, 55%)",      // A distinct, vibrant orange
    "Final Payments": "hsl(32, 90%, 65%)",// A slightly lighter shade of the same orange

    // General application colors for reference
    "Revenue": "hsl(var(--primary))",
    "Profit": "hsl(var(--accent))",
};
