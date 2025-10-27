import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { getReports, createReport as apiCreateReport, deleteReport as apiDeleteReport } from "../lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

export function ReportsView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await getReports({ page, perPage });
        if (!mounted) return;
        // res = { data, total, page, perPage }
        setReports(res.data);
        setTotalCount(res.total || 0);
      } catch (e) {
        if (mounted) setError('Failed to load reports');
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPage();
    return () => { mounted = false };
  }, [page, perPage]);

  const handleGenerateReport = async (period = 'weekly') => {
    try {
      // simple automatic date ranges: last 7 days or last 30 days
      const end = new Date();
      const start = new Date();
      if (period === 'weekly') start.setDate(end.getDate() - 7);
      else start.setDate(end.getDate() - 30);

      const format = (d) => d.toISOString().split('T')[0];

      await apiCreateReport({ period, startDate: format(start), endDate: format(end) });
      // refresh page
      const res = await getReports({ page, perPage });
      setReports(res.data);
      setTotalCount(res.total || 0);
    } catch (e) {
      setError('Failed to generate report');
      console.error(e);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Reports</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Periodic snapshots of inventory totals (weekly/monthly)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleGenerateReport('weekly')}>Generate Weekly</Button>
          <Button onClick={() => handleGenerateReport('monthly')}>Generate Monthly</Button>
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
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Total Items</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Low Stock</TableHead>
                    <TableHead>Out of Stock</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.period}</TableCell>
                      <TableCell>{r.startDate}</TableCell>
                      <TableCell>{r.endDate}</TableCell>
                      <TableCell>{r.totalItems}</TableCell>
                      <TableCell>₱{parseFloat(r.totalValue).toLocaleString()}</TableCell>
                      <TableCell>{r.lowStockCount}</TableCell>
                      <TableCell>{r.outOfStockCount}</TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setDeleting(r)}>Delete</Button>
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

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this report? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleting(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              try {
                await apiDeleteReport(deleting.id);
                // refresh page after delete
                const res = await getReports({ page, perPage });
                setReports(res.data);
                setTotalCount(res.total || 0);
                setDeleting(null);
              } catch (e) {
                setError('Failed to delete report');
                console.error(e);
              }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ReportsView;
