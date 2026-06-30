'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'overdue' | 'stocks';
  onSuccess: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, type, onSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      setStatus('error');
      setErrorMessage('Please select a valid Excel file (.xlsx or .xls)');
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('idle');
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("Could not read file data");
          
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          
          if (rows.length === 0) {
            throw new Error("The Excel sheet appears to be empty.");
          }

          const res = await fetch('/api/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type,
              rows
            })
          });

          const result = await res.json();
          if (!res.ok) {
            throw new Error(result.error || 'Server error occurred during import.');
          }

          setStatus('success');
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1500);

        } catch (err: any) {
          console.error("FileReader processing error:", err);
          setStatus('error');
          setErrorMessage(err.message || 'Failed to parse Excel file rows.');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setStatus('error');
        setErrorMessage('Failed to read file from filesystem.');
        setLoading(false);
      };

      reader.readAsBinaryString(file);

    } catch (err: any) {
      console.error("Import trigger error:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Import failed.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setStatus('idle');
    setErrorMessage('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-background border rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn relative flex flex-col font-sans">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">
            Import {type === 'overdue' ? 'Overdue PO Orders' : 'Stock Inventory'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Upload or drag-and-drop your Excel spreadsheet (.xlsx or .xls) to bulk import records.
          </p>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 py-2">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">Import Successful!</h3>
                <p className="text-xs text-muted-foreground">Refreshing table data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center py-10 px-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : file 
                      ? 'border-emerald-500/50 bg-emerald-50/10' 
                      : 'border-border hover:border-primary/50 bg-muted/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground max-w-[280px] truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Drag & drop Excel file here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or click to browse from files
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status messages */}
              {status === 'error' && (
                <div className="flex items-start gap-2 p-3.5 bg-destructive/5 text-destructive rounded-lg border border-destructive/20 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Import Error:</span> {errorMessage}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 border-t pt-4 mt-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="px-6 text-xs h-9 bg-background"
          >
            Cancel
          </Button>
          
          {status !== 'success' && (
            <Button
              type="button"
              size="sm"
              onClick={handleImport}
              disabled={!file || loading}
              className="px-6 text-xs h-9 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Records'
              )}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
