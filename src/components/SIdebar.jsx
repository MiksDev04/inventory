import { useState, useEffect, useRef } from "react";
import { Package, LayoutDashboard, Settings, Users, TrendingUp, BarChart, Bell, Moon, Sun, GripVertical, FolderOpen, LogOut, ArrowLeftRight, Menu, X } from "lucide-react";
import { cn } from "./ui/utils";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import NotificationModal from "./NotificationModal";
import * as fb from "../lib/firebaseClient";
import { getUnreadCount } from "../lib/api";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "categories", label: "Categories", icon: FolderOpen },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "reports", label: "Reports", icon: BarChart },
  { id: "suppliers", label: "Suppliers", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export function Sidebar({ currentView, onNavigate, width, onWidthChange, logout }) {
  const { theme, toggleTheme } = useTheme();
  const [isResizing, setIsResizing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Subscribe to notifications for real-time unread count updates
  useEffect(() => {
    const unsubscribe = fb.subscribeToNotifications((notifications) => {
      // Count unread notifications - check both field name variations
      const unread = notifications.filter(n => {
        const isRead = n.isRead || n.is_read || false;
        return !isRead;
      }).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };
  
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 dark:bg-gray-950 text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={cn(
          "bg-gray-900 dark:bg-gray-950 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-800 dark:border-gray-800 z-40 transition-all duration-300",
          // Mobile: slide in/out with fixed width
          "w-[280px] lg:w-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ width: window.innerWidth >= 1024 ? `${width}px` : undefined }}
      >
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-800 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="tracking-tight">InventoryPro</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Management System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                  isActive 
                    ? "bg-blue-600 dark:bg-blue-500 text-white" 
                    : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white dark:hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Theme Toggle */}
        <div className="mt-4 px-3">
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-3 bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-800 !text-gray-200 dark:!text-white hover:bg-gray-700 dark:hover:bg-gray-800 hover:!text-white"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </>
            )}
          </Button>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span>JB</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-100 dark:text-gray-200">Justin Bautista</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Administrator</p>
          </div>
          <button 
            className="relative text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-white"
            onClick={() => setShowNotifications(true)}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="ml-1 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-white bg-transparent border-none"
            style={{ minWidth: 0 }}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resize Handle - Hidden on mobile */}
      <div
        className="hidden lg:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors group"
        onMouseDown={handleMouseDown}
      />
      </div>

      {/* Notification Modal */}
      <NotificationModal 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          // Refresh unread count after closing modal
          getUnreadCount().then(({ count }) => setUnreadCount(count)).catch(console.error);
        }} 
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={logout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}