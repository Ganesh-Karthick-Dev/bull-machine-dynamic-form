"use client";

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  Database,
  Info,
  Package,
  TrendingDown,
  ChevronRight,
  ShieldAlert,
  Upload
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImportExcelModal from '@/components/ImportExcelModal';
import ClearDatabaseModal from '@/components/ClearDatabaseModal';

interface StockItem {
  id: number;
  item: string;
  currentStockQuantity: number;
  minimumQuantity: number;
  material: string;
  createdAt: string;
}

const emptyStock: Partial<StockItem> = {
  item: '',
  currentStockQuantity: 0,
  minimumQuantity: 0,
  material: ''
};

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState('All'); // 'All' or 'Low'

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  
  const [currentStock, setCurrentStock] = useState<Partial<StockItem>>(emptyStock);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch stocks with pagination
  const fetchStocks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
        status: filterLowStock
      });
      const res = await fetch(`/api/stocks?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setStocks(result.data);
        setTotalRows(result.total);
        setTotalPages(result.totalPages);
      }
    } catch (e) {
      console.error("Failed to fetch stocks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [page, limit, searchQuery, filterLowStock]);

  // Reset page when search or status filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterLowStock]);

  const handleOpenCreate = () => {
    setCurrentStock(emptyStock);
    setFormOpen(true);
  };

  const handleOpenEdit = (stock: StockItem) => {
    setCurrentStock({ ...stock });
    setFormOpen(true);
  };

  const handleOpenDelete = (stock: StockItem) => {
    setSelectedStock(stock);
    setDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = currentStock.id ? 'PUT' : 'POST';
      const res = await fetch('/api/stocks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentStock),
      });

      if (res.ok) {
        fetchStocks();
        setFormOpen(false);
      } else {
        alert("Failed to save stock record");
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStock) return;
    try {
      const res = await fetch(`/api/stocks?id=${selectedStock.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchStocks();
        setDeleteOpen(false);
      } else {
        alert("Failed to delete stock record");
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const handleInputChange = (key: keyof StockItem, value: any) => {
    setCurrentStock(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <>
      <div className="space-y-5 animate-fadeIn font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="h-5.5 w-5.5 text-primary" />
            Inventory & Stock Levels
          </h1>
          <p className="text-xs text-muted-foreground">Monitor real-time warehouse quantities, track minimum thresholds, and adjust inventory.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setClearOpen(true)}
            variant="destructive"
            size="sm"
            className="font-bold text-xs h-9 shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Data
          </Button>
          <Button 
            onClick={() => setImportOpen(true)}
            variant="outline"
            size="sm"
            className="font-bold text-xs h-9 shadow-sm flex items-center gap-1.5 self-start sm:self-auto border-dashed hover:bg-muted/50"
          >
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            Import Excel
          </Button>
          <Button 
            onClick={handleOpenCreate}
            size="sm"
            className="font-bold text-xs h-9 shadow-sm shadow-primary/10 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add Stock Item
          </Button>
        </div>
      </div>



      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-muted/20 border p-3 rounded-lg">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by Item name or Material code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Filter Stock Status:</Label>
          <select
            value={filterLowStock}
            onChange={(e) => setFilterLowStock(e.target.value)}
            className="h-9 px-2 bg-background border rounded-lg text-xs focus:outline-none w-full md:w-36 cursor-pointer"
          >
            <option value="All">All Items</option>
            <option value="Low">Low Stock Alerts</option>
          </select>
        </div>
      </div>

      {/* Stocks Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Loading stock quantities from PostgreSQL...
              </div>
            ) : stocks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No items found in stock records.
              </div>
            ) : (
              <>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-4">Item Name</th>
                      <th className="py-2.5 px-3">Material Code</th>
                      <th className="py-2.5 px-3">Current Quantity</th>
                      <th className="py-2.5 px-3">Minimum Required</th>
                      <th className="py-2.5 px-3">Alert Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {stocks.map((s) => {
                      const isLow = s.currentStockQuantity < s.minimumQuantity;
                      return (
                        <tr 
                          key={s.id} 
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-foreground text-sm">{s.item}</td>
                          <td className="py-3 px-3 text-muted-foreground font-mono font-medium text-xs">{s.material}</td>
                          <td className="py-3 px-3 text-foreground font-extrabold text-sm">{s.currentStockQuantity}</td>
                          <td className="py-3 px-3 text-muted-foreground font-semibold text-xs">{s.minimumQuantity}</td>
                          <td className="py-3 px-3">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                                <AlertTriangle className="h-3 w-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(s)}
                              title="Edit Stock Item"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleOpenDelete(s)}
                              title="Delete Stock Item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 border-t bg-muted/10 shrink-0 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Rows per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(parseInt(e.target.value, 10));
                        setPage(1);
                      }}
                      className="h-7 px-1.5 bg-background border rounded text-[11px] focus:outline-none cursor-pointer"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <span className="text-muted-foreground ml-2">
                      Showing {totalRows > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalRows)} of {totalRows} records
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="h-7 px-2 text-[11px] font-semibold bg-background"
                    >
                      Previous
                    </Button>
                    <span className="text-muted-foreground px-2 font-medium">
                      Page {page} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages || totalPages === 0}
                      className="h-7 px-2 text-[11px] font-semibold bg-background"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

      {/* --- CREATE / EDIT FORM FULL SCREEN MODAL --- */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col w-full h-full p-6 sm:p-8 overflow-hidden animate-fadeIn">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Boxes className="h-5.5 w-5.5" />
              </div>
              <div>
                <h2 className="font-extrabold text-foreground text-base">
                  {currentStock.id ? 'Edit Stock Specifications' : 'Add New Inventory Material'}
                </h2>
                <p className="text-xs text-muted-foreground">Adjust warehouse counts and alert thresholds for PostgreSQL records</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 border hover:bg-muted" onClick={() => setFormOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form Body - Scrollable Content + Fixed Footer */}
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden text-xs">
            <div className="flex-1 overflow-y-auto pr-2 py-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Col 1: Material Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <Package className="h-3.5 w-3.5" /> 1. Stock Identity & Naming
                  </h4>
                  <div className="space-y-4 bg-muted/20 border p-4.5 rounded-xl">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase">Item Name</Label>
                      <Input 
                        required 
                        value={currentStock.item || ''} 
                        onChange={(e) => handleInputChange('item', e.target.value)} 
                        placeholder="e.g. Heavy Gear A"
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase">Material Code Reference</Label>
                      <Input 
                        required 
                        value={currentStock.material || ''} 
                        onChange={(e) => handleInputChange('material', e.target.value)} 
                        placeholder="e.g. MAT-9921"
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Col 2: Stock Quantities */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <Database className="h-3.5 w-3.5" /> 2. Quantity Management
                  </h4>
                  <div className="space-y-4 bg-muted/20 border p-4.5 rounded-xl">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase">Current Stock Quantity</Label>
                      <Input 
                        type="number"
                        required 
                        value={currentStock.currentStockQuantity || 0} 
                        onChange={(e) => handleInputChange('currentStockQuantity', e.target.value)} 
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground uppercase">Minimum Alert Quantity</Label>
                      <Input 
                        type="number"
                        required 
                        value={currentStock.minimumQuantity || 0} 
                        onChange={(e) => handleInputChange('minimumQuantity', e.target.value)} 
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Col 3: Guidelines info */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <Info className="h-3.5 w-3.5" /> 3. Replenishment Policy
                  </h4>
                  <div className="p-4 bg-muted/20 border rounded-xl space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                    <p>
                      When **Current Stock** falls below the **Minimum Alert Quantity**, the dashboard will tag this material with a red status badge.
                    </p>
                    <p>
                      Make sure to cross-reference the Material Code with open purchase orders to prevent duplicate bookings.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t pt-4 mt-4 shrink-0">
              <Button 
                variant="outline" 
                className="px-6 text-xs h-9 bg-background" 
                onClick={() => setFormOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                className="px-6 text-xs h-9 font-bold" 
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving Inventory...' : 'Save Stock Record'}
              </Button>
            </div>

          </form>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {deleteOpen && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-background border rounded-xl shadow-2xl max-w-sm w-full p-5 text-center animate-scaleIn">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-sm mb-1">Delete Stock Record?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Are you sure you want to delete the stock record for <strong>{selectedStock.item}</strong> ({selectedStock.material})? This will remove it from database logs.
            </p>
            <div className="flex gap-2.5">
              <Button 
                variant="outline" 
                className="flex-1 text-xs h-8.5 bg-background" 
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 text-xs h-8.5 font-bold" 
                onClick={handleDelete}
              >
                Delete Stock Item
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* --- IMPORT EXCEL MODAL --- */}
      <ImportExcelModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        type="stocks"
        onSuccess={fetchStocks}
      />
      {/* --- CLEAR DATABASE MODAL --- */}
      <ClearDatabaseModal
        isOpen={clearOpen}
        onClose={() => setClearOpen(false)}
        onSuccess={fetchStocks}
      />

    </>
  );
}
