import React from 'react';
import Link from 'next/link';
import { safeDecodeBase64, parseFormConfig } from '@/lib/schema-parser';
import { DynamicForm } from '@/components/DynamicForm';
import { AlertCircle, FileWarning, ShieldAlert, ArrowLeft, FormInput } from 'lucide-react';

type SearchParamsType = Promise<{ [key: string]: string | string[] | undefined }>;

interface FormPageProps {
  searchParams: SearchParamsType;
}

export default async function FormPage({ searchParams }: FormPageProps) {
  const params = await searchParams;
  const dataParam = params.data;

  // 1. Missing data parameter
  if (!dataParam || typeof dataParam !== 'string') {
    return (
      <ErrorState
        title="Invalid Form URL"
        message="The form link you opened is missing required form configuration data. Please check the URL and try again."
        icon={FileWarning}
      />
    );
  }

  // 2. Base64 Decode
  const decoded = safeDecodeBase64(dataParam);
  if (!decoded) {
    return (
      <ErrorState
        title="Unable to load form"
        message="We failed to decode the form data parameters. The link might be corrupt or incomplete."
        icon={ShieldAlert}
      />
    );
  }

  // 3. Schema Parsing and Validation
  const parseResult = parseFormConfig(decoded);
  if (!parseResult.success) {
    console.error("Schema validation failed details:", parseResult.error);
    return (
      <ErrorState
        title="Invalid form configuration"
        message="The decoded form structure is invalid and does not comply with the form engine specification."
        icon={AlertCircle}
        details={parseResult.error}
      />
    );
  }

  // 4. Successful parse -> render the DynamicForm!
  const config = parseResult.data;

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-zinc-950 min-h-screen">
      <DynamicForm config={config} />
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  icon: React.ComponentType<any>;
  details?: string;
}

function ErrorState({ title, message, icon: Icon, details }: ErrorStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-zinc-950 min-h-screen">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl shadow-xl p-8 text-center animate-scaleIn">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 mb-5">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{message}</p>
        
        {details && (
          <div className="mb-6 p-3 bg-red-50/30 dark:bg-red-950/5 rounded-lg border border-red-100/30 dark:border-red-950/10 text-xs font-mono text-red-700 dark:text-red-400 text-left max-h-36 overflow-y-auto">
            {details}
          </div>
        )}

        <Link 
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-950 rounded-lg text-sm font-semibold transition-all w-full justify-center shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Generator
        </Link>
      </div>
    </div>
  );
}
