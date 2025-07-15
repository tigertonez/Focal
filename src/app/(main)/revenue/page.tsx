
import { SectionHeader } from "@/components/app/SectionHeader";
import { ChartWrapper } from "@/components/app/ChartWrapper";
import { PlaceholderChart } from "@/components/app/PlaceholderChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function RevenuePage() {
  return (
    <div className="container mx-auto">
      <SectionHeader
        title="Revenue Forecast"
        description="A detailed look at your projected monthly revenue."
      />
      <ChartWrapper
        title="Monthly Revenue"
        description="Based on your selected sales curve and pricing."
        className="mb-8"
      >
        <PlaceholderChart />
      </ChartWrapper>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Revenue Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>Month {i + 1}</TableCell>
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
