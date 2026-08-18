import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, Plus, Download, Copy, Link } from "lucide-react";
import { useBulkActions } from "@/hooks/useBulkActions";
import { useToast } from "@/hooks/useToast";
import { exportToCSV, exportToJSON } from "@/lib/export";
import DashboardLayout from "@/components/DashboardLayout";

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
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Webhook Dispatcher</h1>
              <p className="text-xs text-muted-foreground font-mono">Stream real-time security events directly to external callback endpoints</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-10 px-4">
                <Download className="w-3.5 h-3.5 mr-1" />
                CSV Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON} className="border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-10 px-4">
                <Download className="w-3.5 h-3.5 mr-1" />
                JSON Export
              </Button>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none px-5 h-10">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Register Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-md animate-fade-in">
                  <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                    <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">Register Callback hook</DialogTitle>
                    <DialogDescription className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                      Configure a new secure webhook target destination endpoint
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Target Endpoint URL</Label>
                      <Input
                        type="url"
                        placeholder="https://yourdomain.com/webhook"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">HMAC Sign Secret Key</Label>
                      <Input
                        type="password"
                        placeholder="Your webhook authentication secret key"
                        value={formData.secret}
                        onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                        className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Max Retry Limit</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.maxRetries}
                        onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) })}
                        className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                      />
                    </div>
                    <Button onClick={handleRegister} disabled={registerMutation.isPending} className="w-full bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none mt-2">
                      {registerMutation.isPending ? <Spinner /> : "Register Webhook"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : !webhooks || webhooks.length === 0 ? (
          <Card className="glass-card rounded-none border-[#c5a880]/15">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                <AlertCircle className="w-4 h-4 text-[#c5a880]" />
                <p>No webhooks configured. Create one to get started stream dispatch.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {webhooks && webhooks.length > 0 && (
              <div className="flex items-center justify-between p-3 border border-[#c5a880]/10 bg-[#13151a]/30 rounded-none font-mono text-xs text-muted-foreground">
                <span>
                  Selected: {bulkActions.selectedCount} of {webhooks.length} webhooks
                </span>
                {bulkActions.hasSelection && (
                  <Button
                    size="sm"
                    className="border border-[#e05a5a]/30 bg-transparent hover:bg-[#e05a5a]/5 text-[#e05a5a] rounded-none font-mono text-[9px] uppercase h-7 px-3"
                    onClick={() => {
                      bulkActions.getSelectedItems().forEach((w) => {
                        deleteMutation.mutate({ webhookId: w.webhookId });
                      });
                      bulkActions.deselectAll();
                    }}
                  >
                    Decommission Selected
                  </Button>
                )}
              </div>
            )}
            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.webhookId} className={`glass-card rounded-none border ${bulkActions.isSelected(webhook.webhookId) ? "border-[#c5a880]" : "border-[#c5a880]/15"}`}>
                  <CardHeader className="pb-3 border-b border-[#c5a880]/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={bulkActions.isSelected(webhook.webhookId)}
                          onChange={() => bulkActions.toggleSelect(webhook.webhookId)}
                          className="mt-1.5 cursor-pointer w-4 h-4 accent-[#c5a880] border-[#c5a880]/30 rounded-none bg-[#13151a]"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-sm font-serif uppercase tracking-wider text-[#e2e8f0] flex items-center gap-1.5">
                            <Link className="w-4 h-4 text-[#c5a880]" />
                            {webhook.url}
                          </CardTitle>
                          <CardDescription className="text-[10px] font-mono text-muted-foreground mt-1">
                            Dispatch Key: {webhook.webhookId}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">
                        {webhook.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 font-mono text-xs text-[#e2e8f0]">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase">Subscribed Broadcast Events</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-t border-[#c5a880]/10 pt-3">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Max Retries</p>
                          <p className="font-semibold text-sm mt-0.5">{webhook.retryPolicy.maxRetries} Retries</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Retry Delay</p>
                          <p className="font-semibold text-sm mt-0.5">{webhook.retryPolicy.retryDelayMs}ms</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Backoff Rate</p>
                          <p className="font-semibold text-sm mt-0.5">{webhook.retryPolicy.backoffMultiplier}x</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-[#c5a880]/10">
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(webhook.url);
                            success("Webhook URL copied");
                          }}
                          className="border border-[#c5a880]/35 bg-transparent hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[9px] uppercase h-8 px-4"
                        >
                          <Copy className="w-3 h-3 mr-1.5" />
                          Copy Target URL
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deleteMutation.mutate({ webhookId: webhook.webhookId })}
                          disabled={deleteMutation.isPending}
                          className="border border-[#e05a5a]/30 bg-transparent hover:bg-[#e05a5a]/5 text-[#e05a5a] rounded-none font-mono text-[9px] uppercase h-8 px-4"
                        >
                          <Trash2 className="w-3 h-3 mr-1.5" />
                          Decommission
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
    </DashboardLayout>
  );
}
