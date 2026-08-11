import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, Plus, Mail, Shield, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-cyan-400" />
            Organizations
          </h1>
          <p className="text-slate-400">Manage multi-tenant organizations and team access</p>
        </div>

        {/* Create Organization Button */}
        <div className="mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Organization</DialogTitle>
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
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-slate-300">Organization Name</label>
                  <Input
                    name="name"
                    placeholder="e.g., TechCorp Security"
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <Textarea
                    name="description"
                    placeholder="Describe your organization..."
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                  Create Organization
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-cyan-500 transition-all duration-300 cursor-pointer group"
              onClick={() => {
                setSelectedOrg(org);
                setShowMembers(false);
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{org.logo}</div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50">{org.status}</Badge>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">
                  {org.name}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{org.description}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Owner: {org.owner}
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-cyan-400" />
                    {org.members} members
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2"
                  onClick={() => {
                    setSelectedOrg(org);
                    setShowMembers(true);
                  }}
                >
                  <Users className="w-4 h-4" />
                  Manage Members
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Organization Details Modal */}
        {selectedOrg && !showMembers && (
          <Dialog open={!!selectedOrg && !showMembers} onOpenChange={() => setSelectedOrg(null)}>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <span className="text-2xl">{selectedOrg.logo}</span>
                  {selectedOrg.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Description</p>
                  <p className="text-white">{selectedOrg.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                    <p className="text-xs text-slate-400">Owner</p>
                    <p className="text-white font-medium">{selectedOrg.owner}</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                    <p className="text-xs text-slate-400">Members</p>
                    <p className="text-white font-medium">{selectedOrg.members}</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                    <p className="text-xs text-slate-400">Status</p>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50 mt-1">
                      {selectedOrg.status}
                    </Badge>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                    <p className="text-xs text-slate-400">Created</p>
                    <p className="text-white font-medium">{selectedOrg.createdAt}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2"
                    onClick={() => setShowMembers(true)}
                  >
                    <Users className="w-4 h-4" />
                    Manage Members
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
                    onClick={() => handleDeleteOrganization(selectedOrg.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Members Management Modal */}
        {selectedOrg && showMembers && (
          <Dialog open={!!selectedOrg && showMembers} onOpenChange={() => setShowMembers(false)}>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Manage Members - {selectedOrg.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Add Member Section */}
                <div className="p-4 bg-slate-700/50 rounded border border-slate-600">
                  <p className="text-sm font-medium text-white mb-3">Add Team Member</p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white flex-1"
                    />
                    <Button
                      className="bg-cyan-500 hover:bg-cyan-600 text-white gap-2"
                      onClick={handleAddMember}
                    >
                      <Mail className="w-4 h-4" />
                      Invite
                    </Button>
                  </div>
                </div>

                {/* Members List */}
                <div>
                  <p className="text-sm font-medium text-white mb-3">Team Members</p>
                  <div className="space-y-2">
                    {SAMPLE_MEMBERS.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded border border-slate-600"
                      >
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                            {member.role}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
