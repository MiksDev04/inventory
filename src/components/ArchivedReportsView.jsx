import { useEffect, useState } from "react";
import { RotateCcw, Trash2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Toast } from './Toast';
import api from '../lib/api';
import * as fb from '../lib/firebaseClient';

export default function ArchivedReportsView({ onNavigate }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Set up real-time listener for archived reports
  useEffect(() => {
    const unsubscribe = fb.subscribeToReports((allReports) => {
      // Filter only archived reports
      const archived = allReports.filter(r => r.archived === true);
      setReports(archived);
    }, true); // includeArchived = true

    return () => unsubscribe();
  }, []);

  const handleRestoreReport = async () => {
    if (!restoring) return;
    try {
      // Restore report by setting archived to false
      await fb.updateDoc(fb.doc(fb.db, 'inventory_reports', String(restoring.id)), { 
        archived: false,
        archivedAt: null
      });
      setRestoring(null);
      showToast('Report restored successfully!', 'success');
    } catch (e) {
      setError('Failed to restore report');
      showToast('Failed to restore report', 'error');
      console.error(e);
    }
  };

  const handleDeleteReport = async () => {
    if (!deleting) return;
    try {
      await api.deleteReport(deleting.id);
      setDeleting(null);
      showToast('Report permanently deleted!', 'success');
    } catch (e) {
      setError('Failed to delete report');
      showToast('Failed to delete report', 'error');
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl">Archived Reports</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">View and restore archived inventory reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate && onNavigate('reports')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Reports</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archived Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No archived reports found
            </div>
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
                    <TableHead>Archived</TableHead>
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
                      <TableCell className="text-sm text-gray-500">
                        {r.archivedAt ? new Date(r.archivedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setRestoring(r)} className="gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleting(r)} className="gap-1">
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!restoring} onOpenChange={() => setRestoring(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore report?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to restore this report? It will be moved back to the active reports.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoring(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreReport}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete report?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleting(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} className="bg-red-600 hover:bg-red-700">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
