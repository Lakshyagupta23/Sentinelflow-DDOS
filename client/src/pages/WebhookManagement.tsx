import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, Plus, Download, Copy } from "lucide-react";
import { useBulkActions } from "@/hooks/useBulkActions";
import { useToast } from "@/hooks/useToast";
import { exportToCSV, exportToJSON } from "@/lib/export";

export function WebhookManagement() {
  const [organizationId] = useState(1);
  const { success, error } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    secret: "",
    events: [] as string[],
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
  });

  const { data: webhooks, isLoading, refetch } = trpc.webhooks.list.useQuery(
    { organizationId },
    { enabled: organizationId > 0 }
  );

  const registerMutation = trpc.webhooks.register.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setFormData({
        url: "",
        secret: "",
        events: [],
        maxRetries: 3,
        retryDelayMs: 1000,
        backoffMultiplier: 2,
      });
      success("Webhook registered successfully");
    },
    onError: () => {
      error("Failed to register webhook");
    },
  });

  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      refetch();
      success("Webhook deleted successfully");
    },
    onError: () => {
      error("Failed to delete webhook");
    },
  });

  const bulkActions = useBulkActions(webhooks || []);

  const handleExportCSV = () => {
    if (!webhooks || webhooks.length === 0) {
      error("No webhooks to export");
      return;
    }
    const data = webhooks.map((w) => ({
      url: w.url,
      status: w.isActive ? "Active" : "Inactive",
      events: w.events.join(", "),
      maxRetries: w.retryPolicy.maxRetries,
      retryDelayMs: w.retryPolicy.retryDelayMs,
    }));
    exportToCSV(data, "webhooks");
    success("Webhooks exported as CSV");
  };

  const handleExportJSON = () => {
    if (!webhooks || webhooks.length === 0) {
      error("No webhooks to export");
      return;
    }
    exportToJSON(webhooks, "webhooks");
    success("Webhooks exported as JSON");
  };

  const handleRegister = async () => {
    if (!formData.url || !formData.secret) {
      error("URL and secret are required");
      return;
    }
    try {
      await registerMutation.mutateAsync({
        organizationId,
        url: formData.url,
        secret: formData.secret,
        events: formData.events.length > 0 ? formData.events : ["attack_detected", "alert_triggered"],
        retryPolicy: {
          maxRetries: formData.maxRetries,
          retryDelayMs: formData.retryDelayMs,
          backoffMultiplier: formData.backoffMultiplier,
        },
      });
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure webhooks to receive real-time notifications of security events
          </p>
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
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Register Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Webhook</DialogTitle>
                <DialogDescription>
                  Add a new webhook endpoint to receive security event notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Secret Key</Label>
                  <Input
                    type="password"
                    placeholder="Your webhook secret"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.maxRetries}
                    onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) })}
                  />
                </div>
                <Button onClick={handleRegister} disabled={registerMutation.isPending} className="w-full">
                  {registerMutation.isPending ? <Spinner /> : "Register Webhook"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : !webhooks || webhooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <p>No webhooks configured. Create one to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {webhooks && webhooks.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                {bulkActions.selectedCount} of {webhooks.length} selected
              </span>
              {bulkActions.hasSelection && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      bulkActions.getSelectedItems().forEach((w) => {
                        deleteMutation.mutate({ webhookId: w.webhookId });
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
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.webhookId} className={bulkActions.isSelected(webhook.webhookId) ? "border-accent" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={bulkActions.isSelected(webhook.webhookId)}
                        onChange={() => bulkActions.toggleSelect(webhook.webhookId)}
                        className="mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-base">{webhook.url}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          ID: {webhook.webhookId}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={webhook.isActive ? "default" : "secondary"}>
                      {webhook.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Events:</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Max Retries</p>
                        <p className="font-medium">{webhook.retryPolicy.maxRetries}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retry Delay</p>
                        <p className="font-medium">{webhook.retryPolicy.retryDelayMs}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Backoff</p>
                        <p className="font-medium">{webhook.retryPolicy.backoffMultiplier}x</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(webhook.url);
                          success("Webhook URL copied");
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate({ webhookId: webhook.webhookId })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
