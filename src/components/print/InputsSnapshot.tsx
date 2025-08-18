'use client';
import * as React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InputsSnapshot() {
  const { inputs, t } = useForecast();

  if (!inputs) {
    return <p>Loading inputs...</p>;
  }

  const { company, parameters, products, fixedCosts } = inputs;

  return (
    <section data-section="inputs" className="space-y-6">
      <h1 className="text-2xl font-bold">Company Data — {company.brand || 'Your Brand'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Company Context</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow><TableCell className="font-semibold">Brand Name</TableCell><TableCell>{company?.brand}</TableCell></TableRow>
              <TableRow><TableCell className="font-semibold">{t.inputs.company.industry.title}</TableCell><TableCell>{company?.industry}</TableCell></TableRow>
              <TableRow><TableCell className="font-semibold">{t.inputs.company.stage.title}</TableCell><TableCell>{company?.stage}</TableCell></TableRow>
              <TableRow><TableCell className="font-semibold">{t.inputs.company.production.title}</TableCell><TableCell>{company?.production}</TableCell></TableRow>
              <TableRow><TableCell className="font-semibold">{t.inputs.company.teamSize.title}</TableCell><TableCell>{company?.teamSize}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>General Parameters</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableBody>
                    <TableRow><TableCell className="font-semibold">{t.inputs.parameters.forecastMonths.label}</TableCell><TableCell>{parameters.forecastMonths} months</TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold">{t.inputs.parameters.taxRate.label}</TableCell><TableCell>{parameters.taxRate}%</TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold">{t.inputs.parameters.currency}</TableCell><TableCell>{parameters.currency}</TableCell></TableRow>
                    <TableRow><TableCell className="font-semibold">{t.inputs.parameters.accountingMethod.label}</TableCell><TableCell>{t.inputs.parameters.accountingMethod[parameters.accountingMethod as keyof typeof t.inputs.parameters.accountingMethod]}</TableCell></TableRow>
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Sell Price</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Sell-Through</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell className="text-right">{formatNumber(p.plannedUnits)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.sellPrice, parameters.currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.unitCost || 0, parameters.currency)}</TableCell>
                  <TableCell className="text-right">{p.sellThrough || 100}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Fixed Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Cost Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Schedule</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {fixedCosts.map(fc => (
                      <TableRow key={fc.id}>
                          <TableCell>{fc.name}</TableCell>
                          <TableCell>{fc.costType}</TableCell>
                          <TableCell className="text-right">{formatCurrency(fc.amount, parameters.currency)}</TableCell>
                          <TableCell>{fc.paymentSchedule.replace(/_/g, ' ')}</TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
