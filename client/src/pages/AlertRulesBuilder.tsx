import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/useToast";

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
      conditions: newRule.conditions.filter((_, i) => i !== index),
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
      actions: newRule.actions.filter((_, i) => i !== index),
    });
  };

  const handleSaveRule = () => {
    if (!newRule.name.trim()) {
      error("Rule name is required");
      return;
    }

    if (newRule.conditions.length === 0) {
      error("At least one condition is required");
      return;
    }

    if (newRule.actions.length === 0) {
      error("At least one action is required");
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
    return <div className="p-6">Loading rules...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Alert Rules Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create custom alert rules with visual rule builder
          </p>
        </div>
      </div>

      {/* Templates Section */}
      <Card className="p-6 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <h2 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">Rule Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RULE_TEMPLATES.map((template, idx) => (
            <Card key={idx} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-sm mb-2">{template.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApplyTemplate(template)}
                className="w-full"
              >
                Use Template
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      {/* Rule Builder */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Create New Rule</h2>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rule Name</label>
              <Input
                placeholder="e.g., High Traffic Alert"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                placeholder="Describe what this rule does"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Conditions</h3>
              <Select value={newRule.logicalOperator} onValueChange={(val: any) => setNewRule({ ...newRule, logicalOperator: val })}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {newRule.conditions.map((cond, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <Select value={cond.field} onValueChange={(val) => {
                    const updated = [...newRule.conditions];
                    updated[idx].field = val;
                    setNewRule({ ...newRule, conditions: updated });
                  }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
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
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                    className="flex-1"
                  />

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveCondition(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCondition}
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Condition
            </Button>
          </div>

          {/* Actions */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Actions</h3>

            <div className="space-y-3">
              {newRule.actions.map((action, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <Select value={action.type} onValueChange={(val: any) => {
                    const updated = [...newRule.actions];
                    updated[idx].type = val;
                    setNewRule({ ...newRule, actions: updated });
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Target (email, webhook URL, etc.)"
                    value={action.target}
                    onChange={(e) => {
                      const updated = [...newRule.actions];
                      updated[idx].target = e.target.value;
                      setNewRule({ ...newRule, actions: updated });
                    }}
                    className="flex-1"
                  />

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveAction(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleAddAction}
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Action
            </Button>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSaveRule} 
            disabled={createRuleMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {createRuleMutation.isPending ? "Saving..." : "Save Rule"}
          </Button>
        </div>
      </Card>

      {/* Active Rules */}
      {rules.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Rules ({rules.length})</h2>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{rule.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline">{rule.conditions?.length || 0} conditions</Badge>
                      <Badge variant="outline">{rule.logicalOperator || "AND"}</Badge>
                      <Badge variant="outline">{rule.actions?.length || 0} actions</Badge>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={deleteRuleMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
