import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Wrench } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/useToast";
import DashboardLayout from "@/components/DashboardLayout";
import { Spinner } from "@/components/ui/spinner";

const RULE_TEMPLATES: Array<{
  name: string;
  description: string;
  conditions: Array<{ field: string; operator: "equals" | "greater_than" | "less_than" | "contains" | "in"; value: string }>;
}> = [
  {
    name: "High Traffic Alert",
    description: "Alert when traffic exceeds 5Gbps",
    conditions: [{ field: "trafficVolume", operator: "greater_than", value: "5000" }],
  },
  {
    name: "Critical Attack",
    description: "Alert on critical severity attacks",
    conditions: [{ field: "severity", operator: "equals", value: "critical" }],
  },
  {
    name: "Multiple Attack Types",
    description: "Alert on volumetric AND protocol attacks",
    conditions: [
      { field: "type", operator: "equals", value: "volumetric" },
      { field: "type", operator: "equals", value: "protocol" },
    ],
  },
];

export default function AlertRulesBuilder() {
  const { success, error } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState<{
    name: string;
    description: string;
    conditions: Array<{ field: string; operator: "equals" | "greater_than" | "less_than" | "contains" | "in"; value: string }>;
    logicalOperator: "AND" | "OR";
    actions: Array<{ type: "email" | "slack" | "webhook" | "sms"; target: string }>;
  }>({
    name: "",
    description: "",
    conditions: [{ field: "severity", operator: "equals", value: "critical" }],
    logicalOperator: "AND",
    actions: [{ type: "email", target: "" }],
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Fetch existing rules
  const { data: existingRules, isLoading } = trpc.alertRules.list.useQuery({ organizationId: 1 });

  // Create rule mutation
  const createRuleMutation = trpc.alertRules.create.useMutation({
    onSuccess: (data) => {
      setRules([...rules, data]);
      success("Rule created successfully");
      setNewRule({
        name: "",
        description: "",
        conditions: [{ field: "severity", operator: "equals", value: "critical" }],
        logicalOperator: "AND",
        actions: [{ type: "email" as const, target: "" }],
      });
    },
    onError: (err) => {
      error("Failed to create rule: " + (err as any).message);
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = trpc.alertRules.delete.useMutation({
    onSuccess: () => {
      success("Rule deleted successfully");
    },
    onError: (err) => {
      error("Failed to delete rule: " + (err as any).message);
    },
  });

  // Load existing rules on mount
  useEffect(() => {
    if (existingRules) {
      setRules(existingRules);
    }
  }, [existingRules]);

  const handleAddCondition = () => {
    setNewRule({
      ...newRule,
      conditions: [...newRule.conditions, { field: "", operator: "equals" as const, value: "" }],
    });
  };

  const handleRemoveCondition = (index: number) => {
    setNewRule({
      ...newRule,
      conditions: newRule.conditions.filter((_, idx) => idx !== index),
    });
  };

  const handleAddAction = () => {
    setNewRule({
      ...newRule,
      actions: [...newRule.actions, { type: "email" as const, target: "" }],
    });
  };

  const handleRemoveAction = (index: number) => {
    setNewRule({
      ...newRule,
      actions: newRule.actions.filter((_, idx) => idx !== index),
    });
  };

  const handleSaveRule = () => {
    if (!newRule.name) {
      error("Please enter a rule name");
      return;
    }

    createRuleMutation.mutate({
      organizationId: 1,
      name: newRule.name,
      description: newRule.description,
      conditions: newRule.conditions,
      logicalOperator: newRule.logicalOperator,
      actions: newRule.actions,
      enabled: true,
    });
  };

  const handleApplyTemplate = (template: any) => {
    setNewRule({
      name: template.name,
      description: template.description,
      conditions: template.conditions,
      logicalOperator: "AND",
      actions: [{ type: "email" as const, target: "" }],
    });
    success(`Template "${template.name}" applied`);
  };

  const handleDeleteRule = (ruleId: number) => {
    deleteRuleMutation.mutate({ id: ruleId });
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Alert Rules Builder</h1>
          <p className="text-xs text-muted-foreground font-mono">Create and deploy customized response conditions on active metrics</p>
        </div>

        {/* Templates Section */}
        <Card className="glass-card rounded-none border-[#c5a880]/15">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Standard Preset Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {RULE_TEMPLATES.map((template, idx) => (
                <div key={idx} className="p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none hover:border-[#c5a880]/30 transition-all duration-300">
                  <h3 className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0] mb-2">{template.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono mb-4 min-h-[30px]">{template.description}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyTemplate(template)}
                    className="w-full border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[9px] uppercase h-8"
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rule Builder */}
        <Card className="glass-card rounded-none border-[#c5a880]/15">
          <CardHeader className="border-b border-[#c5a880]/10 pb-4">
            <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Rule Builder Panel</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Rule Identification Name</label>
                <Input
                  placeholder="e.g., High Traffic Alert"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Operational Description</label>
                <Input
                  placeholder="Describe rule behavior parameters"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="border-t border-[#c5a880]/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xs uppercase tracking-wider text-[#c5a880]">Matching Conditions</h3>
                <Select value={newRule.logicalOperator} onValueChange={(val: any) => setNewRule({ ...newRule, logicalOperator: val })}>
                  <SelectTrigger className="w-24 rounded-none bg-[#13151a]/20 border-[#c5a880]/15 text-[10px] font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none bg-[#13151a] border-[#c5a880]/15 font-mono text-xs">
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {newRule.conditions.map((cond, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <Select value={cond.field} onValueChange={(val) => {
                      const updated = [...newRule.conditions];
                      updated[idx].field = val;
                      setNewRule({ ...newRule, conditions: updated });
                    }}>
                      <SelectTrigger className="flex-1 rounded-none bg-[#13151a]/20 border-[#c5a880]/15 text-[10px] font-mono">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none bg-[#13151a] border-[#c5a880]/15 font-mono text-xs">
                        <SelectItem value="severity">Severity</SelectItem>
                        <SelectItem value="type">Attack Type</SelectItem>
                        <SelectItem value="trafficVolume">Traffic Volume</SelectItem>
                        <SelectItem value="sourceCountry">Source Country</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={cond.operator} onValueChange={(val: any) => {
                      const updated = [...newRule.conditions];
                      updated[idx].operator = val as "equals" | "greater_than" | "less_than" | "contains" | "in";
                      setNewRule({ ...newRule, conditions: updated });
                    }}>
                      <SelectTrigger className="w-32 rounded-none bg-[#13151a]/20 border-[#c5a880]/15 text-[10px] font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none bg-[#13151a] border-[#c5a880]/15 font-mono text-xs">
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={cond.value}
                      onChange={(e) => {
                        const updated = [...newRule.conditions];
                        updated[idx].value = e.target.value;
                        setNewRule({ ...newRule, conditions: updated });
                      }}
                      className="flex-1 rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveCondition(idx)}
                      className="text-[#e05a5a] hover:bg-[#e05a5a]/5 rounded-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAddCondition}
                className="mt-3 border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[9px] uppercase h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Condition
              </Button>
            </div>

            {/* Actions */}
            <div className="border-t border-[#c5a880]/10 pt-6">
              <h3 className="font-serif text-xs uppercase tracking-wider text-[#c5a880] mb-4">Targeted Alert Actions</h3>

              <div className="space-y-3">
                {newRule.actions.map((action, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <Select value={action.type} onValueChange={(val: any) => {
                      const updated = [...newRule.actions];
                      updated[idx].type = val;
                      setNewRule({ ...newRule, actions: updated });
                    }}>
                      <SelectTrigger className="w-32 rounded-none bg-[#13151a]/20 border-[#c5a880]/15 text-[10px] font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none bg-[#13151a] border-[#c5a880]/15 font-mono text-xs">
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Target endpoint parameter (email / webhook URL / mobile number)"
                      value={action.target}
                      onChange={(e) => {
                        const updated = [...newRule.actions];
                        updated[idx].target = e.target.value;
                        setNewRule({ ...newRule, actions: updated });
                      }}
                      className="flex-1 rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveAction(idx)}
                      className="text-[#e05a5a] hover:bg-[#e05a5a]/5 rounded-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAddAction}
                className="mt-3 border-[#c5a880]/30 hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[9px] uppercase h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Action
              </Button>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSaveRule} 
              disabled={createRuleMutation.isPending}
              className="w-full bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none h-10"
            >
              <Save className="w-4 h-4 mr-2" />
              {createRuleMutation.isPending ? "Syncing..." : "Commit Rule to Core"}
            </Button>
          </CardContent>
        </Card>

        {/* Active Rules */}
        {rules.length > 0 && (
          <Card className="glass-card rounded-none border-[#c5a880]/15">
            <CardHeader className="border-b border-[#c5a880]/10 pb-4">
              <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Active Ingress Defense Rules ({rules.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 border border-[#c5a880]/10 bg-[#13151a]/30 rounded-none hover:border-[#c5a880]/30 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{rule.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">{rule.description}</p>
                        <div className="mt-3 flex gap-2">
                          <Badge className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">{rule.conditions?.length || 0} conditions</Badge>
                          <Badge className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">{rule.logicalOperator || "AND"}</Badge>
                          <Badge className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">{rule.actions?.length || 0} actions</Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deleteRuleMutation.isPending}
                        className="text-[#e05a5a] hover:bg-[#e05a5a]/5 rounded-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
