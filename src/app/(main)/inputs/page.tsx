
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function InputsPage() {
  return (
    <div className="container mx-auto">
      <SectionHeader
        title="Forecast Inputs"
        description="Define the core assumptions for your financial model."
      />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">Product & Sales</CardTitle>
          <CardDescription>
            All inputs are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="productName" className="font-semibold text-label">Product Name</Label>
              <Input id="productName" placeholder="e.g., The Amazing Widget" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="price" className="font-semibold text-label">Price</Label>
              <Input id="price" type="number" placeholder="49.99" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="initialSales" className="font-semibold text-label">Initial Sales (Units)</Label>
              <Input id="initialSales" type="number" placeholder="1000" />
            </div>
            <Button type="submit" className="w-full md:w-auto font-bold">Update Forecast</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
