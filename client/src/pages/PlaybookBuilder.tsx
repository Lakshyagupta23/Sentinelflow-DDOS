import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Play, Trash2, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";

export function PlaybookBuilder() {
  const [organizationId] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [playbookName, setPlaybookName] = useState("");
  const [triggerType, setTriggerType] = useState("attack_detected");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const { data: playbooks, isLoading, refetch } = trpc.playbooks.list.useQuery(
    { organizationId },
    { enabled: organizationId > 0 }
  );

  const createMutation = trpc.playbooks.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setPlaybookName("");
      setTriggerType("attack_detected");
      setSelectedActions([]);
    },
  });

  const executeMutation = trpc.playbooksAutomation.execute.useMutation();

  const handleCreate = async () => {
    if (!playbookName) {
      alert("Playbook name is required");
      return;
    }

    const steps = selectedActions.map((action, idx) => ({
      action,
      description: `Execute ${action} action`,
      parameters: {
        type: action,
        config: {
          message: `${action} action triggered`,
          target: "default",
        },
      },
    }));

    await createMutation.mutateAsync({
      organizationId,
      name: playbookName,
      attackType: "custom",
      steps,
    });
  };

  const handleExecute = async (playbookId: string) => {
    await executeMutation.mutateAsync({
      playbookId,
      triggeredBy: "manual",
      eventData: {
        severity: "high",
        timestamp: new Date().toISOString(),
      },
    });
  };

  const actionTypes = [
    { value: "notification", label: "Send Notification" },
    { value: "mitigation", label: "Apply Mitigation" },
    { value: "webhook", label: "Trigger Webhook" },
    { value: "slack", label: "Send Slack Message" },
    { value: "pagerduty", label: "Create PagerDuty Incident" },
    { value: "splunk", label: "Send to Splunk" },
  ];

  const triggerTypes = [
    { value: "attack_detected", label: "Attack Detected" },
    { value: "alert_triggered", label: "Alert Triggered" },
    { value: "threat_detected", label: "Threat Detected" },
    { value: "manual", label: "Manual Execution" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Playbook Builder</h1>
              <p className="text-xs text-muted-foreground font-mono">Build customized automated orchestration response playbooks</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none px-5 h-10">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Playbook
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-md">
                <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                  <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">Create Playbook Blueprint</DialogTitle>
                  <DialogDescription className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                    Define triggers and actions for automated response
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Playbook Name</Label>
                    <Input
                      placeholder="e.g., DDoS Volumetric Response"
                      value={playbookName}
                      onChange={(e) => setPlaybookName(e.target.value)}
                      className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Trigger Event</Label>
                    <Select value={triggerType} onValueChange={setTriggerType}>
                      <SelectTrigger className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none bg-[#13151a] border-[#c5a880]/15 font-mono text-xs">
                        {triggerTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 block">Response Actions</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-[#c5a880]/10 p-2.5 bg-[#13151a]/30">
                      {actionTypes.map((action) => (
                        <div key={action.value} className="flex items-center gap-2 font-mono text-xs">
                          <input
                            type="checkbox"
                            id={action.value}
                            checked={selectedActions.includes(action.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedActions([...selectedActions, action.value]);
                              } else {
                                setSelectedActions(selectedActions.filter((a) => a !== action.value));
                              }
                            }}
                            className="w-4 h-4 accent-[#c5a880] border-[#c5a880]/30 rounded-none bg-[#13151a]"
                          />
                          <label htmlFor={action.value} className="cursor-pointer text-muted-foreground hover:text-[#e2e8f0]">
                            {action.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none mt-2">
                    {createMutation.isPending ? <Spinner /> : "Create Playbook"}
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
        ) : !playbooks || playbooks.length === 0 ? (
          <Card className="glass-card rounded-none border-[#c5a880]/15">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                <AlertCircle className="w-4 h-4 text-[#c5a880]" />
                <p>No playbooks created yet. Create one to automate response.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {playbooks.map((playbook) => (
              <Card key={playbook.playbookId} className="glass-card rounded-none border-[#c5a880]/15">
                <CardHeader className="border-b border-[#c5a880]/10 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-serif uppercase tracking-wider text-[#c5a880] flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {playbook.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-mono text-muted-foreground mt-1">
                        Playbook Blueprint Registry Key: {playbook.playbookId}
                      </CardDescription>
                    </div>
                    <Badge className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">
                      {playbook.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 font-mono text-xs">
                  <div className="space-y-3">
                    {playbook.description && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Operational Target Description</p>
                        <p className="text-[#e2e8f0] mt-0.5">{playbook.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleExecute(playbook.playbookId)}
                        disabled={executeMutation.isPending}
                        className="border border-[#c5a880]/35 bg-transparent hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[9px] uppercase h-8 px-4"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Test Execute
                      </Button>
                      <Button size="sm" className="border border-[#c5a880]/10 bg-transparent text-muted-foreground rounded-none font-mono text-[9px] uppercase h-8 px-4 opacity-50 cursor-not-allowed" disabled>
                        Edit (Coming Soon)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
