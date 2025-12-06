import { useEffect, useState } from "react";
import { TrendingUp, BarChart3, PieChart, Activity, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { getReports } from "../lib/api";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export function AnalyticsView(props) {
  const { products: initialProducts } = props || {};
  const [products, setProducts] = useState(initialProducts || []);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState("");

  useEffect(() => {
    setProducts(initialProducts || []);
    if (initialProducts) {
      setLoading(false);
    }
  }, [initialProducts]);

  useEffect(() => {
    // Fetch reports for stock turnover calculation
    (async () => {
      try {
        const reportsData = await getReports();
        setReports(Array.isArray(reportsData) ? reportsData : []);
      } catch (e) {
        console.error('Failed to load reports', e);
        setError('Failed to load reports');
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

  const handleExport = () => {
    // Calculate stock status distribution
    const stockStatus = {
      inStock: (products || []).filter(p => p.status === "in-stock").length,
      lowStock: (products || []).filter(p => p.status === "low-stock").length,
      outOfStock: (products || []).filter(p => p.status === "out-of-stock").length
    };
    
    // Calculate price range distribution
    const priceRanges = [
      { label: "Under ₱1,000", min: 0, max: 1000 },
      { label: "₱1,000 - ₱2,500", min: 1000, max: 2500 },
      { label: "₱2,500 - ₱5,000", min: 2500, max: 5000 },
      { label: "₱5,000+", min: 5000, max: Infinity }
    ];
    
    const priceDistribution = priceRanges.map(range => ({
      label: range.label,
      count: (products || []).filter(p => p.price >= range.min && p.price < range.max).length
    }));

    // Summary Stats
    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = [
      ['Total Inventory Value', `₱${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Average Product Value', `₱${avgProductValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Total Categories', Object.keys(categoryValue).length],
      ['Stock Turnover Rate', stockTurnover.hasData ? `${stockTurnover.rate}x` : 'N/A']
    ];

    // Top Categories
    const categoryHeaders = ['Category', 'Total Value'];
    const categoryRows = topCategories.map(([cat, val]) => [cat, `₱${val.toFixed(2)}`]);

    // Top Suppliers
    const supplierHeaders = ['Supplier', 'Total Value'];
    const supplierRows = topSuppliers.map(([sup, val]) => [sup, `₱${val.toFixed(2)}`]);

    // Stock Status Distribution
    const statusHeaders = ['Status', 'Product Count', 'Percentage'];
    const statusRows = [
      ['In Stock', stockStatus.inStock, `${products.length ? ((stockStatus.inStock / products.length) * 100).toFixed(1) : 0}%`],
      ['Low Stock', stockStatus.lowStock, `${products.length ? ((stockStatus.lowStock / products.length) * 100).toFixed(1) : 0}%`],
      ['Out of Stock', stockStatus.outOfStock, `${products.length ? ((stockStatus.outOfStock / products.length) * 100).toFixed(1) : 0}%`]
    ];

    // Price Range Analysis
    const priceHeaders = ['Price Range', 'Product Count'];
    const priceRows = priceDistribution.map(range => [range.label, range.count]);

    // Combine all sections
    const csvContent = [
      '=== ANALYTICS SUMMARY ===',
      summaryHeaders.join(','),
      ...summaryRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== TOP CATEGORIES BY VALUE ===',
      categoryHeaders.join(','),
      ...categoryRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== TOP SUPPLIERS BY VALUE ===',
      supplierHeaders.join(','),
      ...supplierRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== STOCK STATUS DISTRIBUTION ===',
      statusHeaders.join(','),
      ...statusRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '=== PRICE RANGE ANALYSIS ===',
      priceHeaders.join(','),
      ...priceRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); 
  };

  // Chart data for Top Categories
  const categoriesChartData = {
    labels: topCategories.map(([category]) => category),
    datasets: [{
      label: 'Value (₱)',
      data: topCategories.map(([, value]) => value),
      backgroundColor: [
        'rgba(59, 130, 246, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(139, 92, 246, 0.7)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
      ],
      borderWidth: 2,
    }],
  };

  // Chart data for Top Suppliers
  const supplierColors = [
    { bg: 'rgba(16, 185, 129, 0.7)', border: 'rgba(16, 185, 129, 1)' },
    { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgba(59, 130, 246, 1)' },
    { bg: 'rgba(245, 158, 11, 0.7)', border: 'rgba(245, 158, 11, 1)' },
    { bg: 'rgba(239, 68, 68, 0.7)', border: 'rgba(239, 68, 68, 1)' },
    { bg: 'rgba(139, 92, 246, 0.7)', border: 'rgba(139, 92, 246, 1)' },
  ];

  const suppliersChartData = {
    labels: ['Suppliers'],
    datasets: topSuppliers.map(([supplier, value], index) => ({
      label: supplier,
      data: [value],
      backgroundColor: supplierColors[index]?.bg || supplierColors[0].bg,
      borderColor: supplierColors[index]?.border || supplierColors[0].border,
      borderWidth: 2,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200,
      easing: 'easeInOutQuart',
      delay: (context) => {
        // Stagger pie slice animation by index
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 120;
        }
        return delay;
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgb(107, 114, 128)',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ₱' + context.parsed.toLocaleString();
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
      delay: (context) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          // Stagger bars per dataset to ensure visible animation
          const di = typeof context.datasetIndex === 'number' ? context.datasetIndex : 0;
          delay = di * 150;
        }
        return delay;
      }
    },
    animations: {
      y: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgb(107, 114, 128)',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ₱' + context.parsed.y.toLocaleString();
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgb(107, 114, 128)',
          callback: function(value) {
            return '₱' + value.toLocaleString();
          }
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'rgb(107, 114, 128)'
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.1)'
        }
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Insights and trends for your inventory</p>
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
      {loading && (
        <Card className="mb-6"><CardContent className="pt-6">Loading analytics...</CardContent></Card>
      )}
      {!!error && (
        <Card className="mb-6"><CardContent className="pt-6 text-red-600">{error}</CardContent></Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-gray-900 dark:text-gray-100">₱{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">+15.2% from last month</p>
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
            <div className="flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                <Pie data={categoriesChartData} options={chartOptions} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Suppliers by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-4" style={{ height: '400px' }}>
              <div className="w-full h-full">
                <Bar data={suppliersChartData} options={barChartOptions} />
              </div>
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
