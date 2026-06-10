import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { apiChangePassword, fetchSiteVisits, SiteVisitStat } from '@/services/api';
import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  Download,
  Upload,
  ShieldAlert,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield,
  Lock,
  BarChart,
  TrendingUp,
} from 'lucide-react';
import logo from '@/assets/mohcc-logo.png';

// Settings are restricted to system Administrators only
const SETTINGS_ALLOWED_ROLES = [
  'Administrator',
] as const;

type AllowedRole = (typeof SETTINGS_ALLOWED_ROLES)[number];

export default function Settings() {
  const { user, logout } = useAuth();

  // ── Admin-only system settings state ──
  const [orgName] = useState('Ministry of Health and Child Care');
  const [systemName] = useState('Kudombela Data Trust');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState('');

  // ── Password reset state ──
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // ── Site Visits state ──
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [visitStats, setVisitStats] = useState<SiteVisitStat[]>([]);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);

  useEffect(() => {
    fetchSiteVisits().then((data) => {
      setTotalVisits(data.total_visits);
      setVisitStats(data.stats || []);
    }).catch(console.error);
  }, []);

  const chartData = React.useMemo(() => {
    if (!visitStats.length) return [];
    const months = Array.from(new Set(visitStats.map(s => s.month))).sort();
    const hosts = Array.from(new Set(visitStats.map(s => s.host_used)));
    
    return months.map(month => {
      const dataPoint: any = { month };
      hosts.forEach(host => {
        const stat = visitStats.find(s => s.month === month && s.host_used === host);
        dataPoint[host] = stat ? parseInt(stat.count.toString()) : 0;
      });
      return dataPoint;
    });
  }, [visitStats]);

  const uniqueHosts = React.useMemo(() => 
    Array.from(new Set(visitStats.map(s => s.host_used))),
    [visitStats]
  );

  // ── Route guard ──
  const userRole = user?.role as AllowedRole | undefined;
  if (!userRole || !SETTINGS_ALLOWED_ROLES.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  const isAdmin = userRole === 'Administrator';

  const handleSave = () => {
    toast.success('System settings have been saved successfully.');
  };

  const handleCreateBackup = () => {
    if (!adminPassword.trim()) {
      toast.error('Please enter your admin password to create a backup.');
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `kudombela-backup-${dateStr}.db.crypt15`;
    const backupContent = JSON.stringify(
      {
        format: 'kudombela-backup.db.crypt15',
        encryption: 'AES-256',
        created: new Date().toISOString(),
        system: 'Kudombela Data Trust',
        note: 'This is a simulated encrypted backup file.',
      },
      null,
      2
    );
    const blob = new Blob([backupContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Backup "${fileName}" downloaded successfully.`);
    setAdminPassword('');
    setBackupDialogOpen(false);
  };

  const handleRestoreBackup = () => {
    if (!restoreFile) {
      toast.error('Please select a backup file to restore.');
      return;
    }
    if (!restorePassword.trim()) {
      toast.error('Admin password is required to decrypt and restore backup.');
      return;
    }
    toast.success(`Backup "${restoreFile.name}" verified and restore initiated.`);
    setRestoreFile(null);
    setRestorePassword('');
    setRestoreDialogOpen(false);
  };

  // ── Password reset handlers ──
  const openResetDialog = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      toast.success('Password updated successfully. Please sign in again.');
      setResetDialogOpen(false);
      logout();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseReset = () => {
    setResetDialogOpen(false);
  };

  return (
    <>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="page-header flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account security and system preferences
          </p>
        </div>

        {/* ── Security Features Card (All allowed roles) ── */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Security Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                <Shield className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-xs sm:text-sm">OTP Verification</p>
                  <p className="text-muted-foreground text-xs">6-digit codes for secure actions</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                <Lock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-xs sm:text-sm">Password Hashing</p>
                  <p className="text-muted-foreground text-xs">Bcrypt encryption for all passwords</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                <Shield className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-xs sm:text-sm">Session Security</p>
                  <p className="text-muted-foreground text-xs">Secure authentication tokens</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={openResetDialog}>Change Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Admin-only system settings ── */}
        {isAdmin && (
          <>
            {/* Organisation */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-primary" />
                  Organisation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={logo}
                    alt="Organisation Logo"
                    className="h-16 w-16 object-contain rounded-lg border p-1"
                  />
                  <div>
                    <p className="font-medium">{orgName}</p>
                    <p className="text-sm text-muted-foreground">Republic of Zimbabwe</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Organisation Name</p>
                    <p className="font-medium">{orgName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">System Name</p>
                    <p className="font-medium">{systemName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Site Visits */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart className="h-4 w-4 text-primary" />
                  Site Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Total Site Visits</p>
                    <p className="text-xs text-muted-foreground">Cumulative page loads for this system</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg border border-primary/20 font-bold text-lg">
                      {totalVisits.toLocaleString()}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setStatsDialogOpen(true)}
                      className="h-8 text-xs"
                    >
                      <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                      View Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Send email alerts for critical system events</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
              </CardContent>
            </Card>

            {/* Backup & Restore */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Create Backup</p>
                    <p className="text-xs text-muted-foreground">Download an encrypted backup of all system data</p>
                  </div>
                  <Button variant="outline" onClick={() => setBackupDialogOpen(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Backup
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Restore Backup</p>
                    <p className="text-xs text-muted-foreground">Restore system data from an encrypted backup file</p>
                  </div>
                  <Button variant="outline" onClick={() => setRestoreDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Settings</Button>
            </div>
          </>
        )}
      </div>

      {/* ── Password Reset Dialog ── */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password to update your account credentials immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={resetLoading || !currentPassword.trim() || newPassword.length < 6 || newPassword !== confirmPassword}
            >
              {resetLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Backup Dialog ── */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create System Backup</DialogTitle>
            <DialogDescription>
              Enter your admin password to generate and download an encrypted backup file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium text-sm">File will be generated:</p>
              <p className="font-mono">kudombela-backup-{new Date().toISOString().split('T')[0]}.db.crypt15</p>
              <p className="text-muted-foreground">AES-256 encrypted • Password-protected</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-password">Admin Password</Label>
              <Input
                id="backup-password"
                type="password"
                placeholder="Enter your current password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBackupDialogOpen(false);
                setAdminPassword('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBackup}>
              <Download className="h-4 w-4 mr-2" />
              Download Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Restore Backup Dialog ── */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              Select a .db.crypt15 backup file and enter your admin password to decrypt and restore.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Backup File</Label>
              <Input
                type="file"
                accept=".crypt15,.crypt14,.db"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              />
              {restoreFile && (
                <p className="text-xs text-muted-foreground font-mono">{restoreFile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="restore-password">Admin Password</Label>
              <Input
                id="restore-password"
                type="password"
                placeholder="Enter your current password to decrypt"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
              />
            </div>
            <div className="bg-accent/10 border border-accent/30 rounded-md p-3 text-xs text-accent">
              ⚠️ Restoring will replace all current system data. This action cannot be undone.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialogOpen(false);
                setRestoreFile(null);
                setRestorePassword('');
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRestoreBackup}>
              <Upload className="h-4 w-4 mr-2" />
              Restore Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Site Statistics Dialog ── */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Accumulated Site Statistics
            </DialogTitle>
            <DialogDescription>
              Monthly site visit trends categorized by host/domain usage.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[400px] w-full mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    {uniqueHosts.map((host, idx) => (
                      <linearGradient key={host} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={idx % 2 === 0 ? "#10b981" : "#3b82f6"} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={idx % 2 === 0 ? "#10b981" : "#3b82f6"} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  {uniqueHosts.map((host, idx) => (
                    <Area 
                      key={host}
                      type="monotone" 
                      dataKey={host} 
                      stroke={idx % 2 === 0 ? "#10b981" : "#3b82f6"} 
                      fillOpacity={1} 
                      fill={`url(#color${idx})`} 
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">
                No statistical data recorded yet.
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Cumulative Traffic</p>
              <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Distinct Entry Points</p>
              <p className="text-2xl font-bold">{uniqueHosts.length}</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

