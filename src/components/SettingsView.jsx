import { useEffect, useState, useRef } from "react";
import * as api from '../lib/api';
import { Settings, Bell, Lock, User, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";

export function SettingsView() {
  const [profile, setProfile] = useState({
    username: '',
    firstName: "",
    lastName: "",
    fullName: '',
    email: "",
    role: '',
    isActive: false,
    createdAt: null,
    updatedAt: null
  });
  const [schemaMode, setSchemaMode] = useState('split'); // 'split' or 'full'

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
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);
  // separate saving states so updating password doesn't block profile save UI
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordChangedOpen, setPasswordChangedOpen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const mountedRef = useRef(true);
  const [errors, setErrors] = useState({});

  const fetchProfile = async () => {
    try {
      setLoadError('');
      const p = await (await import('../lib/api')).getProfile();
      if (!mountedRef.current) return;
      // Adapt to DB schema: either full_name or split first/last
      if (p.full_name !== undefined) {
        setSchemaMode('full');
        setProfile(prev => ({ ...prev, username: p.username || '', fullName: p.full_name || '', email: p.email || '', role: p.role || '', isActive: !!p.isActive, createdAt: p.createdAt || null, updatedAt: p.updatedAt || null }));
      } else {
        setSchemaMode('split');
        setProfile(prev => ({ ...prev, username: p.username || '', firstName: p.firstName || '', lastName: p.lastName || '', email: p.email || '', role: p.role || '', isActive: !!p.isActive, createdAt: p.createdAt || null, updatedAt: p.updatedAt || null }));
      }
    } catch (e) {
      console.error('Failed to load profile', e);
      if (!mountedRef.current) return;
      setLoadError('Failed to load profile from server. Make sure backend is running and DB is initialized (run: node backend/src/scripts/dbSetup.js).');
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    return () => { mountedRef.current = false };
  }, []);

  function validateProfile() {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // no phone field in this schema
    const newErrors = {};
    if (schemaMode === 'split') {
      if (!profile.firstName) newErrors.firstName = 'First name is required';
      if (!profile.lastName) newErrors.lastName = 'Last name is required';
      if (!profile.username) newErrors.username = 'Username is required';
      else if (profile.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    } else {
      if (!profile.fullName) newErrors.fullName = 'Full name is required';
    }
    if (!profile.email) newErrors.email = 'Email is required';
    else if (!emailRe.test(profile.email)) newErrors.email = 'Please enter a valid email address';

    setErrors(newErrors);
    return { ok: Object.keys(newErrors).length === 0, errors: newErrors };
  }

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const api = await import('../lib/api');
      let payload;
      if (schemaMode === 'split') {
        payload = { username: profile.username, firstName: profile.firstName, lastName: profile.lastName, email: profile.email };
      } else {
        payload = { username: profile.username, full_name: profile.fullName, email: profile.email };
      }
      const updated = await api.updateProfile(payload);
      // update local state from server response to reflect DB
      if (updated.full_name !== undefined) {
        setSchemaMode('full');
        setProfile(prev => ({ ...prev, username: updated.username || prev.username, fullName: updated.full_name || prev.fullName, email: updated.email || prev.email, role: updated.role || prev.role, isActive: !!updated.isActive, createdAt: updated.createdAt || prev.createdAt, updatedAt: updated.updatedAt || prev.updatedAt }));
        // notify other parts of the app (e.g., sidebar) that profile changed
  try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: updated })); } catch { /* ignore in non-browser tests */ }
      } else {
        setSchemaMode('split');
        setProfile(prev => ({ ...prev, username: updated.username || prev.username, firstName: updated.firstName || prev.firstName, lastName: updated.lastName || prev.lastName, email: updated.email || prev.email, role: updated.role || prev.role, isActive: !!updated.isActive, createdAt: updated.createdAt || prev.createdAt, updatedAt: updated.updatedAt || prev.updatedAt }));
  try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: updated })); } catch { /* ignore in non-browser tests */ }
      }
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      console.error('Failed to save profile', e);
      // surface server validation messages (e.g., username_taken)
      const serverMsg = e?.response?.data?.error || e?.message || 'Failed to save profile';
      if (serverMsg === 'username_taken') setMessage('That username is already taken.');
      else setMessage(serverMsg);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  // validate and perform password update; returns true on success
  const handlePasswordUpdate = async () => {
    // Re-validate before performing the change
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      setMessage("Please fill in all password fields!");
      setTimeout(() => setMessage(""), 3000);
      return false;
    }
    if (security.newPassword !== security.confirmPassword) {
      setMessage("New passwords do not match!");
      setTimeout(() => setMessage(""), 3000);
      return false;
    }
    if (security.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters!");
      setTimeout(() => setMessage(""), 3000);
      return false;
    }

    try {
      console.log('Attempting password change for user');
      setSavingPassword(true);
      const res = await api.changePassword({ currentPassword: security.currentPassword, newPassword: security.newPassword });
      if (res && res.success) {
        // clear the password inputs as a visible indication
        setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setMessage("Password updated successfully!");
        // show a small success dialog as additional confirmation
        setPasswordChangedOpen(true);
        return true;
      } else {
        setMessage('Failed to update password');
        return false;
      }
    } catch (e) {
      console.error('Password update failed', e);
      const serverMsg = e?.response?.data?.error || e?.message || 'Failed to update password';
      if (serverMsg === 'incorrect_current_password') setMessage('Current password is incorrect');
      else if (serverMsg === 'new_password_too_short') setMessage('New password must be at least 6 characters');
      else setMessage(serverMsg);
      return false;
    } finally {
      setSavingPassword(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Note: confirmation modal is opened immediately; validation happens on confirm

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

      {/* top drop-down animated notification */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 flex justify-center z-50">
        <div className={`${message ? 'transform translate-y-0' : '-translate-y-20'} transition-transform duration-300 pointer-events-auto`}> 
          {message && (
            <div className="mb-0 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg shadow-md">
              {message}
            </div>
          )}
        </div>
      </div>

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
          <CardContent className="space-y-4 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => { setProfile({ ...profile, username: e.target.value }); setErrors(prev => ({ ...prev, username: undefined })); }}
                />
                {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
              </div>
              {schemaMode === 'split' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profile.firstName}
                      onChange={(e) => { setProfile({ ...profile, firstName: e.target.value }); setErrors(prev => ({ ...prev, firstName: undefined })); }}
                    />
                    {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profile.lastName}
                      onChange={(e) => { setProfile({ ...profile, lastName: e.target.value }); setErrors(prev => ({ ...prev, lastName: undefined })); }}
                    />
                    {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
                  </div>
                </>
              ) : (
                <div className="col-span-1 md:col-span-1 space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => { setProfile({ ...profile, fullName: e.target.value }); setErrors(prev => ({ ...prev, fullName: undefined })); }}
                  />
                  {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profile.email}
                onChange={(e) => { setProfile({ ...profile, email: e.target.value }); setErrors(prev => ({ ...prev, email: undefined })); }}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>
            {/* phone field removed — schema does not include phone in your user_accounts table */}
            <Button disabled={savingProfile} onClick={() => {
              const v = validateProfile();
              if (!v.ok) {
                setMessage(v.msg);
                setTimeout(() => setMessage(''), 3000);
                return;
              }
              setConfirmSaveOpen(true);
            }}>{savingProfile ? 'Saving...' : 'Save Changes'}</Button>
          </CardContent>
        </Card>

        {loadError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded flex items-center justify-between">
            <div>{loadError}</div>
            <div className="ml-4">
              <Button onClick={() => { setLoadError(''); fetchProfile(); }}>Retry</Button>
            </div>
          </div>
        )}

        <AlertDialog open={confirmSaveOpen} onOpenChange={(open) => setConfirmSaveOpen(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save changes?</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to save changes to your profile? This will update the database.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmSaveOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={savingProfile} onClick={async () => {
                try {
                  await handleProfileSave();
                } finally {
                  setConfirmSaveOpen(false);
                }
              }}>{savingProfile ? 'Saving...' : 'Save'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
            <Button disabled={savingPassword} onClick={() => { console.log('open confirm clicked'); setConfirmPasswordOpen(true); }}>{savingPassword ? 'Updating…' : 'Update Password'}</Button>

            {/* Confirmation modal (centered) for password change */}
            <AlertDialog open={confirmPasswordOpen} onOpenChange={(open) => setConfirmPasswordOpen(open)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change password?</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to change your password? This will immediately update your account credentials.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmPasswordOpen(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={savingPassword} onClick={async () => {
                    try {
                      const ok = await handlePasswordUpdate();
                      if (ok) {
                        setConfirmPasswordOpen(false);
                        setPasswordChangedOpen(true);
                      } else {
                        // keep the modal open so user can fix inputs; message shown by handler
                      }
                    } finally {
                      // no-op
                    }
                  }}>{savingPassword ? 'Updating…' : 'Change Password'}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* inline popover handles confirmation above the password section */}

        {/* Success dialog after password changed */}
        <AlertDialog open={passwordChangedOpen} onOpenChange={(open) => setPasswordChangedOpen(open)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Password changed</AlertDialogTitle>
              <AlertDialogDescription>Your password has been changed successfully.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setPasswordChangedOpen(false)}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
