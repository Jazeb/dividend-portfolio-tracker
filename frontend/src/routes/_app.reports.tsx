import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Receipt, PieChart, TrendingUp, Wallet } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — PSX Dividend Tracker" }] }),
});

const reports = [
  { name: "Portfolio Report", desc: "Complete snapshot of holdings, allocation, and performance.", icon: PieChart, size: "PDF · 2.4 MB" },
  { name: "Dividend Report", desc: "All dividend receipts with dates, symbols, and amounts.", icon: Wallet, size: "PDF · 1.1 MB" },
  { name: "Tax Report", desc: "FBR-ready withholding and dividend income breakdown.", icon: Receipt, size: "PDF · 0.8 MB" },
  { name: "Capital Gains Report", desc: "Realized gains and losses per tax year.", icon: TrendingUp, size: "PDF · 1.6 MB" },
  { name: "Income Report", desc: "Monthly and annual cash flow summary.", icon: FileText, size: "PDF · 0.9 MB" },
  { name: "Transaction History", desc: "Full ledger of buys, sells, and corporate actions.", icon: FileText, size: "CSV · 240 KB" },
];

function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Generate and download financial statements" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Card key={r.name} className="card-elevated p-6 hover:shadow-glow transition group">
            <div className="h-12 w-12 rounded-xl gradient-primary grid place-items-center text-white shadow-glow mb-4">
              <r.icon className="h-5 w-5" />
            </div>
            <div className="font-semibold">{r.name}</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{r.size}</span>
              <Button size="sm" variant="outline" className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition"><Download className="h-3.5 w-3.5" />Download</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
