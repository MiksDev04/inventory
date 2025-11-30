import { useEffect, useState } from "react";
import { Download, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Toast } from './Toast';
import api from '../lib/api';

export default function ReportsView({ reports: initialReports = [], pagination: initialPagination = { page: 1, perPage: 10, total: 0 }, onNavigate }) {
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [archiving, setArchiving] = useState(null);
  const [page, setPage] = useState(initialPagination.page);
  const [perPage, setPerPage] = useState(initialPagination.perPage);
  const [totalCount, setTotalCount] = useState(initialPagination.total);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Update local state when props change
  useEffect(() => {
    setReports(initialReports);
    setTotalCount(initialPagination.total);
  }, [initialReports, initialPagination]);

  const handleGenerateReport = async (period = 'weekly') => {
    try {
      const end = new Date();
      const start = new Date();
      if (period === 'weekly') {
        start.setDate(end.getDate() - 7);
      } else {
        start.setMonth(end.getMonth() - 1);
      }

      const format = (d) => d.toISOString().split('T')[0];

      await api.createReport({ period, startDate: format(start), endDate: format(end) });
      showToast(`${period.charAt(0).toUpperCase() + period.slice(1)} report generated successfully!`, 'success');
    } catch (e) {
      setError('Failed to generate report');
      showToast('Failed to generate report', 'error');
      console.error(e);
    }
  };

  const handleArchiveReport = async () => {
    if (!archiving) return;
    try {
      await api.archiveReport(archiving.id);
      setArchiving(null);
      showToast('Report archived successfully!', 'success');
    } catch (e) {
      setError('Failed to archive report');
      showToast('Failed to archive report', 'error');
      console.error(e);
    }
  };

  const handleExport = () => {
    // Prepare CSV data
    const headers = [
      'Period',
      'Start Date',
      'End Date',
      'Days',
      'Total Stock',
      'Stock Change',
      'Total Value',
      'Value Change %',
      'Products Added',
      'Products Removed',
      'Products Updated',
      'Total Transactions',
      'Avg Daily Transactions',
      'Low Stock Count',
      'Out of Stock Count',
      'Created'
    ];
    
    const rows = reports.map(r => [
      r.period || '',
      r.startDate || '',
      r.endDate || '',
      r.daysInPeriod || '',
      r.totalProducts || 0,
      r.stockChange || 0,
      r.totalValue || 0,
      r.valueChangePercent || 0,
      r.productsAdded || 0,
      r.productsRemoved || 0,
      r.productsUpdated || 0,
      r.totalTransactions || 0,
      r.avgDailyTransactions || 0,
      r.lowStockCount || 0,
      r.outOfStockCount || 0,
      r.createdAt ? new Date(r.createdAt).toLocaleString() : ''
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
    link.setAttribute('download', `inventory_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl">Reports</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Periodic snapshots of inventory totals (weekly/monthly)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" onClick={() => onNavigate && onNavigate('archived-reports')} className="gap-2">
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Archived</span>
          </Button>
          <Button onClick={() => handleGenerateReport('weekly')} className="text-sm">Generate Weekly</Button>
          <Button onClick={() => handleGenerateReport('monthly')} className="text-sm">Generate Monthly</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="rounded-md border">
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">{error}</div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Total Stock</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Activities</TableHead>
                    <TableHead>Stock Issues</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="capitalize font-medium">{r.period}</TableCell>
                      <TableCell className="text-sm">
                        <div>{r.startDate}</div>
                        <div className="text-gray-500">to {r.endDate}</div>
                      </TableCell>
                      <TableCell>{r.daysInPeriod || 'N/A'}</TableCell>
                      <TableCell className="font-medium">
                        <div>{r.totalProducts || 0} units</div>
                        {r.stockChange !== undefined && (
                          <div className={`text-xs ${
                            r.stockChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                          }`}>
                            {r.stockChange >= 0 ? '+' : ''}{r.stockChange}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>₱{parseFloat(r.totalValue || 0).toLocaleString()}</div>
                        {r.valueChange !== undefined && (
                          <div className={`text-xs ${
                            r.valueChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                          }`}>
                            {r.valueChange >= 0 ? '+' : ''}{r.valueChangePercent}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.productsAdded !== undefined ? (
                          <div>
                            <div className="text-green-600 dark:text-green-500">+{r.productsAdded || 0} added</div>
                            <div className="text-red-600 dark:text-red-500">-{r.productsRemoved || 0} removed</div>
                            <div className="text-blue-600 dark:text-blue-500">{r.productsUpdated || 0} updated</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{r.totalTransactions || 0} total</div>
                        <div className="text-gray-500">{parseFloat(r.avgDailyTransactions || 0).toFixed(1)}/day</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 text-sm">
                          {r.lowStockCount > 0 && (
                            <span className="text-yellow-600 dark:text-yellow-500">{r.lowStockCount} low</span>
                          )}
                          {r.outOfStockCount > 0 && (
                            <span className="text-red-600 dark:text-red-500">{r.outOfStockCount} out</span>
                          )}
                          {!r.lowStockCount && !r.outOfStockCount && (
                            <span className="text-gray-400">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setArchiving(r)} className="gap-1">
                            <Archive className="w-3 h-3" />
                            Archive
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* pagination controls */}
              <div className="flex items-center justify-between mt-4 p-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
                  <div>Page {page} of {Math.max(1, Math.ceil((totalCount || 0) / perPage))}</div>
                  <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.max(1, Math.ceil((totalCount || 0) / perPage))}>Next</Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">Per page:</div>
                  <select value={perPage} onChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(1); }} className="border rounded px-2 py-1">
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!archiving} onOpenChange={() => setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive report?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to archive this report? You can restore it later from the archived reports page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArchiving(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveReport}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
