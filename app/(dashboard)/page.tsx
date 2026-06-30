'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  TrendingUp, 
  ArrowRight,
  BookOpen,
  ArrowUpRight,
  Workflow,
  FileClock,
  Boxes,
  Database,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OverdueOrder {
  id: number;
  plant: string;
  purchasing_group: string;
  material: string;
  mat_desc: string;
  vendor_code: string;
  vendor_name: string;
  vendor_number: string;
  vendor_email: string;
  po_no: string;
  order_due_date: string;
  po_item_no: string;
  uom: string;
  delivery_schedule_qty: number;
  pending_qty: number;
  despatch_date_supplier: string | null;
  delivery_date_bull: string | null;
  asn_number: string | null;
  further_despatch_date: string | null;
  form_id: string | null;
  thanking_you_email: string | null;
  trigger_id: string | null;
  first_mail_sent: string | null;
}

export default function DashboardOverview() {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<OverdueOrder[]>([]);
  const [dbStats, setDbStats] = useState({
    overdueOrdersCount: 0,
    stockItemsCount: 0,
    totalStockQuantity: 0,
    lowStockAlertsCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch live metrics from overview API
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/overview');
        if (res.ok) {
          const data = await res.json();
          setDbStats(data);
        }
      } catch (e) {
        console.error("Failed to load overview stats:", e);
      } finally {
        setStatsLoading(false);
      }
    };

    // 2. Fetch recent overdue orders
    const fetchRecentOrders = async () => {
      try {
        const res = await fetch('/api/orders?page=1&limit=5');
        if (res.ok) {
          const data = await res.json();
          setRecentOrders(data.data || []);
        }
      } catch (e) {
        console.error("Failed to load recent orders:", e);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchStats();
    fetchRecentOrders();
  }, []);

  const handleCopyLink = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const metrics = [
    {
      title: "Overdue Orders",
      value: statsLoading ? "..." : `${dbStats.overdueOrdersCount} POs`,
      change: "PostgreSQL Live",
      changeType: "neutral" as const,
      icon: FileClock,
      color: "text-red-500 bg-red-500/10 border-red-500/20"
    },
    {
      title: "Stock Materials",
      value: statsLoading ? "..." : `${dbStats.stockItemsCount} Items`,
      change: "PostgreSQL Live",
      changeType: "positive" as const,
      icon: Boxes,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Total Stock Quantity",
      value: statsLoading ? "..." : dbStats.totalStockQuantity.toLocaleString(),
      change: "Units in warehouse",
      changeType: "positive" as const,
      icon: Database,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Low Stock Alerts",
      value: statsLoading ? "..." : `${dbStats.lowStockAlertsCount} Alerts`,
      change: dbStats.lowStockAlertsCount > 0 ? "Replenishment needed" : "All materials safe",
      changeType: dbStats.lowStockAlertsCount > 0 ? "negative" as const : "positive" as const,
      icon: AlertTriangle,
      color: dbStats.lowStockAlertsCount > 0 
        ? "text-red-500 bg-red-500/10 border-red-500/20"
        : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20"
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent p-5 sm:p-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            Bull Machine Automation Console
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Monitor Overdue Purchase Orders & Inventory
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Automate vendor feedback loops, trigger alerts for overdue delivery dates, and track real-time stock levels of active parts and materials.
          </p>
          <div className="pt-1.5 flex flex-wrap gap-2.5">
            <Link href="/overdue">
              <Button size="sm" className="font-bold text-xs h-8 flex items-center gap-1.5 shadow-sm shadow-primary/20">
                <FileClock className="h-3.5 w-3.5" />
                Manage Overdue Orders
              </Button>
            </Link>
            <Link href="/stocks">
              <Button size="sm" variant="outline" className="font-bold text-xs h-8 flex items-center gap-1.5 bg-background">
                <Boxes className="h-3.5 w-3.5" />
                View Inventory Levels
              </Button>
            </Link>
          </div>
        </div>
        {/* Abstract background blobs */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden lg:block opacity-40">
          <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 blur-3xl" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Card key={idx} className="border border-border/80 shadow-sm relative overflow-hidden group hover:border-primary/25 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{m.title}</p>
                  <h3 className="text-lg font-bold text-foreground">{m.value}</h3>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                    m.changeType === 'positive' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : m.changeType === 'negative' 
                        ? 'text-destructive' 
                        : 'text-muted-foreground'
                  }`}>
                    {m.changeType === 'positive' && <TrendingUp className="h-2.5 w-2.5" />}
                    {m.change}
                  </span>
                </div>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${m.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Graph and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Analytics Graph */}
        <Card className="lg:col-span-8 border border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 border-b border-border/40">
            <div>
              <CardTitle className="text-xs font-bold">Submission Analytics</CardTitle>
              <CardDescription className="text-[10px]">Form responses processed globally over the last 7 days</CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Live Stream</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Visual SVG chart */}
            <div className="relative h-48 w-full flex flex-col justify-between">
              {/* SVG Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-border/40 w-full h-0" />
                <div className="border-b border-border/40 w-full h-0" />
                <div className="border-b border-border/40 w-full h-0" />
                <div className="border-b border-border/40 w-full h-0" />
              </div>

              {/* SVG graph line */}
              <div className="relative w-full h-32 z-10 mt-3">
                <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Fill path */}
                  <path 
                    d="M 0 160 Q 50 140 100 150 T 200 90 T 300 110 T 400 40 T 500 70 T 600 30 T 700 20 L 700 200 L 0 200 Z" 
                    fill="url(#chartGrad)" 
                  />
                  
                  {/* Stroke path */}
                  <path 
                    d="M 0 160 Q 50 140 100 150 T 200 90 T 300 110 T 400 40 T 500 70 T 600 30 T 700 20" 
                    fill="none" 
                    className="stroke-primary" 
                    strokeWidth="3.5"
                    strokeLinecap="round" 
                  />

                  {/* Pulsing Dot on final value */}
                  <circle cx="700" cy="20" r="5" className="fill-primary" />
                  <circle cx="700" cy="20" r="10" className="fill-primary/30 stroke-none animate-ping" />
                </svg>
              </div>

              {/* X Axis labels */}
              <div className="flex justify-between text-[9px] font-bold text-muted-foreground px-1 border-t border-border/60 pt-1.5 z-10">
                <span>Mon (142)</span>
                <span>Tue (126)</span>
                <span>Wed (190)</span>
                <span>Thu (174)</span>
                <span>Fri (245)</span>
                <span>Sat (210)</span>
                <span>Sun (295)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Quick Guides / Integrations */}
        <Card className="lg:col-span-4 border border-border/80 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="text-xs font-bold">Quick Integration Guide</CardTitle>
            <CardDescription className="text-[10px]">Connect forms to workflow handlers</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 flex-1 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <Workflow className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-foreground">n8n / Make Webhooks</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Paste your active webhook listener URL directly into the schema. Payload is sent as HTTP POST JSON.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-foreground">Host Anywhere</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Since state is embedded entirely in the query parameters, you can link to this form anywhere.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/overdue" className="w-full">
              <Button variant="outline" className="w-full justify-between font-bold text-[10px] h-8 bg-background hover:bg-muted group">
                Manage Overdue Orders
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Overdue Orders Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <div>
            <CardTitle className="text-xs font-bold">Recent Overdue Purchase Orders</CardTitle>
            <CardDescription className="text-[10px]">Monitor live response links and alert triggers for recent overdue PO items</CardDescription>
          </div>
          <Link href="/overdue">
            <Button size="sm" variant="ghost" className="text-[11px] font-bold text-primary flex items-center gap-1 h-7">
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-3">Material & Description</th>
                  <th className="py-2.5 px-3">Vendor Name</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {ordersLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading live PO data...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No overdue orders found. Reset database or import records to view.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const isCopied = copiedId === order.id;
                    const orderDate = order.order_due_date 
                      ? new Date(order.order_due_date).toLocaleDateString('en-GB') 
                      : 'N/A';
                    
                    return (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-foreground">
                          {order.po_no} (Item: {order.po_item_no})
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-foreground block">{order.material}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[240px] block" title={order.mat_desc || ''}>
                            {order.mat_desc}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground font-medium">
                          {order.vendor_name}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {orderDate}
                        </td>
                        <td className="py-2.5 px-3">
                          {order.form_id ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Form Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-bold text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                              Pending Link
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                          {/* Copy button */}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Copy Share Link"
                            onClick={() => order.form_id && handleCopyLink(order.id, order.form_id)}
                            disabled={!order.form_id}
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          
                          {/* Open live form */}
                          <a href={order.form_id || '#'} target="_blank" rel="noreferrer" className={!order.form_id ? 'pointer-events-none' : ''}>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Open Shareable Form"
                              disabled={!order.form_id}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
