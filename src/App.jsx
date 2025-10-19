import { useState } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { Sidebar } from "./components/SIdebar";
import Dashboard from "./components/DashboardView";
import { InventoryDashboard } from "./components/InventoryDashboard";
import { CategoriesView } from "./components/CategoriesView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SuppliersView } from "./components/SuppliersView";
import { SettingsView } from "./components/SettingsView";
import { mockInventoryData } from "./data/mockInventoryData";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(240);

  // Use static mockInventoryData for CategoriesView
  const [inventoryItems] = useState(mockInventoryData);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "inventory":
        return <InventoryDashboard />;
      case "categories":
        return <CategoriesView items={inventoryItems} />;
      case "analytics":
        return <AnalyticsView items={inventoryItems} />;
      case "suppliers":
        return <SuppliersView items={inventoryItems} />;
      case "settings":
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-[#0d1117]">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
        />
        <main 
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0d1117]"
          style={{ marginLeft: `${sidebarWidth}px` }}
        >
          {renderView()}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
