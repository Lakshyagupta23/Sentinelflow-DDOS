import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, Plus, Mail, Shield, Trash2, Settings, Clock } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const SAMPLE_ORGANIZATIONS = [
  {
    id: 1,
    name: "TechCorp Security",
    description: "Enterprise security operations center",
    owner: "John Doe",
    members: 12,
    status: "active",
    createdAt: "2026-01-15",
    logo: "🏢",
  },
  {
    id: 2,
    name: "FinanceGuard Inc",
    description: "Financial services DDoS protection",
    owner: "Jane Smith",
    members: 8,
    status: "active",
    createdAt: "2026-02-20",
    logo: "🏦",
  },
  {
    id: 3,
    name: "CloudDefense Labs",
    description: "Cloud infrastructure security",
    owner: "Mike Johnson",
    members: 15,
    status: "active",
    createdAt: "2026-03-10",
    logo: "☁️",
  },
];

const SAMPLE_MEMBERS = [
  { id: 1, name: "Alice Chen", email: "alice@techcorp.com", role: "admin", joinedAt: "2026-01-15" },
  { id: 2, name: "Bob Wilson", email: "bob@techcorp.com", role: "member", joinedAt: "2026-02-01" },
  { id: 3, name: "Carol Davis", email: "carol@techcorp.com", role: "member", joinedAt: "2026-02-15" },
  { id: 4, name: "David Martinez", email: "david@techcorp.com", role: "admin", joinedAt: "2026-03-01" },
];

export default function OrganizationsManagement() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState(SAMPLE_ORGANIZATIONS);
  const [selectedOrg, setSelectedOrg] = useState<(typeof SAMPLE_ORGANIZATIONS)[0] | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const handleCreateOrganization = (name: string, description: string) => {
    const newOrg = {
      id: organizations.length + 1,
      name,
      description,
      owner: user?.name || "Current User",
      members: 1,
      status: "active" as const,
      createdAt: new Date().toISOString().split("T")[0],
      logo: "🏢",
    };
    setOrganizations([...organizations, newOrg]);
    toast.success(`Organization "${name}" created successfully`);
  };

  const handleAddMember = () => {
    if (!newMemberEmail) {
      toast.error("Please enter an email address");
      return;
    }
    toast.success(`Invitation sent to ${newMemberEmail}`);
    setNewMemberEmail("");
  };

  const handleDeleteOrganization = (id: number) => {
    setOrganizations(organizations.filter((org) => org.id !== id));
    toast.success("Organization deleted");
    setSelectedOrg(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-up border-l-2 border-[#c5a880] pl-4">
          <h1 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wider mb-1">Organizations Directory</h1>
          <p className="text-xs text-muted-foreground font-mono">Manage multi-tenant operational security workspaces and team rosters</p>
        </div>

        {/* Action Button */}
        <div className="animate-fade-in-up">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none px-5 h-10">
                <Plus className="w-4 h-4 mr-1.5" />
                Create New Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-md">
              <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">Create Organization</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleCreateOrganization(
                    formData.get("name") as string,
                    formData.get("description") as string
                  );
                }}
                className="space-y-4 pt-4"
              >
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Workspace Name</label>
                  <Input
                    name="name"
                    placeholder="e.g., TechCorp Security Operations"
                    className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs mt-1 focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Operational Focus Description</label>
                  <Textarea
                    name="description"
                    placeholder="Describe your organization focus..."
                    className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs mt-1 focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none mt-2">
                  Create Organization
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="glass-card rounded-none border-[#c5a880]/15 hover:border-[#c5a880]/40 transition-all duration-300 cursor-pointer group"
              onClick={() => {
                setSelectedOrg(org);
                setShowMembers(false);
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl filter saturate-50">{org.logo}</div>
                  <Badge className="border-[#8a9a86]/30 text-[#8a9a86] bg-[#8a9a86]/5 rounded-none font-mono text-[9px] uppercase px-1.5 py-0.5">{org.status}</Badge>
                </div>

                <h3 className="font-serif text-sm uppercase tracking-wider text-[#e2e8f0] group-hover:text-[#c5a880] transition-colors mb-2">
                  {org.name}
                </h3>
                <p className="text-[10px] font-mono text-muted-foreground mb-4 min-h-[30px]">{org.description}</p>

                <div className="space-y-2 mb-6 text-xs border-t border-[#c5a880]/10 pt-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-[#c5a880]" />
                    Owner: <span className="text-[#e2e8f0]">{org.owner}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <Users className="w-3.5 h-3.5 text-[#c5a880]" />
                    Members: <span className="text-[#e2e8f0]">{org.members}</span>
                  </div>
                </div>

                <Button
                  className="w-full border border-[#c5a880]/30 bg-transparent hover:bg-[#c5a880]/5 text-[#c5a880] rounded-none font-mono text-[10px] uppercase h-8 mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrg(org);
                    setShowMembers(true);
                  }}
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Manage Roster
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Organization Details Modal */}
        {selectedOrg && !showMembers && (
          <Dialog open={!!selectedOrg && !showMembers} onOpenChange={() => setSelectedOrg(null)}>
            <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-2xl">
              <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm flex items-center gap-2">
                  <span className="text-xl">{selectedOrg.logo}</span>
                  {selectedOrg.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Operational Summary</p>
                  <p className="text-xs font-mono text-[#e2e8f0]">{selectedOrg.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Owner</p>
                    <p className="text-xs font-mono text-[#e2e8f0] mt-0.5">{selectedOrg.owner}</p>
                  </div>
                  <div className="p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Members</p>
                    <p className="text-xs font-mono text-[#e2e8f0] mt-0.5">{selectedOrg.members}</p>
                  </div>
                  <div className="p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Status</p>
                    <Badge className="border-[#8a9a86]/30 text-[#8a9a86] bg-[#8a9a86]/5 rounded-none font-mono text-[8px] uppercase mt-1">
                      {selectedOrg.status}
                    </Badge>
                  </div>
                  <div className="p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Created</p>
                    <p className="text-xs font-mono text-[#e2e8f0] mt-0.5">{selectedOrg.createdAt}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button
                    className="flex-1 bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none h-10"
                    onClick={() => setShowMembers(true)}
                  >
                    <Users className="w-4 h-4 mr-1.5" />
                    Manage Members Roster
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#e05a5a]/30 hover:bg-[#e05a5a]/5 text-[#e05a5a] rounded-none font-mono text-[10px] uppercase h-10 px-5 gap-2"
                    onClick={() => handleDeleteOrganization(selectedOrg.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Decommission
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Members Management Modal */}
        {selectedOrg && showMembers && (
          <Dialog open={!!selectedOrg && showMembers} onOpenChange={() => setShowMembers(false)}>
            <DialogContent className="bg-[#13151a] border-[#c5a880]/20 rounded-none max-w-2xl">
              <DialogHeader className="border-b border-[#c5a880]/10 pb-4">
                <DialogTitle className="font-serif text-[#c5a880] uppercase tracking-wider text-sm">Manage Roster - {selectedOrg.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Add Member Section */}
                <div className="p-4 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Invite Team Member</p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter team member email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="rounded-none bg-[#13151a]/20 border-[#c5a880]/15 font-mono text-xs flex-1 focus-visible:ring-1 focus-visible:ring-[#c5a880]"
                    />
                    <Button
                      className="bg-[#c5a880] text-[#0d0e12] hover:bg-[#b09670] font-mono text-xs uppercase tracking-wider rounded-none px-4"
                      onClick={handleAddMember}
                    >
                      <Mail className="w-4 h-4 mr-1.5" />
                      Invite
                    </Button>
                  </div>
                </div>

                {/* Members List */}
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Active Operational Roster</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {SAMPLE_MEMBERS.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-[#13151a]/30 border border-[#c5a880]/10 rounded-none hover:border-[#c5a880]/30 transition-all duration-300"
                      >
                        <div>
                          <p className="font-serif text-xs uppercase tracking-wider text-[#e2e8f0]">{member.name}</p>
                          <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="border-[#c5a880]/35 text-[#c5a880] bg-[#c5a880]/5 rounded-none font-mono text-[8px] uppercase">
                            {member.role}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#e05a5a] hover:bg-[#e05a5a]/5 rounded-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
