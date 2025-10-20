import { useEffect, useState } from "react";
import { TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getItems } from "../lib/api";
export function AnalyticsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getItems();
        if (mounted) setItems(data);
      } catch (e) {
        if (mounted) setError("Failed to load analytics data");
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const avgItemValue = totalValue / items.length;
  
  const categoryValue = items.reduce((acc, item) => {
    const value = item.quantity * item.price;
    acc[item.category] = (acc[item.category] || 0) + value;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryValue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const supplierValue = items.reduce((acc, item) => {
    const value = item.quantity * item.price;
    acc[item.supplier] = (acc[item.supplier] || 0) + value;
    return acc;
  }, {});

  const topSuppliers = Object.entries(supplierValue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
            <CardTitle className="text-sm">Avg Item Value</CardTitle>
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">₱{avgItemValue.toFixed(2)}</div>
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
            <div className="text-2xl text-gray-900 dark:text-gray-100">3.2x</div>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">Annual rate</p>
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
                const percentage = (value / totalValue) * 100;
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
                const percentage = (value / totalValue) * 100;
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
                const count = items.filter(item => item.status === status).length;
                const percentage = (count / items.length) * 100;
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
                      <span className="text-sm text-gray-900 dark:text-gray-100">{count} items ({percentage.toFixed(1)}%)</span>
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
                const count = items.filter(item => item.price >= range.min && item.price < range.max).length;
                const percentage = (count / items.length) * 100;
                
                return (
                  <div key={range.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{range.label}</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{count} items</span>
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
