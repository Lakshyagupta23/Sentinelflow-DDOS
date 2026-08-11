import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Plus, Edit2, Trash2, Mail, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function UserManagement() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Mock users data - in production, this would come from the backend
  const mockUsers = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      role: "security_analyst",
      lastSignedIn: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "devops_sre",
      lastSignedIn: new Date(Date.now() - 1 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike@example.com",
      role: "it_manager",
      lastSignedIn: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily@example.com",
      role: "admin",
      lastSignedIn: new Date(Date.now() - 30 * 60 * 1000),
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    },
  ];

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800",
    security_analyst: "bg-blue-100 text-blue-800",
    devops_sre: "bg-purple-100 text-purple-800",
    it_manager: "bg-green-100 text-green-800",
    user: "bg-gray-100 text-gray-800",
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    security_analyst: "Security Analyst",
    devops_sre: "DevOps/SRE",
    it_manager: "IT Manager",
    user: "User",
  };

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = (userId: number) => {
    toast.success(`User deleted successfully`);
  };

  const handleRoleChange = (userId: number, newRole: string) => {
    toast.success(`User role updated to ${roleLabels[newRole]}`);
  };

  // Only admins can manage users
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>Only administrators can access user management.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="w-8 h-8" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Manage platform users and their roles</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account and assign a role</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="user@example.com" className="mt-2" />
                </div>
                <div>
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" className="mt-2" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select defaultValue="user">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security_analyst">Security Analyst</SelectItem>
                      <SelectItem value="devops_sre">DevOps/SRE</SelectItem>
                      <SelectItem value="it_manager">IT Manager</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => setIsDialogOpen(false)}>
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="security_analyst">Security Analyst</SelectItem>
                  <SelectItem value="devops_sre">DevOps/SRE</SelectItem>
                  <SelectItem value="it_manager">IT Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Total platform users and their current roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Signed In</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={u.role} onValueChange={(value) => handleRoleChange(u.id, value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="security_analyst">Security Analyst</SelectItem>
                            <SelectItem value="devops_sre">DevOps/SRE</SelectItem>
                            <SelectItem value="it_manager">IT Manager</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {u.lastSignedIn.toLocaleDateString()} {u.lastSignedIn.toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {u.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
