import { useState, useEffect, useRef } from "react";
import { Package, LayoutDashboard, Settings, Users, TrendingUp, BarChart, Bell, Moon, Sun, GripVertical, FolderOpen, LogOut } from "lucide-react";
import { cn } from "./ui/utils";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import NotificationModal from "./NotificationModal";
import { getUnreadCount } from "../lib/api";
import { useProfile } from '../hooks/useProfile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

const menuProducts = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "categories", label: "Categories", icon: FolderOpen },
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
  const [displayName, setDisplayName] = useState('');
  const [displayRole, setDisplayRole] = useState('');
  const [initials, setInitials] = useState('');
  const { profile } = useProfile();
  const sidebarRef = useRef(null);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { count } = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // derive display fields from shared profile context
  useEffect(() => {
    if (!profile) return;
    const p = profile;
    let name = '';
    if (p.full_name !== undefined) name = p.full_name || p.username || '';
    else name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.username || '';
    setDisplayName(name || '');
    const roleLabel = p.role === 'admin' ? 'Administrator' : (p.role || 'User');
    setDisplayRole(roleLabel);
    const parts = name.split(/\s+/).filter(Boolean);
    const init = parts.length === 0 ? (p.username ? p.username.slice(0, 2).toUpperCase() : '') : (parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase());
    setInitials(init);
  }, [profile]);

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

  return (
    <div
      ref={sidebarRef}
      className="bg-gray-900 dark:bg-gray-950 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-gray-800 dark:border-gray-800"
      style={{ width: `${width}px` }}
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
          {menuProducts.map((product) => {
            const Icon = product.icon;
            const isActive = currentView === product.id;

            return (
              <button
                key={product.id}
                onClick={() => onNavigate(product.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white dark:hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{product.label}</span>
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
            className="w-full items-center justify-center gap-3 bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-800 !text-gray-200 dark:!text-white hover:bg-gray-700 dark:hover:bg-gray-800 hover:!text-white"
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
            <span>{initials || 'JB'}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-100 dark:text-gray-200">{displayName || 'Justin Bautista'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{displayRole || 'Administrator'}</p>
          </div>
          <div>
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
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
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

      {/* Logout Confirmation Modal */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={logout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-blue-500" />
        </div>
      </div>
    </div>
  );
}
