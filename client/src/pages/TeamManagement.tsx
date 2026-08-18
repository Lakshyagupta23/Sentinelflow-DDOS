import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Users, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";

export function TeamManagement() {
  const [organizationId] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

  const { data: teams, isLoading, refetch } = trpc.teams.list.useQuery(
    { organizationId },
    { enabled: organizationId > 0 }
  );

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowDialog(false);
      setTeamName("");
      setTeamDescription("");
    },
  });

  const handleCreate = async () => {
    if (!teamName) {
      alert("Team name is required");
      return;
    }

    await createMutation.mutateAsync({
      organizationId,
      name: teamName,
      permissions: ["view_attacks", "manage_alerts", "execute_playbooks"],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Team Roster</h1>
              <p className="text-xs text-muted-foreground font-mono">Create and manage operational security groups and role permissions</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none px-5 h-10">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-md animate-fade-in">
                <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                  <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">Create Tactical Team</DialogTitle>
                  <DialogDescription className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                    Set up a new operational security team with role access controls
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Team Designation</Label>
                    <Input
                      placeholder="e.g., Security Operations Center"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Scope Description</Label>
                    <Input
                      placeholder="Tactical operations scope"
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                    />
                  </div>
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none mt-2">
                    {createMutation.isPending ? <Spinner /> : "Create Team"}
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
        ) : !teams || teams.length === 0 ? (
          <Card className="glass-card rounded-none border-[#c5a880]/15">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                <AlertCircle className="w-4 h-4 text-[#c5a880]" />
                <p>No operational teams registered. Create a team to delegate access.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {teams.map((team) => (
              <Card key={team.teamId} className="glass-card rounded-none border-[#c5a880]/15">
                <CardHeader className="border-b border-[#c5a880]/10 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-serif uppercase tracking-wider text-[#c5a880] flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {team.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-mono text-muted-foreground mt-1">
                        Tactical ID Key: {team.teamId}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 font-mono text-xs text-[#e2e8f0]">
                  <div className="space-y-4">
                    {team.description && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Team Scope description</p>
                        <p className="text-[#e2e8f0] mt-0.5">{team.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-2">Assigned Permissions Roster</p>
                      <div className="flex gap-2 flex-wrap">
                        {team.permissions.map((perm) => (
                          <Badge key={perm} className="border-[#c5a880]/30 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-[#c5a880]/10">
                      <Button size="sm" className="border border-[#c5a880]/10 bg-transparent text-muted-foreground rounded-none font-mono text-[9px] uppercase h-8 px-4 opacity-50 cursor-not-allowed" disabled>
                        Manage Members (Coming Soon)
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
