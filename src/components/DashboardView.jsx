import { Package, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { PesoIcon } from "./icons/PesoIcon";

export default function Dashboard() {
  // Sample data - replace with your actual data source
  const items = [
    {
      id: 1,
      name: "Monitor 27 Inch",
      sku: "MON-27-001",
      quantity: 55,
      price: 17454.33,
      category: "Electronics",
      status: "in-stock",
      lastUpdated: "2025-10-13"
    },
    {
      id: 2,
      name: "Mechanical Keyboard",
      sku: "KEY-MECH-002",
      quantity: 89,
      price: 788.68,
      category: "Electronics",
      status: "in-stock",
      lastUpdated: "2025-10-14"
    },
    {
      id: 3,
      name: "Office Chair",
      sku: "CHR-OFF-003",
      quantity: 33,
      price: 1515.08,
      category: "Furniture",
      status: "in-stock",
      lastUpdated: "2025-10-14"
    },
    {
      id: 4,
      name: "Wireless Mouse",
      sku: "MOU-WRL-004",
      quantity: 126,
      price: 346.71,
      category: "Electronics",
      status: "low-stock",
      lastUpdated: "2025-10-14"
    },
    {
      id: 5,
      name: "Notebook Set",
      sku: "NOT-SET-005",
      quantity: 200,
      price: 99.90,
      category: "Stationery",
      status: "in-stock",
      lastUpdated: "2025-10-12"
    },
    {
      id: 6,
      name: "USB-C Cable",
      sku: "CAB-USC-006",
      quantity: 15,
      price: 250.00,
      category: "Accessories",
      status: "low-stock",
      lastUpdated: "2025-10-13"
    },
    {
      id: 7,
      name: "Desk Lamp",
      sku: "LMP-DSK-007",
      quantity: 0,
      price: 899.99,
      category: "Furniture",
      status: "out-of-stock",
      lastUpdated: "2025-10-11"
    }
  ];

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = items.filter(item => item.status === "low-stock").length;
  const outOfStockCount = items.filter(item => item.status === "out-of-stock").length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  const categoryBreakdown = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.quantity;
    return acc;
  }, {});

  const recentlyUpdated = [...items]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5);

  const topValueItems = [...items]
    .sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price))
    .slice(0, 5);

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-[#0d1117]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your inventory.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Items</CardTitle>
              <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems.toLocaleString()}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Across {items.length} products
              </p>
              <Progress value={75} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Value</CardTitle>
              <PesoIcon className="w-4 h-4 text-green-600 dark:text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">₱{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                +12.5% from last month
              </p>
              <Progress value={85} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Low Stock Items</CardTitle>
              <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockCount}</div>
              <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                Needs attention
              </p>
              <Progress value={40} className="mt-3 h-2 [&>div]:bg-orange-500" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Out of Stock</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{outOfStockCount}</div>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                Immediate action required
              </p>
              <Progress value={60} className="mt-3 h-2 [&>div]:bg-red-500" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryBreakdown).map(([category, count]) => {
                  const percentage = (count / totalItems) * 100;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{count} items</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Value Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Value Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topValueItems.map((item) => {
                  const itemValue = item.quantity * item.price;
                  return (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-200">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} units × ₱{item.price.toLocaleString()}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">₱{itemValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recently Updated */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              Recently Updated Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentlyUpdated.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-200 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-200">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900 dark:text-gray-200">{item.quantity} units</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.lastUpdated}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
