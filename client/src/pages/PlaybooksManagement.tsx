import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Play, History, Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const PLAYBOOK_TEMPLATES = [
  {
    name: "Volumetric Attack Response",
    attackType: "volumetric",
    description: "Automated response for volumetric DDoS attacks",
    steps: [
      { action: "enable_rate_limiting", description: "Enable aggressive rate limiting" },
      { action: "activate_cdn", description: "Activate CDN protection" },
      { action: "block_suspicious_ips", description: "Block suspicious IPs" },
      { action: "notify_team", description: "Notify security team" },
    ],
  },
  {
    name: "Protocol Attack Response",
    attackType: "protocol",
    description: "Automated response for protocol-based attacks",
    steps: [
      { action: "enable_syn_cookies", description: "Enable SYN cookie protection" },
      { action: "drop_malformed_packets", description: "Drop malformed packets" },
      { action: "enable_connection_limits", description: "Limit concurrent connections" },
      { action: "log_attack_vectors", description: "Log attack details" },
    ],
  },
  {
    name: "Application Layer Response",
    attackType: "application_layer",
    description: "Automated response for application-layer attacks",
    steps: [
      { action: "enable_captcha", description: "Enable CAPTCHA challenges" },
      { action: "throttle_api_endpoints", description: "Throttle API endpoints" },
      { action: "enable_waf_rules", description: "Enable WAF rules" },
      { action: "cache_responses", description: "Enable response caching" },
    ],
  },
];

const EXECUTION_HISTORY = [
  {
    id: 1,
    playbookName: "Volumetric Attack Response",
    status: "completed",
    executedAt: "2026-06-02 14:32:15",
    duration: "2m 45s",
    result: "Successfully mitigated attack",
  },
  {
    id: 2,
    playbookName: "Protocol Attack Response",
    status: "in_progress",
    executedAt: "2026-06-02 15:18:42",
    duration: "1m 12s",
    result: "Executing mitigation steps",
  },
  {
    id: 3,
    playbookName: "Application Layer Response",
    status: "completed",
    executedAt: "2026-06-02 13:45:20",
    duration: "1m 30s",
    result: "Attack contained successfully",
  },
];

export default function PlaybooksManagement() {
  const { user } = useAuth();
  const [selectedPlaybook, setSelectedPlaybook] = useState<typeof PLAYBOOK_TEMPLATES[0] | null>(null);
  const [showExecutionHistory, setShowExecutionHistory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleExecutePlaybook = (playbookName: string) => {
    toast.success(`Executing playbook: ${playbookName}`, {
      description: "Mitigation steps are being executed...",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-[#8a9a86]" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-[#d9c06c] animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-[#e05a5a]" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Response Playbooks</h1>
          <p className="text-xs text-muted-foreground font-mono">Deploy modular automation steps for active threat vectors</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 animate-fade-in-up">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none px-5 h-10">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Custom Playbook
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-md">
              <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">Create Custom Playbook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Playbook Name</label>
                  <Input placeholder="e.g., Custom DDoS Response" className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Description</label>
                  <Textarea placeholder="Describe the playbook..." className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Attack Type Target</label>
                  <Select>
                    <SelectTrigger className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 text-xs font-mono mt-1">
                      <SelectValue placeholder="Select attack type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none bg-[#13151a] border-[#c5a880]/15 font-mono text-xs">
                      <SelectItem value="volumetric">Volumetric</SelectItem>
                      <SelectItem value="protocol">Protocol</SelectItem>
                      <SelectItem value="application_layer">Application Layer</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none mt-2" onClick={() => setIsCreating(false)}>
                  Create Playbook
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-10 px-5"
            onClick={() => setShowExecutionHistory(!showExecutionHistory)}
          >
            <History className="w-4 h-4 mr-2" />
            Execution History Logs
          </Button>
        </div>

        {/* Playbook Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLAYBOOK_TEMPLATES.map((playbook, idx) => (
            <Card
              key={idx}
              className="glass-card rounded-none border-[#c5a880]/15 hover:border-[#c5a880]/40 transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedPlaybook(playbook)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-serif uppercase tracking-wider text-[#e2e8f0] group-hover:text-[#c5a880] transition-colors">{playbook.name}</h3>
                    <Badge className="mt-2.5 border-[#c5a880]/35 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">
                      {playbook.attackType.replace("_", " ")}
                    </Badge>
                  </div>
                  <Zap className="w-4 h-4 text-[#c5a880] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <p className="text-[10px] font-mono text-muted-foreground mb-4 min-h-[30px]">{playbook.description}</p>

                <div className="space-y-2 mb-4 border-t border-[#c5a880]/10 pt-3">
                  {playbook.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                      <div className="w-1 h-1 rounded-none bg-[#c5a880]" />
                      {step.description}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full border border-[#c5a880]/30 bg-transparent hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-8 mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExecutePlaybook(playbook.name);
                  }}
                >
                  <Play className="w-3 h-3 mr-1.5" />
                  Execute Playbook
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Execution History */}
        {showExecutionHistory && (
          <Card className="glass-card rounded-none border-[#c5a880]/15 animate-fade-in">
            <CardHeader className="border-b border-[#c5a880]/10 pb-4">
              <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Execution History Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {EXECUTION_HISTORY.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none hover:border-[#c5a880]/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(execution.status)}
                      <div>
                        <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{execution.playbookName}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{execution.executedAt}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          execution.status === "completed"
                            ? "border-[#8a9a86]/30 text-[#8a9a86] bg-[#8a9a86]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5"
                            : execution.status === "in_progress"
                              ? "border-[#d9c06c]/30 text-[#d9c06c] bg-[#d9c06c]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5 animate-pulse"
                              : "border-[#e05a5a]/30 text-[#e05a5a] bg-[#e05a5a]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5"
                        }
                      >
                        {execution.status}
                      </Badge>
                      <p className="text-[9px] font-mono text-muted-foreground mt-1.5">{execution.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Playbook Details Modal */}
        {selectedPlaybook && (
          <Dialog open={!!selectedPlaybook} onOpenChange={() => setSelectedPlaybook(null)}>
            <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-2xl">
              <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">{selectedPlaybook.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Operational Summary</p>
                  <p className="text-xs font-mono text-[#e2e8f0]">{selectedPlaybook.description}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Automated Mitigation Sequences</p>
                  <div className="space-y-2">
                    {selectedPlaybook.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                        <div className="flex items-center justify-center w-5 h-5 rounded-none border border-[#c5a880]/30 bg-[#c5a880]/5 text-[#c5a880] text-[10px] font-mono flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{step.action}</p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none mt-2"
                  onClick={() => {
                    handleExecutePlaybook(selectedPlaybook.name);
                    setSelectedPlaybook(null);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Commit & Execute Playbook
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
