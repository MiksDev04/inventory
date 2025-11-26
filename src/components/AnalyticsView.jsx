import { useEffect, useState } from "react";
import { TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getReports } from "../lib/api";

export function AnalyticsView({ products: initialProducts, categories: initialCategories, suppliers: initialSuppliers }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [categories, setCategories] = useState(initialCategories || []);
  const [suppliers, setSuppliers] = useState(initialSuppliers || []);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(!initialProducts || !initialCategories || !initialSuppliers);
  const [error, setError] = useState("");

  useEffect(() => {
    setProducts(initialProducts || []);
    setCategories(initialCategories || []);
    setSuppliers(initialSuppliers || []);
    if (initialProducts && initialCategories && initialSuppliers) {
      setLoading(false);
    }
  }, [initialProducts, initialCategories, initialSuppliers]);

  useEffect(() => {
    // Fetch reports for stock turnover calculation
    (async () => {
      try {
        const reportsData = await getReports();
        setReports(Array.isArray(reportsData) ? reportsData : []);
      } catch (e) {
        console.error('Failed to load reports', e);
      }
    })();
  }, []);
  
  const totalValue = (products || []).reduce((sum, product) => sum + (product.quantity * product.price), 0);
  const avgProductValue = products.length ? totalValue / products.length : 0;
  
  const categoryValue = (products || []).reduce((acc, product) => {
    const value = product.quantity * product.price;
    acc[product.category] = (acc[product.category] || 0) + value;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryValue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const supplierValue = (products || []).reduce((acc, product) => {
    const value = product.quantity * product.price;
    acc[product.supplier] = (acc[product.supplier] || 0) + value;
    return acc;
  }, {});

  const topSuppliers = Object.entries(supplierValue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate stock turnover from reports
  const calculateStockTurnover = () => {
    if (!reports || reports.length < 2) {
      return { rate: 0, hasData: false };
    }
    
    // Sort reports by date (newest first)
    const sortedReports = [...reports].sort((a, b) => {
      const dateA = new Date(b.endDate || b.createdAt || 0);
      const dateB = new Date(a.endDate || a.createdAt || 0);
      return dateA - dateB;
    });
    
    // Calculate average inventory value over all reports
    const avgInventoryValue = sortedReports.reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0) / sortedReports.length;
    
    if (avgInventoryValue === 0) {
      return { rate: 0, hasData: false };
    }
    
    // Use current inventory value as proxy for activity
    const currentValue = totalValue;
    
    // Calculate turnover: how many times inventory value cycles
    // Using: (Current Value / Average Historical Value) * Number of Reports
    const turnoverRate = (currentValue / avgInventoryValue) * (sortedReports.length / 12); // Normalized to annual
    
    return { rate: turnoverRate.toFixed(1), hasData: true };
  };

  const stockTurnover = calculateStockTurnover();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Insights and trends for your inventory</p>
      </div>
      {loading && (
        <Card className="mb-6"><CardContent className="pt-6">Loading analytics...</CardContent></Card>
      )}
      {!!error && (
        <Card className="mb-6"><CardContent className="pt-6 text-red-600">{error}</CardContent></Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">₱{totalValue.toLocaleString()}</div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">+15.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Avg Product Value</CardTitle>
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">₱{avgProductValue.toFixed(2)}</div>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Per product</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Categories</CardTitle>
            <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">{Object.keys(categoryValue).length}</div>
            <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">Product categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Stock Turnover</CardTitle>
            <Activity className="w-4 h-4 text-orange-600 dark:text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">
              {stockTurnover.hasData ? `${stockTurnover.rate}x` : 'N/A'}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
              {stockTurnover.hasData ? 'Annual rate' : 'Need 2+ reports'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {topCategories.map(([category, value], index) => {
                const percentage = totalValue ? (value / totalValue) * 100 : 0;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs dark:text-gray-200">
                          {index + 1}
                        </span>
                      <span className="text-sm dark:text-gray-200">{category}</span>
                    </div>
                    <span className="text-sm text-gray-900 dark:text-gray-100">₱{value.toLocaleString()}</span>
                  </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Suppliers by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSuppliers.map(([supplier, value], index) => {
                const percentage = totalValue ? (value / totalValue) * 100 : 0;
                return (
                  <div key={supplier}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs dark:text-gray-200">
                          {index + 1}
                        </span>
                        <span className="text-sm dark:text-gray-200">{supplier}</span>
                      </div>
                      <span className="text-sm dark:text-gray-200">₱{value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stock Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["in-stock", "low-stock", "out-of-stock"].map((status) => {
                const count = (products || []).filter(product => product.status === status).length;
                const percentage = products.length ? (count / products.length) * 100 : 0;
                const colors = {
                  "in-stock": "bg-green-600",
                  "low-stock": "bg-orange-500",
                  "out-of-stock": "bg-red-600"
                };
                const labels = {
                  "in-stock": "In Stock",
                  "low-stock": "Low Stock",
                  "out-of-stock": "Out of Stock"
                };
                
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{labels[status]}</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{count} products ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${colors[status]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Price Range Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Price Range Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {[
                { label: "Under ₱1,000", min: 0, max: 1000 },
                { label: "₱1,000 - ₱2,500", min: 1000, max: 2500 },
                { label: "₱2,500 - ₱5,000", min: 2500, max: 5000 },
                { label: "₱5,000+", min: 5000, max: Infinity }
              ].map((range) => {
                const count = (products || []).filter(product => product.price >= range.min && product.price < range.max).length;
                const percentage = products.length ? (count / products.length) * 100 : 0;
                
                return (
                  <div key={range.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{range.label}</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{count} products</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
