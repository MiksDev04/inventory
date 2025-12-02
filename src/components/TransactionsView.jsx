import { useMemo, useState } from "react";
import { ArrowLeftRight, Search, Filter, Download, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectProduct, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export default function TransactionsView({
  transactions = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("30"); // days
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const filtered = useMemo(() => {
    // Apply type and search filters
    let result = (transactions || []).filter((t) => {
      // type filter
      const matchesType =
        typeFilter === "all" ||
        String(t.type || "").toLowerCase() === String(typeFilter).toLowerCase();

      // search filter
      const s = searchTerm.toLowerCase();
      const text = [
        t.itemName,
        t.itemSku,
        t.productName,
        t.productSku,
        t.notes,
        t.partyName,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
        .join(" ");
      const matchesSearch = !s || text.includes(s);

      return matchesType && matchesSearch;
    });

    // Apply date filter if not "All"
    if (periodFilter !== "36500") {
      const now = new Date();
      const days = Number(periodFilter);
      const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      result = result.filter((t) => {
        const d = t.createdAt || t.date || t.created_at;
        let transactionDate = null;
        
        // Handle different date formats
        if (d) {
          if (d instanceof Date) {
            transactionDate = d;
          } else if (typeof d === 'object' && d.toDate && typeof d.toDate === 'function') {
            // Firestore Timestamp
            transactionDate = d.toDate();
          } else if (typeof d === 'string' || typeof d === 'number') {
            const parsed = new Date(d);
            if (!isNaN(parsed.getTime())) {
              transactionDate = parsed;
            }
          }
        }
        
        return transactionDate && transactionDate >= cutoffDate;
      });
    }

    return result;
  }, [transactions, searchTerm, typeFilter, periodFilter]);

  const handleExport = () => {
    // Prepare CSV data
    const headers = ['Date', 'Type', 'Product', 'SKU', 'Quantity', 'Unit Price', 'Total', 'Party/Supplier', 'Notes'];
    const rows = filtered.map(t => [
      t.createdAt ? new Date(t.createdAt).toLocaleString() : '',
      t.type || '',
      t.productName || t.itemName || '',
      t.productSku || t.itemSku || '',
      t.quantity || 0,
      t.unitPrice || 0,
      t.total || 0,
      t.supplier || t.partyName || '',
      (t.notes || '').replace(/[\n\r"/]/g, ' ')
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl dark:text-white">Transactions</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Track purchases, sales, and adjustments</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by product, SKU, supplier, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectProduct value="all">All Types</SelectProduct>
                <SelectProduct value="product_create">Product Create</SelectProduct>
                <SelectProduct value="product_update">Product Update</SelectProduct>
                <SelectProduct value="product_delete">Product Delete</SelectProduct>
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectProduct value="7">Last 7 days</SelectProduct>
                <SelectProduct value="30">Last 30 days</SelectProduct>
                <SelectProduct value="90">Last 90 days</SelectProduct>
                <SelectProduct value="36500">All</SelectProduct>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="whitespace-nowrap">Product</TableHead>
              <TableHead className="whitespace-nowrap">SKU</TableHead>
              <TableHead className="text-right whitespace-nowrap">Quantity</TableHead>
              <TableHead className="text-right whitespace-nowrap">Unit Price</TableHead>
              <TableHead className="text-right whitespace-nowrap">Total</TableHead>
              <TableHead className="whitespace-nowrap">Supplier</TableHead>
              <TableHead className="whitespace-nowrap">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500 dark:text-gray-400">
                No transactions found for selected filters.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((t) => {
              const qty = Number(t.quantity || 0);
              const unit = Number(t.unitPrice || t.price || 0);
              const total = Number(t.total || qty * unit);
              const dateStr = (() => {
                const d = t.createdAt || t.date || t.created_at;
                try {
                  const dd = d ? new Date(d) : null;
                  return dd ? dd.toISOString().split("T")[0] : "";
                } catch {
                  return String(d || "");
                }
              })();

              const isUpdate = String(t.type || '').toLowerCase() === 'product_update';
              const isCreate = String(t.type || '').toLowerCase() === 'product_create';
              const isDelete = String(t.type || '').toLowerCase() === 'product_delete';
              
              let notesText = '';
              
              if (isCreate || isDelete) {
                // Use the notes field directly for create/delete
                notesText = t.notes || '';
              } else if (isUpdate) {
                // Prefer detailed changes object if present
                if (t.changes && typeof t.changes === 'object') {
                  const parts = Object.entries(t.changes).map(([key, val]) => {
                    const from = val && typeof val === 'object' ? val.from : undefined;
                    const to = val && typeof val === 'object' ? val.to : undefined;
                    const isPrice = ['price', 'unitPrice'].includes(String(key));
                    const fmt = (v) => {
                      if (v === null || v === undefined || v === '') return '-';
                      const n = Number(v);
                      if (!Number.isNaN(n) && isPrice) return n.toFixed(2);
                      return String(v);
                    };
                    return `${key}: ${fmt(from)} → ${fmt(to)}`;
                  });
                  notesText = parts.join('; ');
                } else {
                  // Fallback to diffs summary
                  const changes = [];
                  const qd = Number(t.quantityDiff || t.quantity_diff);
                  if (!Number.isNaN(qd) && qd !== 0) changes.push(`quantity: ${qd > 0 ? '+' : ''}${qd}`);
                  const pd = Number(t.priceDiff || t.price_diff);
                  if (!Number.isNaN(pd) && pd !== 0) changes.push(`price: ${pd > 0 ? '+' : ''}${pd.toFixed(2)}`);
                  if (Array.isArray(t.changeFields || t.change_fields) && (t.changeFields || t.change_fields).length) {
                    const others = (t.changeFields || t.change_fields).filter((f) => !['quantity', 'price'].includes(String(f)));
                    if (others.length) changes.push(`fields: ${others.join(', ')}`);
                  }
                  notesText = changes.join('; ');
                }
              }

              return (
                <TableRow 
                  key={t.id || `${dateStr}-${t.itemSku || t.productSku || Math.random()}`}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTransaction(t);
                  }}
                >
                  <TableCell className="whitespace-nowrap">{dateStr}</TableCell>
                  <TableCell className="capitalize whitespace-nowrap">{String(t.type || "").toLowerCase()}</TableCell>
                  <TableCell className="whitespace-nowrap">{t.productName || t.product_name || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{t.itemSku || t.productSku || t.sku || "-"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{qty}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{unit.toFixed(2)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{total.toFixed(2)}</TableCell>
                  <TableCell className="whitespace-nowrap">{t.supplier || t.party_name || t.partyName || t.customer || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">{notesText}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4"
          onClick={() => setSelectedTransaction(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {(() => {
                      const d = selectedTransaction.createdAt || selectedTransaction.date || selectedTransaction.created_at;
                      try {
                        const dd = d ? new Date(d) : null;
                        return dd ? dd.toLocaleString() : "N/A";
                      } catch {
                        return String(d || "N/A");
                      }
                    })()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1 capitalize">
                    {String(selectedTransaction.type || "N/A").replace(/_/g, ' ')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Name</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.productName || selectedTransaction.product_name || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</label>
                  <p className="text-base font-mono text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.itemSku || selectedTransaction.productSku || selectedTransaction.sku || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.category || selectedTransaction.categoryName || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {Number(selectedTransaction.quantity || 0)} units
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit Price</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    ₱{Number(selectedTransaction.unitPrice || selectedTransaction.price || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                    ₱{Number(selectedTransaction.total || (selectedTransaction.quantity || 0) * (selectedTransaction.unitPrice || selectedTransaction.price || 0)).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Supplier</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.supplier || selectedTransaction.party_name || selectedTransaction.partyName || selectedTransaction.customer || "N/A"}
                  </p>
                </div>
              </div>

              {selectedTransaction.changes && Object.keys(selectedTransaction.changes).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Changes Made</label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(selectedTransaction.changes).map(([key, val]) => {
                      const from = val && typeof val === 'object' ? val.from : undefined;
                      const to = val && typeof val === 'object' ? val.to : undefined;
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{key}:</span>
                          <span className="text-red-600 dark:text-red-400">{String(from || '-')}</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-green-600 dark:text-green-400">{String(to || '-')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                    {selectedTransaction.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setSelectedTransaction(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
