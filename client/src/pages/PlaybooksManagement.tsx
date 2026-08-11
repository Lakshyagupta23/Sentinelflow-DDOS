import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Play, History, Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

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
    name: "Application Layer Attack Response",
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
    playbookName: "Application Layer Attack Response",
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
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-amber-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" />
            Attack Response Playbooks
          </h1>
          <p className="text-slate-400">Automated mitigation workflows for different attack types</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Create Custom Playbook
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create Custom Playbook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Playbook Name</label>
                  <Input placeholder="e.g., Custom DDoS Response" className="bg-slate-700 border-slate-600 text-white mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <Textarea placeholder="Describe the playbook..." className="bg-slate-700 border-slate-600 text-white mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Attack Type</label>
                  <Select>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                      <SelectValue placeholder="Select attack type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="volumetric">Volumetric</SelectItem>
                      <SelectItem value="protocol">Protocol</SelectItem>
                      <SelectItem value="application_layer">Application Layer</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => setIsCreating(false)}>
                  Create Playbook
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={() => setShowExecutionHistory(!showExecutionHistory)}
          >
            <History className="w-4 h-4 mr-2" />
            Execution History
          </Button>
        </div>

        {/* Playbook Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {PLAYBOOK_TEMPLATES.map((playbook, idx) => (
            <Card
              key={idx}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-cyan-500 transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedPlaybook(playbook)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{playbook.name}</h3>
                    <Badge className="mt-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
                      {playbook.attackType.replace("_", " ")}
                    </Badge>
                  </div>
                  <Zap className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <p className="text-sm text-slate-400 mb-4">{playbook.description}</p>

                <div className="space-y-2 mb-4">
                  {playbook.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {step.description}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2"
                  onClick={() => handleExecutePlaybook(playbook.name)}
                >
                  <Play className="w-4 h-4" />
                  Execute Playbook
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Execution History */}
        {showExecutionHistory && (
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 animate-fade-in">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Recent Executions
              </h2>

              <div className="space-y-3">
                {EXECUTION_HISTORY.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(execution.status)}
                      <div>
                        <p className="font-medium text-white">{execution.playbookName}</p>
                        <p className="text-xs text-slate-400">{execution.executedAt}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          execution.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                            : execution.status === "in_progress"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "bg-red-500/20 text-red-300 border-red-500/50"
                        }
                      >
                        {execution.status}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">{execution.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Playbook Details Modal */}
        {selectedPlaybook && (
          <Dialog open={!!selectedPlaybook} onOpenChange={() => setSelectedPlaybook(null)}>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">{selectedPlaybook.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Description</p>
                  <p className="text-white">{selectedPlaybook.description}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Mitigation Steps</p>
                  <div className="space-y-2">
                    {selectedPlaybook.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-700/50 rounded border border-slate-600">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-white">{step.action}</p>
                          <p className="text-sm text-slate-400">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2"
                  onClick={() => {
                    handleExecutePlaybook(selectedPlaybook.name);
                    setSelectedPlaybook(null);
                  }}
                >
                  <Play className="w-4 h-4" />
                  Execute This Playbook
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
