"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  FileText, 
  Activity, 
  Globe, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  BookOpen,
  ArrowUpRight,
  Workflow,
  FileClock,
  Boxes,
  Database,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Presets data for link generation
const PRESETS = {
  vendor: {
    title: "Vendor Delivery Update",
    description: "Please provide delivery dates and comments",
    webhookUrl: "https://n8n.example.com/webhook/vendor-update",
    submitButtonText: "Submit Update",
    successMessage: "Thank you. Your response has been submitted successfully.",
    fields: [
      { id: "vendorName", label: "Vendor Name", type: "text", required: true, defaultValue: "ABC Pvt Ltd" },
      { id: "material1", label: "Material 1 Delivery Date", type: "date", required: true },
      { id: "material2", label: "Material 2 Delivery Date", type: "date", required: true },
      { id: "comments", label: "Comments", type: "textarea", required: false }
    ]
  },
  feedback: {
    title: "Customer Satisfaction Survey",
    description: "Help us improve our service by answering a few short questions",
    webhookUrl: "https://n8n.example.com/webhook/customer-feedback",
    submitButtonText: "Send Feedback",
    successMessage: "Thank you! We appreciate your valuable feedback.",
    fields: [
      { id: "fullName", label: "Full Name", type: "text", required: false, placeholder: "John Doe" },
      { id: "email", label: "Email Address", type: "email", required: true, placeholder: "john@example.com" },
      { id: "rating", label: "Satisfaction Level", type: "radio", required: true, options: ["Excellent", "Good", "Average", "Poor"] },
      { id: "recommend", label: "Would you recommend us?", type: "checkbox", required: false, defaultValue: "true" },
      { id: "details", label: "Additional Feedback", type: "textarea", required: false }
    ]
  },
  event: {
    title: "Product Launch RSVP",
    description: "Reserve your spot for our upcoming virtual event",
    webhookUrl: "https://n8n.example.com/webhook/event-rsvp",
    submitButtonText: "Register Now",
    successMessage: "RSVP Confirmed! Check your email for event details.",
    fields: [
      { id: "firstName", label: "First Name", type: "text", required: true },
      { id: "lastName", label: "Last Name", type: "text", required: true },
      { id: "jobTitle", label: "Job Title", type: "select", required: true, options: ["Developer", "Designer", "Product Manager", "Executive", "Other"] },
      { id: "guestsCount", label: "Number of Guests", type: "number", required: true, defaultValue: "1" },
      { id: "dietary", label: "Dietary Restrictions", type: "text", required: false, placeholder: "e.g., Vegan, Gluten-free" }
    ]
  }
};

export default function DashboardOverview() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [formLinks, setFormLinks] = useState<{ [key: string]: string }>({});

  const [dbStats, setDbStats] = useState({
    overdueOrdersCount: 0,
    stockItemsCount: 0,
    totalStockQuantity: 0,
    lowStockAlertsCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const host = typeof window !== 'undefined' ? window.location.origin : '';
    const links: { [key: string]: string } = {};
    
    Object.entries(PRESETS).forEach(([key, preset]) => {
      const jsonStr = JSON.stringify(preset);
      const base64 = Buffer.from(jsonStr).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      links[key] = `${host}/form?data=${base64}`;
    });
    
    setFormLinks(links);

    // Fetch live metrics from local postgres overview API
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
    fetchStats();
  }, []);

  const handleCopyLink = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
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

  const recentForms = [
    {
      key: "vendor",
      name: "Vendor Delivery Update",
      fieldsCount: 4,
      webhook: "https://n8n.example.com/webhook/vendor-update",
      submissions: 412,
      status: "Active"
    },
    {
      key: "feedback",
      name: "Customer Satisfaction Survey",
      fieldsCount: 5,
      webhook: "https://n8n.example.com/webhook/customer-feedback",
      submissions: 864,
      status: "Active"
    },
    {
      key: "event",
      name: "Product Launch RSVP",
      fieldsCount: 5,
      webhook: "https://n8n.example.com/webhook/event-rsvp",
      submissions: 206,
      status: "Active"
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent p-5 sm:p-6">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            Zero-Database Dynamic Form Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Generate and share forms dynamically in seconds.
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create completely self-contained schemas where all configurations, validation structures, and endpoint webhooks are serialized natively within the URL. No database tables, no configuration migrations, no server provisioning.
          </p>
          <div className="pt-1.5 flex flex-wrap gap-2.5">
            <Link href="/settings">
              <Button size="sm" className="font-bold text-xs h-8 flex items-center gap-1.5 shadow-sm shadow-primary/20">
                <Plus className="h-3.5 w-3.5" />
                Build New Form
              </Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="font-bold text-xs h-8 flex items-center gap-1.5 bg-background">
                <BookOpen className="h-3.5 w-3.5" />
                API Reference
              </Button>
            </a>
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
                    m.changeType === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
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
        
        {/* Left Side: Mock Traffic Graph */}
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

            <Link href="/settings" className="w-full">
              <Button variant="outline" className="w-full justify-between font-bold text-[10px] h-8 bg-background hover:bg-muted group">
                Open Form Builder
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Generated Forms Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
          <div>
            <CardTitle className="text-xs font-bold">Standard Presets & Templates</CardTitle>
            <CardDescription className="text-[10px]">Quickly run or duplicate validated form configuration schemas</CardDescription>
          </div>
          <Link href="/settings">
            <Button size="sm" variant="ghost" className="text-[11px] font-bold text-primary flex items-center gap-1 h-7">
              Customize
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-4">Form Name</th>
                  <th className="py-2.5 px-3">Fields count</th>
                  <th className="py-2.5 px-3">Webhook target</th>
                  <th className="py-2.5 px-3">Total Mock Submissions</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentForms.map((form) => {
                  const url = formLinks[form.key] || '#';
                  const isCopied = copiedIndex === form.key;
                  return (
                    <tr key={form.key} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-foreground flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {form.name}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-medium">{form.fieldsCount} Input Fields</td>
                      <td className="py-2.5 px-3 font-mono text-[9px] text-muted-foreground truncate max-w-[200px]" title={form.webhook}>
                        {form.webhook}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{form.submissions}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {form.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1 whitespace-nowrap">
                        {/* Copy button */}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Copy Share Link"
                          onClick={() => handleCopyLink(form.key, url)}
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        
                        {/* Open live form */}
                        <a href={url} target="_blank" rel="noreferrer">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Open Shareable Form"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
