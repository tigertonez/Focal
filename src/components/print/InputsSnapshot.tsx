'use client';
import * as React from 'react';
import { useForecast } from '@/context/ForecastContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EngineInput, EngineOutput } from '@/lib/types';

interface InputsSnapshotProps {
  inputs?: EngineInput;
  financials?: { data: EngineOutput | null };
}

export default function InputsSnapshot({ inputs: propsInputs, financials: propsFinancials }: InputsSnapshotProps = {}) {
  const { inputs: contextInputs, financials: contextFinancials, t } = useForecast();
  
  // Use props if provided (for print mode), otherwise fall back to context
  const inputs = propsInputs || contextInputs;
  const financials = propsFinancials || contextFinancials;

  if (!inputs) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No input data available</p>
      </div>
    );
  }

  const { company, parameters, products, fixedCosts } = inputs;
  const brandName = company?.brand || 'Your Brand';

  // Add route marker for verification
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runId = params.get('runId');
    if (runId) {
      const marker = `ROUTE_INPUTS_${runId}`;
      const markerDiv = document.createElement('div');
      markerDiv.id = 'route-marker';
      markerDiv.setAttribute('data-route-marker', marker);
      markerDiv.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      markerDiv.textContent = marker;
      document.body.appendChild(markerDiv);
    }
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Forecast Input Summary</h1>
        <h2 className="text-xl text-gray-600">{brandName}</h2>
        <p className="text-sm text-gray-500 mt-2">
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold w-1/3">Brand Name</TableCell>
                <TableCell>{company?.brand || 'Not specified'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Industry</TableCell>
                <TableCell className="capitalize">{company?.industry || 'Not specified'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Company Stage</TableCell>
                <TableCell className="capitalize">{company?.stage || 'Not specified'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Production Model</TableCell>
                <TableCell className="capitalize">{company?.production || 'Not specified'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Team Size</TableCell>
                <TableCell>{company?.teamSize || 'Not specified'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold w-1/3">Forecast Period</TableCell>
                <TableCell>{parameters.forecastMonths} months</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Tax Rate</TableCell>
                <TableCell>{parameters.taxRate}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Currency</TableCell>
                <TableCell>{parameters.currency}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Accounting Method</TableCell>
                <TableCell className="capitalize">
                  {parameters.accountingMethod === 'cogs' ? 'Accrual (COGS-based)' : 'Conservative (Total Costs)'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products & Services ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Product Name</TableHead>
                <TableHead className="text-right">Planned Units</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Sell Price</TableHead>
                <TableHead className="text-right">Sell-Through</TableHead>
                <TableHead className="text-center">Sales Model</TableHead>
                <TableHead className="text-center">Cost Model</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full border" 
                        style={{ backgroundColor: p.color || '#6b7280' }}
                      />
                      {p.productName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(p.plannedUnits)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.unitCost || 0, parameters.currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.sellPrice, parameters.currency)}</TableCell>
                  <TableCell className="text-right">{p.sellThrough || 100}%</TableCell>
                  <TableCell className="text-center capitalize">{p.salesModel || 'launch'}</TableCell>
                  <TableCell className="text-center capitalize">{p.costModel || 'batch'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fixed Costs ({fixedCosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Cost Name</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Payment Schedule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixedCosts.map(fc => (
                <TableRow key={fc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full border" 
                        style={{ backgroundColor: fc.color || '#6b7280' }}
                      />
                      {fc.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{fc.costType}</TableCell>
                  <TableCell className="text-right">{formatCurrency(fc.amount, parameters.currency)}</TableCell>
                  <TableCell className="text-center capitalize">
                    {fc.paymentSchedule.replace(/_/g, ' ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {financials?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Forecast Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold w-1/3">Total Revenue</TableCell>
                  <TableCell>{formatCurrency(financials.data.revenueSummary.totalRevenue, parameters.currency)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Total Operating Costs</TableCell>
                  <TableCell>{formatCurrency(financials.data.costSummary.totalOperating, parameters.currency)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Net Profit</TableCell>
                  <TableCell className={financials.data.profitSummary.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(financials.data.profitSummary.totalNetProfit, parameters.currency)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Ending Cash Balance</TableCell>
                  <TableCell className={financials.data.cashFlowSummary.endingCashBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(financials.data.cashFlowSummary.endingCashBalance, parameters.currency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}