
import { SectionHeader } from "@/components/app/SectionHeader";
import { ChartWrapper } from "@/components/app/ChartWrapper";
import { PlaceholderChart } from "@/components/app/PlaceholderChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CashFlowPage() {
  return (
    <div className="container mx-auto">
      <SectionHeader
        title="Cash Flow"
        description="Monthly and cumulative cash position."
      />
      <ChartWrapper
        title="Cumulative Cash Flow"
        description="This is the lifeblood of your business."
        className="mb-8"
      >
        <PlaceholderChart />
      </ChartWrapper>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cash Flow Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Monthly Cash Flow</TableHead>
                <TableHead className="text-right">Ending Cash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>Month {i + 1}</TableCell>
                  <TableCell className="text-right">$0.00</TableCell>
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
