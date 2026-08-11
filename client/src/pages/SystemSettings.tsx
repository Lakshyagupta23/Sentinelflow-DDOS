import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Lock, Database, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SystemSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    // General Settings
    platformName: "SentinelFlow",
    maintenanceMode: false,
    enableAutoBackup: true,
    backupFrequency: "daily",

    // Alert Settings
    enableEmailAlerts: true,
    enableSlackAlerts: true,
    enableWebhookAlerts: true,
    alertRetentionDays: 90,

    // Security Settings
    sessionTimeoutMinutes: 30,
    enableMFA: true,
    passwordMinLength: 12,
    enforcePasswordHistory: true,

    // Database Settings
    maxConnections: 100,
    queryTimeoutSeconds: 30,
    enableQueryLogging: false,

    // API Settings
    rateLimit: 1000,
    rateLimitWindow: "hour",
    enableApiLogging: true,
  });

  // Only admins can access system settings
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>Only administrators can access system settings.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8" />
            System Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure platform-wide settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic platform settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Platform Name</Label>
                  <Input
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-600 mt-1">Disable user access during maintenance</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Auto Backup</Label>
                    <p className="text-sm text-gray-600 mt-1">Automatically backup database</p>
                  </div>
                  <Switch
                    checked={settings.enableAutoBackup}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableAutoBackup: checked })}
                  />
                </div>

                <div>
                  <Label>Backup Frequency</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alert Settings */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Configuration</CardTitle>
                <CardDescription>Manage alert delivery and retention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-gray-600 mt-1">Send alerts via email</p>
                  </div>
                  <Switch
                    checked={settings.enableEmailAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableEmailAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Slack Alerts</Label>
                    <p className="text-sm text-gray-600 mt-1">Send alerts to Slack channels</p>
                  </div>
                  <Switch
                    checked={settings.enableSlackAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableSlackAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Webhook Alerts</Label>
                    <p className="text-sm text-gray-600 mt-1">Send alerts to custom webhooks</p>
                  </div>
                  <Switch
                    checked={settings.enableWebhookAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableWebhookAlerts: checked })}
                  />
                </div>

                <div>
                  <Label>Alert Retention (Days)</Label>
                  <Input
                    type="number"
                    value={settings.alertRetentionDays}
                    onChange={(e) => setSettings({ ...settings, alertRetentionDays: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">Delete alerts older than this many days</p>
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  Save Alert Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security policies and requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Session Timeout (Minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Multi-Factor Authentication</Label>
                    <p className="text-sm text-gray-600 mt-1">Enforce MFA for all users</p>
                  </div>
                  <Switch
                    checked={settings.enableMFA}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableMFA: checked })}
                  />
                </div>

                <div>
                  <Label>Minimum Password Length</Label>
                  <Input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enforce Password History</Label>
                    <p className="text-sm text-gray-600 mt-1">Prevent reuse of recent passwords</p>
                  </div>
                  <Switch
                    checked={settings.enforcePasswordHistory}
                    onCheckedChange={(checked) => setSettings({ ...settings, enforcePasswordHistory: checked })}
                  />
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Configuration</CardTitle>
                <CardDescription>Manage database connection and query settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Maximum Connections</Label>
                  <Input
                    type="number"
                    value={settings.maxConnections}
                    onChange={(e) => setSettings({ ...settings, maxConnections: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Query Timeout (Seconds)</Label>
                  <Input
                    type="number"
                    value={settings.queryTimeoutSeconds}
                    onChange={(e) => setSettings({ ...settings, queryTimeoutSeconds: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Query Logging</Label>
                    <p className="text-sm text-gray-600 mt-1">Log all database queries for debugging</p>
                  </div>
                  <Switch
                    checked={settings.enableQueryLogging}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableQueryLogging: checked })}
                  />
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  Save Database Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Configure API rate limiting and logging</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Rate Limit (Requests)</Label>
                  <Input
                    type="number"
                    value={settings.rateLimit}
                    onChange={(e) => setSettings({ ...settings, rateLimit: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Rate Limit Window</Label>
                  <Select value={settings.rateLimitWindow} onValueChange={(value) => setSettings({ ...settings, rateLimitWindow: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minute">Per Minute</SelectItem>
                      <SelectItem value="hour">Per Hour</SelectItem>
                      <SelectItem value="day">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable API Logging</Label>
                    <p className="text-sm text-gray-600 mt-1">Log all API requests and responses</p>
                  </div>
                  <Switch
                    checked={settings.enableApiLogging}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableApiLogging: checked })}
                  />
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  Save API Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
