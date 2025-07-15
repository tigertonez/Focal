
import { SectionHeader } from "@/components/app/SectionHeader";
import { ChartWrapper } from "@/components/app/ChartWrapper";
import { PlaceholderChart } from "@/components/app/PlaceholderChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProfitPage() {
  return (
    <div className="container mx-auto">
      <SectionHeader
        title="Profitability Analysis"
        description="Tracking gross, operating, and net profit."
      />
      <ChartWrapper
        title="Monthly Profit"
        description="Is your business making money?"
        className="mb-8"
      >
        <PlaceholderChart />
      </ChartWrapper>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profit Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Gross Profit</TableHead>
                <TableHead>Operating Profit</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
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
