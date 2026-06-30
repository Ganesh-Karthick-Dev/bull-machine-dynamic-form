'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ClearDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClearDatabaseModal({ isOpen, onClose, onSuccess }: ClearDatabaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClear = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/import', {
        method: 'DELETE',
      });
      
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to clear database tables.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Clear database error:", err);
      setError(err.message || 'Failed to reset database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-background border rounded-xl shadow-2xl max-w-sm w-full p-6 animate-scaleIn relative flex flex-col font-sans">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Warning Icon */}
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="text-center mb-5">
          <h3 className="font-bold text-foreground text-base mb-1.5">Reset Live Database?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete all records from both <strong className="text-foreground">Overdue Orders</strong> and <strong className="text-foreground">Stock Inventory</strong>? This action is permanent and cannot be undone.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/5 text-destructive rounded-lg border border-destructive/20 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 shrink-0">
          <Button 
            variant="outline" 
            className="flex-1 text-xs h-9 bg-background" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1 text-xs h-9 font-bold flex items-center justify-center gap-1.5" 
            onClick={handleClear}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Clearing...
              </>
            ) : (
              'Reset Database'
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
