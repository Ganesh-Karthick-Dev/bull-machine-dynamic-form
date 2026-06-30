"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileClock, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  AlertTriangle, 
  Mail, 
  Database,
  Building,
  User,
  ShoppingBag,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
  Upload
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImportExcelModal from '@/components/ImportExcelModal';
import ClearDatabaseModal from '@/components/ClearDatabaseModal';

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

const emptyOrder: Partial<OverdueOrder> = {
  plant: '',
  purchasing_group: '',
  material: '',
  mat_desc: '',
  vendor_code: '',
  vendor_name: '',
  vendor_number: '',
  vendor_email: '',
  po_no: '',
  order_due_date: '',
  po_item_no: '',
  uom: '',
  delivery_schedule_qty: 0,
  pending_qty: 0,
  despatch_date_supplier: '',
  delivery_date_bull: '',
  asn_number: '',
  further_despatch_date: '',
  form_id: '',
  thanking_you_email: 'Pending',
  trigger_id: '',
  first_mail_sent: 'No'
};

export default function OverdueOrdersPage() {
  const [orders, setOrders] = useState<OverdueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlant, setFilterPlant] = useState('All');
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  
  const [currentOrder, setCurrentOrder] = useState<Partial<OverdueOrder>>(emptyOrder);
  const [selectedOrder, setSelectedOrder] = useState<OverdueOrder | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  // Fetch orders with pagination
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
        plant: filterPlant
      });
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setOrders(result.data);
        setTotalRows(result.total);
        setTotalPages(result.totalPages);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, limit, searchQuery, filterPlant]);

  // Reset page when search or plant filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterPlant]);

  // Format date helper (YYYY-MM-DD)
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  // CRUD actions
  const handleOpenCreate = () => {
    setCurrentOrder(emptyOrder);
    setFormOpen(true);
  };

  const handleOpenEdit = (order: OverdueOrder, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details drawer
    setCurrentOrder({
      ...order,
      order_due_date: formatDate(order.order_due_date),
      despatch_date_supplier: formatDate(order.despatch_date_supplier),
      delivery_date_bull: formatDate(order.delivery_date_bull),
      further_despatch_date: formatDate(order.further_despatch_date),
    });
    setFormOpen(true);
  };

  const handleOpenDetail = (order: OverdueOrder) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleOpenDelete = (order: OverdueOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = currentOrder.id ? 'PUT' : 'POST';
      const res = await fetch('/api/orders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentOrder),
      });

      if (res.ok) {
        fetchOrders();
        setFormOpen(false);
      } else {
        alert("Failed to save order");
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/orders?id=${selectedOrder.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchOrders();
        setDeleteOpen(false);
      } else {
        alert("Failed to delete order");
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  // Input change handler
  const handleInputChange = (key: keyof OverdueOrder, value: any) => {
    setCurrentOrder(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Filter and Search logic
  return (
    <>
      <div className="space-y-5 animate-fadeIn font-sans">
      
      {/* Top action/filter header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileClock className="h-5.5 w-5.5 text-primary" />
            Overdue Purchase Orders
          </h1>
          <p className="text-xs text-muted-foreground">Log, monitor, and execute alerts for orders past their committed delivery schedules.</p>
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
            Add Overdue Order
          </Button>
        </div>
      </div>



      {/* Filter panel */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-muted/20 border p-3 rounded-lg">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by PO No, Vendor Name, Material Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Filter Plant:</Label>
          <select
            value={filterPlant}
            onChange={(e) => setFilterPlant(e.target.value)}
            className="h-9 px-2 bg-background border rounded-lg text-xs focus:outline-none w-full md:w-32 cursor-pointer"
          >
            <option value="All">All Plants</option>
            <option value="P001">Plant P001</option>
            <option value="P002">Plant P002</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Loading overdue orders from PostgreSQL...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No overdue orders found matching filters.
              </div>
            ) : (
              <>
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-4">PO No / Item</th>
                      <th className="py-2.5 px-3">Plant</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Vendor details</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Pending Qty</th>
                      <th className="py-2.5 px-3">Logistical Status</th>
                      <th className="py-2.5 px-3">Alert Sent</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {orders.map((o) => (
                      <tr 
                        key={o.id} 
                        className="hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => handleOpenDetail(o)}
                      >
                        <td className="py-3 px-4 font-bold text-foreground">
                          <div className="flex flex-col">
                            <span>{o.po_no}</span>
                            <span className="text-[9px] text-muted-foreground font-normal">Item: {o.po_item_no}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground font-medium">{o.plant}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col max-w-[150px]">
                            <span className="font-semibold text-foreground truncate">{o.material}</span>
                            <span className="text-[9px] text-muted-foreground truncate" title={o.mat_desc}>{o.mat_desc}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col max-w-[160px]">
                            <span className="font-semibold text-foreground truncate">{o.vendor_name}</span>
                            <span className="text-[9px] text-muted-foreground font-mono truncate">{o.vendor_code}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground font-semibold whitespace-nowrap">
                          {formatDate(o.order_due_date)}
                        </td>
                        <td className="py-3 px-3 text-foreground font-bold">
                          {o.pending_qty} <span className="text-[9px] text-muted-foreground font-normal">{o.uom}</span>
                          <div className="text-[9px] text-muted-foreground font-normal">of {o.delivery_schedule_qty}</div>
                        </td>
                        <td className="py-3 px-3">
                          {o.asn_number ? (
                            <div className="flex flex-col text-[9px]">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">ASN: {o.asn_number}</span>
                              <span className="text-muted-foreground">Bull arrival: {formatDate(o.delivery_date_bull)}</span>
                            </div>
                          ) : o.further_despatch_date ? (
                            <div className="flex flex-col text-[9px]">
                              <span className="font-bold text-amber-600 dark:text-amber-400">Not despatched</span>
                              <span className="text-muted-foreground">Est. despatch: {formatDate(o.further_despatch_date)}</span>
                            </div>
                          ) : (
                            <span className="text-red-500 font-medium">No tracking details</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold border ${
                            o.first_mail_sent === 'Yes' || o.first_mail_sent === 'Sent'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            {o.first_mail_sent === 'Yes' || o.first_mail_sent === 'Sent' ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => handleOpenEdit(o, e)}
                            title="Edit Row"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleOpenDelete(o, e)}
                            title="Delete Row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
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

      {/* --- DETAIL MODAL FULL SCREEN --- */}
      {detailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col w-full h-full p-6 sm:p-8 overflow-hidden animate-fadeIn">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileClock className="h-5.5 w-5.5" />
              </div>
              <div>
                <h2 className="font-extrabold text-foreground text-base">PO Detail Full-Screen View</h2>
                <p className="text-xs text-muted-foreground">Full schema record of purchase order #{selectedOrder.po_no}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 border hover:bg-muted" onClick={() => setDetailOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Scrollable Content Area - 3 Column Layout */}
          <div className="flex-1 overflow-y-auto pr-2 py-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Organization & Supplier Info */}
              <div className="space-y-6">
                {/* Group 1: Order Metadata */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> 1. General Organization
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-muted/20 border p-3.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Plant</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.plant}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Purchasing Group</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.purchasing_group}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">PO Number</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.po_no}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">PO Item No</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.po_item_no}</span>
                    </div>
                  </div>
                </div>

                {/* Group 3: Vendor Info */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> 2. Supplier Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-muted/20 border p-3.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Vendor Code</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.vendor_code}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Vendor Name</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.vendor_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Vendor Number</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.vendor_number}</span>
                    </div>
                    <div className="col-span-2 mt-1 pt-1.5 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Vendor Email</span>
                      <span className="font-bold text-foreground text-sm truncate block">{selectedOrder.vendor_email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Material Specifications */}
              <div className="space-y-6">
                {/* Group 2: Material Info */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" /> 3. Material Specifications
                  </h4>
                  <div className="space-y-3 bg-muted/20 border p-3.5 rounded-xl">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Material Code</span>
                        <span className="font-bold text-foreground text-sm">{selectedOrder.material}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">UOM</span>
                        <span className="font-bold text-foreground text-sm">{selectedOrder.uom}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Material Description</span>
                      <span className="font-bold text-foreground block leading-relaxed text-sm">{selectedOrder.mat_desc}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-border/40">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Delivery Schedule Qty</span>
                        <span className="font-bold text-foreground text-sm">{selectedOrder.delivery_schedule_qty}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Pending Qty</span>
                        <span className="font-bold text-foreground text-sm">{selectedOrder.pending_qty}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Logistics & System Triggers */}
              <div className="space-y-6">
                {/* Group 4: Logistical Dates */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> 4. Logistical Timings & Tracking
                  </h4>
                  <div className="space-y-3 bg-muted/20 border p-3.5 rounded-xl">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Order Due Date</span>
                        <span className="font-bold text-destructive text-sm">{formatDate(selectedOrder.order_due_date)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Supplier Despatch Date</span>
                        <span className="font-bold text-foreground text-sm">{formatDate(selectedOrder.despatch_date_supplier) || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Bull Delivery Date</span>
                        <span className="font-bold text-foreground text-sm">{formatDate(selectedOrder.delivery_date_bull) || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">ASN Number</span>
                        <span className="font-bold text-foreground text-sm">{selectedOrder.asn_number || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Further Despatch Date (If not despatched)</span>
                      <span className="font-bold text-foreground text-sm">{formatDate(selectedOrder.further_despatch_date) || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Group 5: Digital Integration */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> 5. Trigger Logs & Emails
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-muted/20 border p-3.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Form ID</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.form_id || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Trigger ID</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.trigger_id || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">First Mail Sent</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.first_mail_sent || 'No'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Thanking You Email</span>
                      <span className="font-bold text-foreground text-sm">{selectedOrder.thanking_you_email || 'Pending'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t pt-4 mt-4 flex gap-3 shrink-0 justify-end">
            <Button 
              variant="outline" 
              className="px-6 text-xs h-9 bg-background"
              onClick={() => {
                setDetailOpen(false);
                setCurrentOrder({
                  ...selectedOrder,
                  order_due_date: formatDate(selectedOrder.order_due_date),
                  despatch_date_supplier: formatDate(selectedOrder.despatch_date_supplier),
                  delivery_date_bull: formatDate(selectedOrder.delivery_date_bull),
                  further_despatch_date: formatDate(selectedOrder.further_despatch_date),
                });
                setFormOpen(true);
              }}
            >
              Edit Order
            </Button>
            <Button 
              variant="default" 
              className="px-6 text-xs h-9 font-bold"
              onClick={() => setDetailOpen(false)}
            >
              Close View
            </Button>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT FORM FULL SCREEN --- */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col w-full h-full p-6 sm:p-8 overflow-hidden animate-fadeIn">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileClock className="h-5.5 w-5.5" />
              </div>
              <div>
                <h2 className="font-extrabold text-foreground text-base">
                  {currentOrder.id ? 'Edit Overdue Order Details' : 'Create New Overdue Order Entry'}
                </h2>
                <p className="text-xs text-muted-foreground">Configure field schema and database records for this overdue PO</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 border hover:bg-muted" onClick={() => setFormOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>          {/* Form Body - Scrollable Content + Fixed Footer */}
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden text-xs">
            <div className="flex-1 overflow-y-auto pr-2 py-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Column 1: PO Info & Material Specs */}
                <div className="space-y-6">
                  {/* Section 1: Order details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                      <Building className="h-3.5 w-3.5" /> 1. Purchase Order Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-muted/20 border p-3.5 rounded-xl">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">PO Number</Label>
                        <Input 
                          required 
                          value={currentOrder.po_no || ''} 
                          onChange={(e) => handleInputChange('po_no', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">PO Item No</Label>
                        <Input 
                          required 
                          value={currentOrder.po_item_no || ''} 
                          onChange={(e) => handleInputChange('po_item_no', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">Plant</Label>
                        <Input 
                          required 
                          value={currentOrder.plant || ''} 
                          onChange={(e) => handleInputChange('plant', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">Purchasing Group</Label>
                        <Input 
                          value={currentOrder.purchasing_group || ''} 
                          onChange={(e) => handleInputChange('purchasing_group', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Material Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                      <ShoppingBag className="h-3.5 w-3.5" /> 2. Material Specifications
                    </h4>
                    <div className="space-y-3 bg-muted/20 border p-3.5 rounded-xl">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">Material Code</Label>
                          <Input 
                            required 
                            value={currentOrder.material || ''} 
                            onChange={(e) => handleInputChange('material', e.target.value)} 
                            className="h-8.5 text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">UOM</Label>
                          <Input 
                            required 
                            value={currentOrder.uom || ''} 
                            onChange={(e) => handleInputChange('uom', e.target.value)} 
                            placeholder="e.g. PCS, KG" 
                            className="h-8.5 text-xs bg-background"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">Material Description</Label>
                        <Input 
                          value={currentOrder.mat_desc || ''} 
                          onChange={(e) => handleInputChange('mat_desc', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">Total Ordered Qty</Label>
                          <Input 
                            type="number"
                            required 
                            value={currentOrder.delivery_schedule_qty || 0} 
                            onChange={(e) => handleInputChange('delivery_schedule_qty', e.target.value)} 
                            className="h-8.5 text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">Pending Qty</Label>
                          <Input 
                            type="number"
                            required 
                            value={currentOrder.pending_qty || 0} 
                            onChange={(e) => handleInputChange('pending_qty', e.target.value)} 
                            className="h-8.5 text-xs bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Supplier Information */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                      <User className="h-3.5 w-3.5" /> 3. Supplier Credentials
                    </h4>
                    <div className="space-y-3 bg-muted/20 border p-3.5 rounded-xl">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">Vendor Code</Label>
                          <Input 
                            required 
                            value={currentOrder.vendor_code || ''} 
                            onChange={(e) => handleInputChange('vendor_code', e.target.value)} 
                            className="h-8.5 text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">Vendor Phone</Label>
                          <Input 
                            value={currentOrder.vendor_number || ''} 
                            onChange={(e) => handleInputChange('vendor_number', e.target.value)} 
                            className="h-8.5 text-xs bg-background"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">Vendor Name</Label>
                        <Input 
                          required 
                          value={currentOrder.vendor_name || ''} 
                          onChange={(e) => handleInputChange('vendor_name', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-border/40">
                        <Label className="text-[10px] text-muted-foreground uppercase">Vendor Email Address</Label>
                        <Input 
                          type="email"
                          required 
                          value={currentOrder.vendor_email || ''} 
                          onChange={(e) => handleInputChange('vendor_email', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Logistics & Alert Triggers */}
                <div className="space-y-6">
                  {/* Section 4: Logistical Tracking */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                      <Clock className="h-3.5 w-3.5" /> 4. Logistical Tracking
                    </h4>
                    <div className="space-y-3 bg-muted/20 border p-3.5 rounded-xl">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">Order Due Date</Label>
                          <input 
                            type="date"
                            required 
                            value={currentOrder.order_due_date || ''} 
                            onChange={(e) => handleInputChange('order_due_date', e.target.value)} 
                            className="w-full h-8.5 px-2.5 bg-background border rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">Supplier Despatch</Label>
                          <input 
                            type="date"
                            value={currentOrder.despatch_date_supplier || ''} 
                            onChange={(e) => handleInputChange('despatch_date_supplier', e.target.value)} 
                            className="w-full h-8.5 px-2.5 bg-background border rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">Bull Delivery Date</Label>
                          <input 
                            type="date"
                            value={currentOrder.delivery_date_bull || ''} 
                            onChange={(e) => handleInputChange('delivery_date_bull', e.target.value)} 
                            className="w-full h-8.5 px-2.5 bg-background border rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-muted-foreground uppercase">ASN Number</Label>
                          <Input 
                            value={currentOrder.asn_number || ''} 
                            onChange={(e) => handleInputChange('asn_number', e.target.value)} 
                            placeholder="e.g. ASN-1092" 
                            className="h-8.5 text-xs bg-background"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-border/40">
                        <Label className="text-[10px] text-muted-foreground uppercase">Further Despatch Date (If not despatched)</Label>
                        <input 
                          type="date"
                          value={currentOrder.further_despatch_date || ''} 
                          onChange={(e) => handleInputChange('further_despatch_date', e.target.value)} 
                          className="w-full h-8.5 px-2.5 bg-background border rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Integration details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-[10px] text-primary uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                      <Info className="h-3.5 w-3.5" /> 5. Form & Trigger Alerts
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-muted/20 border p-3.5 rounded-xl">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">Form ID</Label>
                        <Input 
                          value={currentOrder.form_id || ''} 
                          onChange={(e) => handleInputChange('form_id', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">Trigger ID</Label>
                        <Input 
                          value={currentOrder.trigger_id || ''} 
                          onChange={(e) => handleInputChange('trigger_id', e.target.value)} 
                          className="h-8.5 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">First Mail Sent</Label>
                        <select
                          value={currentOrder.first_mail_sent || 'No'}
                          onChange={(e) => handleInputChange('first_mail_sent', e.target.value)}
                          className="w-full h-8.5 px-2 bg-background border rounded-lg text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="No">No (Not Sent)</option>
                          <option value="Yes">Yes (Sent)</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase">Thanking You Email</Label>
                        <select
                          value={currentOrder.thanking_you_email || 'Pending'}
                          onChange={(e) => handleInputChange('thanking_you_email', e.target.value)}
                          className="w-full h-8.5 px-2 bg-background border rounded-lg text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Sent">Sent (Success)</option>
                          <option value="Not Needed">Not Needed</option>
                        </select>
                      </div>
                    </div>
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
                {isSaving ? 'Saving PO...' : 'Save Order Record'}
              </Button>
            </div>

          </form>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {deleteOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-background border rounded-xl shadow-2xl max-w-sm w-full p-5 text-center animate-scaleIn">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-sm mb-1">Delete Overdue Order?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Are you sure you want to delete PO <strong>#{selectedOrder.po_no}</strong> (Item {selectedOrder.po_item_no})? This action will permanently remove it from the PostgreSQL database.
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
                Delete PO Record
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* --- IMPORT EXCEL MODAL --- */}
      <ImportExcelModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        type="overdue"
        onSuccess={fetchOrders}
      />
      {/* --- CLEAR DATABASE MODAL --- */}
      <ClearDatabaseModal
        isOpen={clearOpen}
        onClose={() => setClearOpen(false)}
        onSuccess={fetchOrders}
      />

    </>
  );
}
