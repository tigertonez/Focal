
import { SectionHeader } from "@/components/app/SectionHeader";
import { ChartWrapper } from "@/components/app/ChartWrapper";
import { PlaceholderChart } from "@/components/app/PlaceholderChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CostsPage() {
  return (
    <div className="container mx-auto">
      <SectionHeader
        title="Cost Analysis"
        description="A breakdown of your fixed and variable costs over time."
      />
      <ChartWrapper
        title="Monthly Costs"
        description="Visualizing fixed vs. variable costs."
        className="mb-8"
      >
        <PlaceholderChart />
      </ChartWrapper>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cost Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Fixed Costs</TableHead>
                <TableHead>Variable Costs</TableHead>
                <TableHead className="text-right">Total Costs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>Month {i + 1}</TableCell>
                  <TableCell>$0.00</TableCell>
                  <TableCell>$0.00</TableCell>
                  <TableCell className="text-right">$0.00</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
