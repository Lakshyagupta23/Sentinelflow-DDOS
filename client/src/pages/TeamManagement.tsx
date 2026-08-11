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

  const roleColors = {
    admin: "bg-red-100 text-red-800",
    lead: "bg-blue-100 text-blue-800",
    member: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage teams with role-based access control
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Set up a new team with specific permissions and members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Team Name</Label>
                <Input
                  placeholder="e.g., Security Operations"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Team description"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Spinner /> : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : !teams || teams.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <p>No teams created yet. Create one to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => (
            <Card key={team.teamId}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {team.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      ID: {team.teamId}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {team.description && (
                    <div>
                      <p className="text-muted-foreground">Description</p>
                      <p>{team.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-2">Permissions</p>
                    <div className="flex gap-1 flex-wrap">
                      {team.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" disabled>
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
  );
}
