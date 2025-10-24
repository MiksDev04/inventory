import { useState } from "react";
import LoginPage from "./components/LoginPage";
import { ThemeProvider } from "./components/ThemeProvider";
import { Sidebar } from "./components/SIdebar";
import Dashboard from "./components/DashboardView";
import { InventoryDashboard } from "./components/InventoryDashboard";
import { CategoriesView } from "./components/CategoriesView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SuppliersView } from "./components/SuppliersView";
import { SettingsView } from "./components/SettingsView";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [loggedIn, setLoggedIn] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "inventory":
        return <InventoryDashboard />;
      case "categories":
        return <CategoriesView />;
      case "analytics":
        return <AnalyticsView />;
      case "suppliers":
        return <SuppliersView items={[]} />;
      case "settings":
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentView("dashboard");
    // Clear any user data from localStorage if needed
    localStorage.removeItem("userToken");
  };

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-[#0d1117]">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          logout={handleLogout}
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
