import { useState } from "react";
import { Settings, Bell, Lock, User, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";

export function SettingsView() {
  const [profile, setProfile] = useState({
    firstName: "Justin",
    lastName: "Bautista",
    email: "justin.bautista@example.com",
    phone: "+1 (555) 123-4567"
  });

  const [notifications, setNotifications] = useState({
    lowStock: true,
    outOfStock: true
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [system, setSystem] = useState({
    autoBackup: true,
    lowStockThreshold: 20,
    currency: "PHP (₱)"
  });

  const [message, setMessage] = useState("");

  const handleProfileSave = () => {
    // Save profile to localStorage or API
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setMessage("Profile updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handlePasswordUpdate = () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      setMessage("Please fill in all password fields!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      setMessage("New passwords do not match!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (security.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    // Update password logic here
    setMessage("Password updated successfully!");
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSystemSave = () => {
    localStorage.setItem("systemSettings", JSON.stringify(system));
    setMessage("System settings updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application settings and preferences</p>
      </div>

      {message && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <Button onClick={handleProfileSave}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-gray-100">Low Stock Alerts</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when items are running low</p>
              </div>
              <Switch 
                checked={notifications.lowStock}
                onCheckedChange={(checked) => {
                  const newNotifications = { ...notifications, lowStock: checked };
                  setNotifications(newNotifications);
                  localStorage.setItem("notificationSettings", JSON.stringify(newNotifications));
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-gray-100">Out of Stock Alerts</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when items are out of stock</p>
              </div>
              <Switch 
                checked={notifications.outOfStock}
                onCheckedChange={(checked) => {
                  const newNotifications = { ...notifications, outOfStock: checked };
                  setNotifications(newNotifications);
                  localStorage.setItem("notificationSettings", JSON.stringify(newNotifications));
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password"
                value={security.currentPassword}
                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password"
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={security.confirmPassword}
                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
              />
            </div>
            <Button onClick={handlePasswordUpdate}>Update Password</Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              System Settings
            </CardTitle>
            <CardDescription>Configure system-wide settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-gray-100">Auto-backup</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Automatically backup inventory data daily</p>
              </div>
              <Switch 
                checked={system.autoBackup}
                onCheckedChange={(checked) => setSystem({ ...system, autoBackup: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-900 dark:text-gray-100">Low Stock Threshold</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Default minimum quantity alert level</p>
              </div>
              <Input 
                type="number" 
                value={system.lowStockThreshold}
                onChange={(e) => setSystem({ ...system, lowStockThreshold: parseInt(e.target.value) || 0 })}
                className="w-20" 
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input 
                id="currency" 
                value={system.currency}
                onChange={(e) => setSystem({ ...system, currency: e.target.value })}
              />
            </div>
            <Button onClick={handleSystemSave}>Save System Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
