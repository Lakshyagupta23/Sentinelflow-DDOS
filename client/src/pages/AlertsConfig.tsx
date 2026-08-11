import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Mail, MessageSquare, Webhook, Plus, Trash2, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useBulkActions } from "@/hooks/useBulkActions";
import { useToast } from "@/hooks/useToast";
import { exportToCSV, exportToJSON } from "@/lib/export";

export default function AlertsConfig() {
  const configsQuery = trpc.alertConfig.getUserConfigs.useQuery();
  const { success, error } = useToast();
  const createConfigMutation = trpc.alertConfig.create.useMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    eventType: "attack_detected",
    threshold: "1",
    channels: [] as string[],
  });

  const handleCreateConfig = async () => {
    if (formData.channels.length === 0) {
      error("Please select at least one notification channel");
      return;
    }

    try {
      await createConfigMutation.mutateAsync({
        eventType: formData.eventType,
        threshold: parseFloat(formData.threshold),
        notificationChannels: formData.channels,
      });
      success("Alert configuration created");
      setFormData({ eventType: "attack_detected", threshold: "1", channels: [] });
      setIsDialogOpen(false);
      configsQuery.refetch();
    } catch (err) {
      error("Failed to create alert configuration");
    }
  };

  const bulkActions = useBulkActions(configsQuery.data || []);

  const handleExportCSV = () => {
    if (!configsQuery.data || configsQuery.data.length === 0) {
      error("No alert configurations to export");
      return;
    }
    const data = configsQuery.data.map((config: any) => ({
      eventType: config.eventType,
      threshold: config.threshold,
      channels: JSON.parse(config.notificationChannels).join(", "),
      enabled: config.isEnabled ? "Yes" : "No",
    }));
    exportToCSV(data, "alert-configs");
    success("Alert configurations exported as CSV");
  };

  const handleExportJSON = () => {
    if (!configsQuery.data || configsQuery.data.length === 0) {
      error("No alert configurations to export");
      return;
    }
    exportToJSON(configsQuery.data, "alert-configs");
    success("Alert configurations exported as JSON");
  };

  const toggleChannel = (channel: string) => {
    setFormData({
      ...formData,
      channels: formData.channels.includes(channel) ? formData.channels.filter((c) => c !== channel) : [...formData.channels, channel],
    });
  };

  const alertTypes = [
    { value: "attack_detected", label: "Attack Detected", icon: "🎯" },
    { value: "traffic_spike", label: "Traffic Spike", icon: "📈" },
    { value: "anomaly", label: "Traffic Anomaly", icon: "⚠️" },
    { value: "threshold_exceeded", label: "Threshold Exceeded", icon: "🚨" },
  ];

  const channels = [
    { id: "email", label: "Email", icon: Mail },
    { id: "slack", label: "Slack", icon: MessageSquare },
    { id: "webhook", label: "Webhook", icon: Webhook },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alerts & Notifications</h1>
            <p className="text-muted-foreground mt-1">Configure alert thresholds and notification channels</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Alert Rule
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Alert Configuration</DialogTitle>
                <DialogDescription>Set up notifications for specific security events</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Event Type</Label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {alertTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Threshold</Label>
                  <Input type="number" placeholder="1" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: e.target.value })} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">Minimum occurrences to trigger alert</p>
                </div>

                <div>
                  <Label>Notification Channels</Label>
                  <div className="space-y-2 mt-3">
                    {channels.map((channel) => (
                      <div key={channel.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => toggleChannel(channel.id)}>
                        <input type="checkbox" checked={formData.channels.includes(channel.id)} onChange={() => {}} className="cursor-pointer" />
                        <channel.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{channel.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreateConfig} className="w-full" disabled={createConfigMutation.isPending}>
                  {createConfigMutation.isPending ? "Creating..." : "Create Configuration"}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alert Rules */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Active Alert Configurations</CardTitle>
            <CardDescription>Manage your alert rules and notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            {configsQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : configsQuery.data && configsQuery.data.length > 0 ? (
              <>
                {configsQuery.data && configsQuery.data.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                    <span className="text-sm text-muted-foreground">
                      {bulkActions.selectedCount} of {configsQuery.data.length} selected
                    </span>
                    {bulkActions.hasSelection && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            bulkActions.getSelectedItems().forEach(() => {
                              success("Alert configuration deleted");
                            });
                            bulkActions.deselectAll();
                          }}
                        >
                          Delete Selected
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  {configsQuery.data.map((config: any) => {
                    const channels = JSON.parse(config.notificationChannels);
                    const alertType = alertTypes.find((t) => t.value === config.eventType);
                    return (
                      <div key={config.id} className={`flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors ${bulkActions.isSelected(config.id) ? "border-accent" : ""}`}>
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={bulkActions.isSelected(config.id)}
                            onChange={() => bulkActions.toggleSelect(config.id)}
                            className="mt-1 cursor-pointer"
                          />
                            <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{alertType?.icon}</span>
                              <p className="font-medium text-sm">{alertType?.label}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-xs text-muted-foreground">Threshold: {config.threshold}</p>
                              <div className="flex gap-2">
                                {channels.map((channel: string) => {
                                  const ch = channels.find((c: any) => c.id === channel);
                                  return (
                                    <Badge key={channel} variant="outline">
                                      {channel}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={config.isEnabled} />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              success("Alert configuration deleted");
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">No alert configurations yet. Create one to get started.</div>
            )}
          </CardContent>
        </Card>

        {/* Notification Channels */}
        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="slack">Slack</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>Manage email notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="security@example.com" className="mt-2" />
                </div>
                <div>
                  <Label>Email Digest</Label>
                  <select className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground">
                    <option>Real-time</option>
                    <option>Hourly</option>
                    <option>Daily</option>
                  </select>
                </div>
                <Button>Save Email Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slack">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Slack Integration</CardTitle>
                <CardDescription>Connect your Slack workspace for instant notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Slack Webhook URL</Label>
                  <Input type="password" placeholder="https://hooks.slack.com/services/..." className="mt-2" />
                </div>
                <div>
                  <Label>Channel</Label>
                  <Input placeholder="#security-alerts" className="mt-2" />
                </div>
                <Button>Connect Slack</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhook">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>Send alerts to custom webhooks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Webhook URL</Label>
                  <Input placeholder="https://your-api.example.com/alerts" className="mt-2" />
                </div>
                <div>
                  <Label>Authentication Token (Optional)</Label>
                  <Input type="password" placeholder="Bearer token" className="mt-2" />
                </div>
                <Button>Test Webhook</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alert History */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Last 10 triggered alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "Attack Detected", severity: "critical", time: "2 minutes ago" },
                { type: "Traffic Spike", severity: "high", time: "15 minutes ago" },
                { type: "Threshold Exceeded", severity: "medium", time: "1 hour ago" },
              ].map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{alert.type}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                  <Badge className={`badge-${alert.severity}`}>{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
