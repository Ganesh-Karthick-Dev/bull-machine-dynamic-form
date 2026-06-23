"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormConfig } from '@/lib/schema-parser';
import { buildFormSchema, getDefaultValues } from '@/lib/validators';
import { FormField } from './FormField';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Moon, 
  Sun 
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DynamicFormProps {
  config: FormConfig;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ config }) => {
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  // Detect when header becomes sticky
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(entry.boundingClientRect.top <= 0);
      },
      {
        threshold: [0],
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, []);

  // Initialize theme
  useEffect(() => {
    setIsMounted(true);
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

  const dynamicSchema = buildFormSchema(config.fields);
  const defaultValues = getDefaultValues(config.fields);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues,
  });

  const DRAFT_KEY = `form_draft_${config.title.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Draft Restore Logic
  const [draftLoaded, setDraftLoaded] = useState(false);
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        Object.entries(parsed).forEach(([key, val]) => {
          setValue(key, val, { shouldValidate: false });
        });
      } catch (e) {
        console.error("Failed to restore draft:", e);
      }
    }
    setDraftLoaded(true);
  }, [setValue, DRAFT_KEY]);

  // Watch and auto-save draft
  const formValues = watch();
  useEffect(() => {
    if (draftLoaded && submitState === 'idle') {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues));
    }
  }, [formValues, draftLoaded, submitState, DRAFT_KEY]);

  // Calculate Progress Percent
  const getProgress = () => {
    const totalFields = config.fields.length;
    if (totalFields === 0) return 0;
    
    let filledCount = 0;
    config.fields.forEach((field) => {
      const val = formValues[field.id];
      if (field.type === 'checkbox') {
        if (val === true) filledCount++;
      } else {
        if (val !== undefined && val !== null && val !== '') {
          filledCount++;
        }
      }
    });

    return Math.round((filledCount / totalFields) * 100);
  };

  const progressPercent = getProgress();

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      submittedAt: new Date().toISOString(),
      formTitle: config.title,
      answers: data,
    };

    try {
      const response = await fetch("https://automation.webnoxdigital.com/webhook/aa388fca-baf3-487f-a588-e244f5248a67", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Submission failed with status code ${response.status}`);
      }

      // Success! Clear draft
      localStorage.removeItem(DRAFT_KEY);
      
      // Play confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setSubmittedPayload(payload);
      setSubmitState('success');
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError(error instanceof Error ? error.message : "Network error. Failed to connect to webhook.");
      setSubmitState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to clear your current progress?")) {
      localStorage.removeItem(DRAFT_KEY);
      reset(defaultValues);
    }
  };

  const handleCopyPayload = () => {
    if (!submittedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(submittedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isMounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // --- Success State Screen ---
  if (submitState === 'success') {
    return (
      <Card className="w-full max-w-2xl mx-auto border shadow-xl p-8 text-center animate-scaleIn">
        <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20 text-green-500 dark:text-green-400 mb-6">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground mb-2">
          Submission Successful
        </CardTitle>
        <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto text-base">
          {config.successMessage}
        </CardDescription>

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={() => {
              reset(defaultValues);
              setSubmitState('idle');
            }}
            className="px-6 py-2.5 font-semibold text-sm shadow-md"
          >
            Submit Another Response
          </Button>
        </div>
      </Card>
    );
  }

  // --- Error State Screen ---
  if (submitState === 'error') {
    return (
      <Card className="w-full max-w-2xl mx-auto border shadow-xl p-8 text-center animate-scaleIn">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-6">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground mb-2">
          Submission Failed
        </CardTitle>
        <CardDescription className="text-muted-foreground mb-4 max-w-md mx-auto text-base">
          We encountered an issue submitting your response. Please try again.
        </CardDescription>

        {submitError && (
          <div className="mb-6 p-4 bg-destructive/5 rounded-lg text-sm border border-destructive/20 text-destructive font-mono text-left overflow-x-auto">
            Error Details: {submitError}
          </div>
        )}

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={() => setSubmitState('idle')}
            className="px-6 py-2.5 font-semibold text-sm"
          >
            Go Back & Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // --- Active Form Screen ---
  return (
    <Card className="w-full max-w-2xl mx-auto border shadow-xl relative overflow-visible pt-0 transition-all duration-300">
      {/* Sentinel to detect sticky state positioned absolutely at the top of the card */}
      <div ref={sentinelRef} className="absolute top-0 left-0 right-0 h-px pointer-events-none" />

      {/* Sticky Header Section */}
      <div className={`sticky top-0 z-20 bg-card rounded-t-xl transition-shadow duration-300 ${
        isStuck 
          ? "shadow-xl border-b border-border/80" 
          : "border-b border-border/60"
      }`}>
        {/* Top Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-t-xl overflow-hidden">
          <div 
            className="h-full bg-primary rounded-r transition-all duration-300 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Header */}
        <CardHeader className="pt-5 pb-6 border-0">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {config.title}
            </CardTitle>
            {config.description && (
              <CardDescription className="text-muted-foreground text-sm">
                {config.description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="py-6 space-y-6">
          {config.fields.map((field) => (
            <FormField
              key={field.id}
              field={field}
              register={register}
              control={control}
              error={errors[field.id] as any}
            />
          ))}
        </CardContent>

        {/* Footer Controls */}
        <CardFooter className="pt-4 pb-6 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearDraft}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Form
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-md font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {config.submitButtonText === 'Submit' ? 'Submitting...' : 'Processing...'}
              </>
            ) : (
              config.submitButtonText
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
