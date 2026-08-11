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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attack Playbook Builder</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create automated response playbooks for security events
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Playbook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Playbook</DialogTitle>
              <DialogDescription>
                Define triggers and actions for automated attack response
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Playbook Name</Label>
                <Input
                  placeholder="e.g., DDoS Response"
                  value={playbookName}
                  onChange={(e) => setPlaybookName(e.target.value)}
                />
              </div>
              <div>
                <Label>Trigger Event</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Response Actions</Label>
                <div className="space-y-2 mt-2">
                  {actionTypes.map((action) => (
                    <div key={action.value} className="flex items-center gap-2">
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
                      />
                      <label htmlFor={action.value} className="text-sm cursor-pointer">
                        {action.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Spinner /> : "Create Playbook"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : !playbooks || playbooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <p>No playbooks created yet. Create one to automate attack response.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {playbooks.map((playbook) => (
            <Card key={playbook.playbookId}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {playbook.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      ID: {playbook.playbookId}
                    </CardDescription>
                  </div>
                  <Badge variant={playbook.isActive ? "default" : "secondary"}>
                    {playbook.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {playbook.description && (
                    <div>
                      <p className="text-muted-foreground">Description</p>
                      <p>{playbook.description}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleExecute(playbook.playbookId)}
                      disabled={executeMutation.isPending}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Test Execute
                    </Button>
                    <Button size="sm" variant="outline" disabled>
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
  );
}
