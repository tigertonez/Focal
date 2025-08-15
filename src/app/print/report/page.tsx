
import { SectionHeader } from '@/components/app/SectionHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PrintReportPage() {
  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 14mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div id="report-content" className="p-4 md:p-8 space-y-6" data-ssr-key="v1">
        <SectionHeader title="Financial Summary" description="An overview of your business forecast." />

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Static placeholder for key performance indicators.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Waterfall</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Static placeholder for the financial waterfall chart.</p>
          </CardContent>
        </Card>
        
        <Separator />

        <p className="text-xs text-muted-foreground text-center">
          Report generated on a static date.
        </p>
      </div>
      <script>{`
        (function () {
          function done(){ window.READY = true; }
          const fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
          const imgs = Promise.all(Array.from(document.images).map(img =>
            img.complete ? Promise.resolve() :
            new Promise(res => { img.addEventListener('load', res, { once:true }); img.addEventListener('error', res, { once:true }); })
          ));
          Promise.all([fonts, imgs]).then(done).catch(done);
        })();
      `}</script>
    </>
  );
}
