"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Code, 
  FileText, 
  Eye, 
  Moon, 
  Sun, 
  Hammer,
  RotateCcw
} from 'lucide-react';
import { parseFormConfig } from '@/lib/schema-parser';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Preset configurations
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [jsonText, setJsonText] = useState('');
  const [title, setTitle] = useState(PRESETS.vendor.title);
  const [description, setDescription] = useState(PRESETS.vendor.description);
  const [webhookUrl, setWebhookUrl] = useState(PRESETS.vendor.webhookUrl);
  const [submitButtonText, setSubmitButtonText] = useState(PRESETS.vendor.submitButtonText);
  const [successMessage, setSuccessMessage] = useState(PRESETS.vendor.successMessage);
  const [fields, setFields] = useState<any[]>(PRESETS.vendor.fields);

  const [generatedLink, setGeneratedLink] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  // Sync state to URL Generator
  useEffect(() => {
    let currentConfig: any;

    if (activeTab === 'json') {
      try {
        if (!jsonText.trim()) return;
        currentConfig = JSON.parse(jsonText);
        const validation = parseFormConfig(jsonText);
        if (!validation.success) {
          setJsonError(validation.error);
          return;
        }
        setJsonError(null);
      } catch (err) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON format');
        return;
      }
    } else {
      currentConfig = {
        title,
        description,
        webhookUrl,
        submitButtonText,
        successMessage,
        fields: fields.map(({ id, label, type, required, defaultValue, placeholder, options }) => {
          const base: any = { id, label, type, required };
          if (defaultValue !== undefined && defaultValue !== '') base.defaultValue = defaultValue;
          if (placeholder !== undefined && placeholder !== '') base.placeholder = placeholder;
          if (options && options.length > 0) base.options = options;
          return base;
        })
      };
      setJsonError(null);
    }

    // Encode configuration to URL-safe Base64
    const jsonStr = JSON.stringify(currentConfig);
    const base64 = Buffer.from(jsonStr).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, ''); // URL-safe base64 encoding without padding

    const host = typeof window !== 'undefined' ? window.location.origin : '';
    setGeneratedLink(`${host}/form?data=${base64}`);
  }, [activeTab, jsonText, title, description, webhookUrl, submitButtonText, successMessage, fields]);

  // Load a preset
  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setTitle(preset.title);
    setDescription(preset.description);
    setWebhookUrl(preset.webhookUrl);
    setSubmitButtonText(preset.submitButtonText);
    setSuccessMessage(preset.successMessage);
    setFields(JSON.parse(JSON.stringify(preset.fields)));
    setJsonText(JSON.stringify(preset, null, 2));
  };

  // Setup initial json content
  useEffect(() => {
    setJsonText(JSON.stringify(PRESETS.vendor, null, 2));
  }, []);

  // Update specific field properties
  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  // Add a field
  const addField = () => {
    const newField = {
      id: `field_${Date.now().toString().slice(-4)}`,
      label: "New Field",
      type: "text",
      required: false,
    };
    setFields([...fields, newField]);
  };

  // Remove a field
  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
  };

  // Add option to select/radio field
  const addOption = (fieldIndex: number) => {
    const updated = [...fields];
    const currentOptions = updated[fieldIndex].options || [];
    updated[fieldIndex] = {
      ...updated[fieldIndex],
      options: [...currentOptions, `Option ${currentOptions.length + 1}`]
    };
    setFields(updated);
  };

  // Update specific option in select/radio field
  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const updated = [...fields];
    const currentOptions = [...(updated[fieldIndex].options || [])];
    currentOptions[optionIndex] = value;
    updated[fieldIndex] = { ...updated[fieldIndex], options: currentOptions };
    setFields(updated);
  };

  // Remove option from select/radio field
  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const updated = [...fields];
    const currentOptions = (updated[fieldIndex].options || []).filter((_: any, i: number) => i !== optionIndex);
    updated[fieldIndex] = { ...updated[fieldIndex], options: currentOptions };
    setFields(updated);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 bg-background text-foreground min-h-screen flex flex-col font-sans transition-all duration-300">
      
      {/* Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-md">
              <Hammer className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Dynamic Form Engine
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Presets Select */}
            <div className="flex items-center gap-2 bg-muted/50 border px-3 py-1.5 rounded-lg">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Load Preset:</span>
              <select 
                onChange={(e) => loadPreset(e.target.value as any)}
                className="text-xs bg-transparent focus:outline-none font-bold text-foreground cursor-pointer"
                defaultValue="vendor"
              >
                <option value="vendor" className="bg-popover text-popover-foreground">Vendor Delivery</option>
                <option value="feedback" className="bg-popover text-popover-foreground">Feedback Survey</option>
                <option value="event" className="bg-popover text-popover-foreground">Event RSVP</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Builder Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left builder column */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <Card className="shadow-xl overflow-hidden flex-1 flex flex-col border border-border">
            
            {/* Form editor tabs */}
            <div className="flex border-b bg-muted/20">
              <button
                onClick={() => setActiveTab('visual')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'visual'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                Visual Form Builder
              </button>
              <button
                onClick={() => {
                  setActiveTab('json');
                  const visualConfig = {
                    title,
                    description,
                    webhookUrl,
                    submitButtonText,
                    successMessage,
                    fields
                  };
                  setJsonText(JSON.stringify(visualConfig, null, 2));
                }}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'json'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code className="h-4 w-4" />
                JSON Schema Editor
              </button>
            </div>

            {/* Editor Body */}
            <div className="p-6 overflow-y-auto flex-1 max-h-[60vh] lg:max-h-[calc(100vh-270px)]">
              {activeTab === 'visual' ? (
                <div className="space-y-6">
                  {/* General Config */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="form-title" className="text-xs font-semibold text-muted-foreground">Form Title</Label>
                        <Input
                          id="form-title"
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="form-webhook" className="text-xs font-semibold text-muted-foreground">Webhook URL (n8n)</Label>
                        <Input
                          id="form-webhook"
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="form-desc" className="text-xs font-semibold text-muted-foreground">Description</Label>
                        <Input
                          id="form-desc"
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="form-btn-text" className="text-xs font-semibold text-muted-foreground">Submit Button Text</Label>
                        <Input
                          id="form-btn-text"
                          type="text"
                          value={submitButtonText}
                          onChange={(e) => setSubmitButtonText(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="form-success-msg" className="text-xs font-semibold text-muted-foreground">Success Message</Label>
                        <Input
                          id="form-success-msg"
                          type="text"
                          value={successMessage}
                          onChange={(e) => setSuccessMessage(e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/60" />

                  {/* Fields Config */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form Fields ({fields.length})</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addField}
                        className="inline-flex items-center gap-1.5 h-8 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                        Add Field
                      </Button>
                    </div>

                    <div className="space-y-5">
                      {fields.map((field, fIdx) => (
                        <div 
                          key={fIdx} 
                          className="p-5 bg-muted/20 border border-border/80 rounded-xl relative group"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeField(fIdx)}
                            className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete Field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-8">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Field ID (Unique)</Label>
                              <Input
                                type="text"
                                value={field.id}
                                onChange={(e) => updateField(fIdx, 'id', e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Label</Label>
                              <Input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateField(fIdx, 'label', e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Field Type</Label>
                              <select
                                value={field.type}
                                onChange={(e) => updateField(fIdx, 'type', e.target.value)}
                                className="w-full h-9 px-2 bg-background border border-input rounded-lg text-xs focus:outline-none focus:border-ring cursor-pointer"
                              >
                                <option value="text">Text Input</option>
                                <option value="email">Email Address</option>
                                <option value="number">Number</option>
                                <option value="date">Date Picker</option>
                                <option value="textarea">Textarea (Long Text)</option>
                                <option value="select">Dropdown Select</option>
                                <option value="radio">Radio Buttons</option>
                                <option value="checkbox">Single Checkbox</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mr-8">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Default Value</Label>
                              <Input
                                type="text"
                                value={field.defaultValue || ''}
                                onChange={(e) => updateField(fIdx, 'defaultValue', e.target.value)}
                                placeholder="Optional default value..."
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Placeholder</Label>
                              <Input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(fIdx, 'placeholder', e.target.value)}
                                placeholder="Helpful description..."
                                className="h-9"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mt-4">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!field.required}
                                onChange={(e) => updateField(fIdx, 'required', e.target.checked)}
                                className="rounded text-primary border-border focus:ring-primary/20 size-4"
                              />
                              <span className="text-xs font-semibold text-muted-foreground">Required Field</span>
                            </label>
                          </div>

                          {/* Options Panel (for Select/Radio) */}
                          {(field.type === 'select' || field.type === 'radio') && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Options (Required)</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addOption(fIdx)}
                                  className="h-7 text-xs font-bold text-primary hover:bg-muted"
                                >
                                  + Add Option
                                </Button>
                              </div>
                              {(!field.options || field.options.length === 0) && (
                                <p className="text-[11px] text-destructive font-semibold mb-2">
                                  Warning: Select/Radio fields must contain at least one option.
                                </p>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-2">
                                {field.options?.map((option: string, oIdx: number) => (
                                  <div key={oIdx} className="flex items-center gap-1.5">
                                    <Input
                                      type="text"
                                      value={option}
                                      onChange={(e) => updateOption(fIdx, oIdx, e.target.value)}
                                      className="flex-1 h-8 px-2.5 text-xs"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeOption(fIdx, oIdx)}
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      title="Remove Option"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Directly edit form configuration schema JSON below.</span>
                    <span>Validates instantly.</span>
                  </div>
                  <Textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="flex-1 w-full p-4 bg-zinc-950 text-zinc-100 border border-zinc-900 rounded-xl font-mono text-xs focus:outline-none min-h-[40vh] leading-relaxed"
                  />
                  {jsonError && (
                    <div className="p-3 bg-destructive/10 text-destructive border border-destructive/25 rounded-lg text-xs font-mono">
                      JSON Error: {jsonError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Right Preview column */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <Card className="shadow-xl p-6 space-y-6 border border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Shareable Form
            </h3>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                This dynamic form runs entirely database-free. All fields, layouts, labels, and webhooks are safely serialized into the URL below.
              </p>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Generated Form Link</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 h-9 text-xs select-all text-ellipsis bg-background"
                  />
                  <Button
                    onClick={handleCopyLink}
                    disabled={!!jsonError}
                    size="icon"
                    className="h-9 w-9"
                    title="Copy Form URL"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={jsonError ? "#" : generatedLink.replace(typeof window !== 'undefined' ? window.location.origin : '', '')}
                onClick={(e) => {
                  if (jsonError) e.preventDefault();
                }}
                target="_blank"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full h-11 font-semibold shadow-md flex items-center justify-center gap-2",
                  jsonError && "opacity-50 pointer-events-none"
                )}
              >
                <Eye className="h-4.5 w-4.5" />
                Open & Test Form
                <ExternalLink className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </div>

            <hr className="border-border/60" />

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Features Checklist</h4>
              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                  Next.js 15/16 App Router & TypeScript
                </div>
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                  React Hook Form + Zod input validation
                </div>
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                  shadcn/ui layout theme alignment
                </div>
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                  Automated draft autosaving in localStorage
                </div>
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                  Dark/Light Mode visual compatibility
                </div>
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                  Interactive progress percentage bar
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
