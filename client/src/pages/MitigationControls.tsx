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

  const RuleCard = ({ rule, Icon }: { rule: any; Icon: any }) => (
    <div className="flex items-center justify-between p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none hover:border-[#c5a880]/30 transition-all duration-300 group animate-fade-in-up">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-9 h-9 rounded-none border border-[#c5a880]/20 bg-[#c5a880]/5 flex items-center justify-center transition-transform duration-300">
          <Icon className="w-4 h-4 text-[#c5a880]" />
        </div>
        <div>
          <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{rule.target}</p>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            {rule.threshold && `${rule.threshold} req/s`}
            {rule.duration && ` • ${rule.duration}s`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">{rule.isActive ? "Active" : "Inactive"}</Badge>
        <Switch checked={rule.isActive} onCheckedChange={() => handleToggleRule(rule.ruleId, rule.isActive)} className="data-[state=checked]:bg-[#c5a880]" />
        <Button size="sm" variant="ghost" className="text-[#e05a5a] hover:bg-[#e05a5a]/5 rounded-none">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Mitigation Controls</h1>
          <p className="text-xs text-muted-foreground font-mono">Manage active defense configurations and scrubbing policies</p>
        </div>

        {/* Action Button */}
        <div className="animate-fade-in-up">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none px-5 h-10">
                <Plus className="w-4 h-4 mr-1.5" />
                Create New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-md">
              <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">Create Mitigation Rule</DialogTitle>
                <DialogDescription className="text-[10px] font-mono text-muted-foreground uppercase mt-1">Configure a new active defense vector</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Rule Class Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs w-full px-3 py-2 text-[#e2e8f0]"
                  >
                    <option value="ip_block">IP Block</option>
                    <option value="rate_limit">Rate Limit</option>
                    <option value="captcha_challenge">CAPTCHA Challenge</option>
                    <option value="geo_block">Geographic Block</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Target</Label>
                  <Input
                    placeholder={formData.type === "ip_block" ? "192.168.1.0/24" : formData.type === "geo_block" ? "CN" : "/api/endpoint"}
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880] mt-1"
                  />
                </div>
                {(formData.type as string) === "rate_limit" && (
                  <>
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Threshold (requests/sec)</Label>
                      <Input type="number" placeholder="100" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: e.target.value })} className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Duration (seconds)</Label>
                      <Input type="number" placeholder="3600" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs mt-1" />
                    </div>
                  </>
                )}
                <Button onClick={handleCreateRule} className="w-full bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none mt-2" disabled={createRuleMutation.isPending}>
                  {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
          {[
            { label: "IP Block Rules", value: ipBlockRules.length, active: ipBlockRules.filter((r: any) => r.isActive).length, icon: Shield },
            { label: "Rate Limit Rules", value: rateLimitRules.length, active: rateLimitRules.filter((r: any) => r.isActive).length, icon: Zap },
            { label: "CAPTCHA Challenges", value: captchaRules.length, active: captchaRules.filter((r: any) => r.isActive).length, icon: Lock },
            { label: "Geo Block Rules", value: geoBlockRules.length, active: geoBlockRules.filter((r: any) => r.isActive).length, icon: Globe },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="glass-card rounded-none border-[#c5a880]/15 bg-[#13151a]/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">{stat.label}</p>
                    <p className="text-xl font-bold font-serif text-[#c5a880]">{stat.value}</p>
                    <p className="text-[9px] font-mono text-muted-foreground mt-1">{stat.active} active rules</p>
                  </div>
                  <div className="w-9 h-9 rounded-none border border-[#c5a880]/20 bg-[#c5a880]/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#c5a880]" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Mitigation Rules */}
        <Tabs defaultValue="ip_block" className="space-y-6 animate-fade-in-up">
          <TabsList className="bg-card border border-[#c5a880]/15 rounded-none p-1">
            <TabsTrigger value="ip_block" className="data-[state=active]:bg-[#c5a880] data-[state=active]:text-[#0d0e12] rounded-none font-mono text-[10px] uppercase h-8 px-4"><Shield className="w-3.5 h-3.5 mr-1.5" />IP Blocking</TabsTrigger>
            <TabsTrigger value="rate_limit" className="data-[state=active]:bg-[#c5a880] data-[state=active]:text-[#0d0e12] rounded-none font-mono text-[10px] uppercase h-8 px-4"><Zap className="w-3.5 h-3.5 mr-1.5" />Rate Limiting</TabsTrigger>
            <TabsTrigger value="captcha" className="data-[state=active]:bg-[#c5a880] data-[state=active]:text-[#0d0e12] rounded-none font-mono text-[10px] uppercase h-8 px-4"><Lock className="w-3.5 h-3.5 mr-1.5" />CAPTCHA</TabsTrigger>
            <TabsTrigger value="geo" className="data-[state=active]:bg-[#c5a880] data-[state=active]:text-[#0d0e12] rounded-none font-mono text-[10px] uppercase h-8 px-4"><Globe className="w-3.5 h-3.5 mr-1.5" />Geographic</TabsTrigger>
          </TabsList>

          <TabsContent value="ip_block">
            <Card className="glass-card rounded-none border-[#c5a880]/15">
              <CardHeader className="border-b border-[#c5a880]/10 pb-4">
                <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">IP Blocking Defense Roster</CardTitle>
                <CardDescription className="text-[10px] font-mono text-muted-foreground uppercase mt-1">Block traffic from specific IP addresses or CIDR ranges</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {rulesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : ipBlockRules.length > 0 ? (
                  <div className="space-y-3">
                    {ipBlockRules.map((rule: any) => (
                      <RuleCard key={rule.ruleId} rule={rule} Icon={Shield} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8 font-mono text-xs uppercase">No active IP blocking rules configured</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate_limit">
            <Card className="glass-card rounded-none border-[#c5a880]/15">
              <CardHeader className="border-b border-[#c5a880]/10 pb-4">
                <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Rate Limiting Defense Roster</CardTitle>
                <CardDescription className="text-[10px] font-mono text-muted-foreground uppercase mt-1">Limit request rates to specific endpoints</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {rulesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : rateLimitRules.length > 0 ? (
                  <div className="space-y-3">
                    {rateLimitRules.map((rule: any) => (
                      <RuleCard key={rule.ruleId} rule={rule} Icon={Zap} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8 font-mono text-xs uppercase">No active rate limiting rules configured</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="captcha">
            <Card className="glass-card rounded-none border-[#c5a880]/15">
              <CardHeader className="border-b border-[#c5a880]/10 pb-4">
                <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">CAPTCHA Challenge Defense Roster</CardTitle>
                <CardDescription className="text-[10px] font-mono text-muted-foreground uppercase mt-1">Trigger CAPTCHA verification for suspicious traffic</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {rulesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : captchaRules.length > 0 ? (
                  <div className="space-y-3">
                    {captchaRules.map((rule: any) => (
                      <RuleCard key={rule.ruleId} rule={rule} Icon={Lock} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8 font-mono text-xs uppercase">No active CAPTCHA rules configured</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geo">
            <Card className="glass-card rounded-none border-[#c5a880]/15">
              <CardHeader className="border-b border-[#c5a880]/10 pb-4">
                <CardTitle className="text-[#c5a880] font-serif text-sm tracking-wider uppercase">Geographic Blocking Defense Roster</CardTitle>
                <CardDescription className="text-[10px] font-mono text-muted-foreground uppercase mt-1">Block traffic from specific countries or regions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {rulesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : geoBlockRules.length > 0 ? (
                  <div className="space-y-3">
                    {geoBlockRules.map((rule: any) => (
                      <RuleCard key={rule.ruleId} rule={rule} Icon={Globe} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8 font-mono text-xs uppercase">No active geographic blocking rules configured</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
