import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2, Shield, Zap, Lock, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";

export default function MitigationControls() {
  const { success, error } = useToast();
  const rulesQuery = trpc.mitigation.rules.useQuery();
  const createRuleMutation = trpc.mitigation.createRule.useMutation();
  const toggleRuleMutation = trpc.mitigation.toggleRule.useMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "ip_block" as const,
    target: "",
    threshold: "",
    duration: "",
  });

  const handleCreateRule = async () => {
    if (!formData.target) {
      error("Please enter a target");
      return;
    }

    try {
      await createRuleMutation.mutateAsync({
        type: formData.type,
        target: formData.target,
        threshold: formData.threshold ? parseInt(formData.threshold) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
      });
      success("Mitigation rule created successfully");
      setFormData({ type: "ip_block", target: "", threshold: "", duration: "" });
      setIsDialogOpen(false);
      rulesQuery.refetch();
    } catch (err) {
      error("Failed to create mitigation rule");
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await toggleRuleMutation.mutateAsync({
        ruleId,
        isActive: !isActive,
      });
      success(`Rule ${!isActive ? "enabled" : "disabled"}`);
      rulesQuery.refetch();
    } catch (err) {
      error("Failed to update rule");
    }
  };

  const ipBlockRules = rulesQuery.data?.filter((r: any) => r.type === "ip_block") || [];
  const rateLimitRules = rulesQuery.data?.filter((r: any) => r.type === "rate_limit") || [];
  const captchaRules = rulesQuery.data?.filter((r: any) => r.type === "captcha_challenge") || [];
  const geoBlockRules = rulesQuery.data?.filter((r: any) => r.type === "geo_block") || [];

  const RuleCard = ({ rule, colorClass }: { rule: any; colorClass: string }) => (
    <div className={`flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-${colorClass}/50 transition-all duration-300 group animate-fade-in-up`}>
      <div className="flex items-center gap-3 flex-1">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{rule.target}</p>
          <p className="text-sm text-muted-foreground">
            {rule.threshold && `${rule.threshold} req/s`}
            {rule.duration && ` • ${rule.duration}s`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={rule.isActive ? "default" : "secondary"}>{rule.isActive ? "Active" : "Inactive"}</Badge>
        <Switch checked={rule.isActive} onCheckedChange={() => handleToggleRule(rule.ruleId, rule.isActive)} />
        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gradient mb-2">Mitigation Controls</h1>
          <p className="text-muted-foreground">Manage active defense mechanisms and mitigation strategies</p>
        </div>

        {/* Action Button */}
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0">
                <Plus className="w-4 h-4" />
                Create New Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Mitigation Rule</DialogTitle>
                <DialogDescription>Add a new mitigation rule to protect your infrastructure</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Rule Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="ip_block">IP Block</option>
                    <option value="rate_limit">Rate Limit</option>
                    <option value="captcha_challenge">CAPTCHA Challenge</option>
                    <option value="geo_block">Geographic Block</option>
                  </select>
                </div>
                <div>
                  <Label>Target</Label>
                  <Input
                    placeholder={formData.type === "ip_block" ? "192.168.1.0/24" : formData.type === "geo_block" ? "CN" : "/api/endpoint"}
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="mt-2"
                  />
                </div>
                {(formData.type as string) === "rate_limit" && (
                  <>
                    <div>
                      <Label>Threshold (requests/sec)</Label>
                      <Input type="number" placeholder="100" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: e.target.value })} className="mt-2" />
                    </div>
                    <div>
                      <Label>Duration (seconds)</Label>
                      <Input type="number" placeholder="3600" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="mt-2" />
                    </div>
                  </>
                )}
                <Button onClick={handleCreateRule} className="w-full" disabled={createRuleMutation.isPending}>
                  {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          {[
            { label: "IP Blocks", value: ipBlockRules.length, active: ipBlockRules.filter((r: any) => r.isActive).length, icon: Shield, color: "from-red-500 to-pink-500" },
            { label: "Rate Limits", value: rateLimitRules.length, active: rateLimitRules.filter((r: any) => r.isActive).length, icon: Zap, color: "from-yellow-500 to-orange-500" },
            { label: "CAPTCHA", value: captchaRules.length, active: captchaRules.filter((r: any) => r.isActive).length, icon: Lock, color: "from-purple-500 to-pink-500" },
            { label: "Geo Blocks", value: geoBlockRules.length, active: geoBlockRules.filter((r: any) => r.isActive).length, icon: Globe, color: "from-cyan-500 to-blue-500" },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="card-elevated hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gradient">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.active} active</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mitigation Rules */}
        <Tabs defaultValue="ip_block" className="space-y-6 animate-fade-in-up" style={{ animationDelay: "250ms" }}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="ip_block" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><Shield className="w-4 h-4 mr-2" />IP Blocking</TabsTrigger>
            <TabsTrigger value="rate_limit" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><Zap className="w-4 h-4 mr-2" />Rate Limiting</TabsTrigger>
            <TabsTrigger value="captcha" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><Lock className="w-4 h-4 mr-2" />CAPTCHA</TabsTrigger>
            <TabsTrigger value="geo" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"><Globe className="w-4 h-4 mr-2" />Geographic</TabsTrigger>
          </TabsList>

          <TabsContent value="ip_block">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>IP Blocking Rules</CardTitle>
                <CardDescription>Block traffic from specific IP addresses or CIDR ranges</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : ipBlockRules.length > 0 ? (
                  <div className="space-y-3">
                    {ipBlockRules.map((rule: any, idx: number) => (
                      <div key={rule.id} style={{ animationDelay: `${idx * 30}ms` }}>
                        <RuleCard rule={rule} colorClass="from-red-500 to-pink-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No IP blocking rules configured</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate_limit">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Rate Limiting Rules</CardTitle>
                <CardDescription>Limit request rates to specific endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : rateLimitRules.length > 0 ? (
                  <div className="space-y-3">
                    {rateLimitRules.map((rule: any, idx: number) => (
                      <div key={rule.id} style={{ animationDelay: `${idx * 30}ms` }}>
                        <RuleCard rule={rule} colorClass="from-yellow-500 to-orange-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No rate limiting rules configured</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="captcha">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>CAPTCHA Challenge Rules</CardTitle>
                <CardDescription>Trigger CAPTCHA verification for suspicious traffic</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : captchaRules.length > 0 ? (
                  <div className="space-y-3">
                    {captchaRules.map((rule: any, idx: number) => (
                      <div key={rule.id} style={{ animationDelay: `${idx * 30}ms` }}>
                        <RuleCard rule={rule} colorClass="from-purple-500 to-pink-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No CAPTCHA rules configured</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geo">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Geographic Blocking Rules</CardTitle>
                <CardDescription>Block traffic from specific countries or regions</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : geoBlockRules.length > 0 ? (
                  <div className="space-y-3">
                    {geoBlockRules.map((rule: any, idx: number) => (
                      <div key={rule.id} style={{ animationDelay: `${idx * 30}ms` }}>
                        <RuleCard rule={rule} colorClass="from-cyan-500 to-blue-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No geographic blocking rules configured</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
