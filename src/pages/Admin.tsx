import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { adminInvoke } from "@/lib/adminHelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Folder, 
  CreditCard, 
  Activity, 
  Shield, 
  Search,
  RefreshCw,
  UserPlus,
  FolderPlus,
  LogOut,
  History
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleDialog, setRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate('/auth');
        return;
      }

      // Check if user has admin role
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error || !data) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setIsAdmin(true);
      await loadDashboardData();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadProfiles(),
      loadSubscriptions()
    ]);
  };


  const loadStats = async () => {
    try {
      const data = await adminInvoke('get-usage-stats');
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load statistics"
      });
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminInvoke('list-users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await adminInvoke('list-all-profiles');
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const data = await adminInvoke('list-subscriptions');
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await adminInvoke('get-audit-logs', { limit: 50 });
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      await adminInvoke('assign-role', {
        userId: selectedUser.id,
        role: selectedRole
      });

      toast({
        variant: "success",
        title: "Success",
        description: `Role ${selectedRole} assigned successfully`
      });

      setRoleDialog(false);
      await loadUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign role"
      });
    }
  };

  const handleReleaseProfile = async (profileId: string, userId: string) => {
    try {
      await adminInvoke('release-profile', { profileId, userId });
      toast({
        variant: "success",
        title: "Success",
        description: "Profile released successfully"
      });
      await loadProfiles();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to release profile"
      });
    }
  };

  const handleCreateProfile = async () => {
    try {
      await adminInvoke('create-getlate-profile', {});
      toast({
        variant: "success",
        title: "Success",
        description: "New GetLate profile created"
      });
      await loadProfiles();
      await loadStats();
    } catch (error: any) {
      console.error('Profile creation error:', error);
      
      // Extract error message from response
      let errorMessage = "Failed to create profile";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Profile Creation Failed",
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const handleAssignProfile = async () => {
    if (!selectedProfile || !selectedUserId) return;

    try {
      await adminInvoke('reassign-profile', {
        profileId: selectedProfile._id,
        toUserId: selectedUserId,
        fromUserId: selectedProfile.linkedUser?.id
      });

      toast({
        variant: "success",
        title: "Success",
        description: "Profile assigned successfully"
      });

      setAssignDialog(false);
      setSelectedProfile(null);
      setSelectedUserId("");
      await loadProfiles();
      await loadStats();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign profile"
      });
    }
  };

  const handleUpdateSubscription = async (userId: string, planType: string) => {
    try {
      await adminInvoke('update-subscription', { userId, planType });
      toast({
        variant: "success",
        title: "Success",
        description: "Subscription updated successfully"
      });
      await loadSubscriptions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription"
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.supabase?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GetLate Profiles</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.getlate?.usage?.profiles || 0}</div>
              <p className="text-xs text-muted-foreground">
                Limit: {stats?.getlate?.limits?.profiles || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked Profiles</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.supabase?.linkedProfiles || 0}</div>
              <p className="text-xs text-muted-foreground">
                Free: {stats?.supabase?.freeProfiles || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reels</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.supabase?.totalReels || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="audit" onClick={loadAuditLogs}>Audit Logs</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and roles</CardDescription>
                  </div>
                  <Button onClick={loadUsers} className="w-full sm:w-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[120px]">Username</TableHead>
                        <TableHead className="min-w-[150px]">Profile ID</TableHead>
                        <TableHead className="min-w-[100px]">Roles</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.username || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {user.getlate_profile_id ? (
                              <code className="bg-muted px-2 py-1 rounded">
                                {user.getlate_profile_id.slice(0, 8)}...
                              </code>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {user.user_roles?.map((ur: any) => (
                              <Badge key={ur.role} variant="secondary" className="mr-1">
                                {ur.role}
                              </Badge>
                            ))}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setRoleDialog(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Profile Management</CardTitle>
                    <CardDescription>Manage GetLate profiles and connections</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={handleCreateProfile} variant="default" className="w-full sm:w-auto">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Create Profile
                    </Button>
                    <Button onClick={loadProfiles} variant="outline" className="w-full sm:w-auto">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Profile ID</TableHead>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[200px]">Linked User</TableHead>
                        <TableHead className="min-w-[100px]">Accounts</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile._id}>
                          <TableCell className="font-mono text-xs">
                            <code className="bg-muted px-2 py-1 rounded">
                              {profile._id.slice(0, 8)}...
                            </code>
                          </TableCell>
                          <TableCell>{profile.name}</TableCell>
                          <TableCell>
                            <Badge variant={profile.status === 'in_use' ? 'default' : 'secondary'}>
                              {profile.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {profile.linkedUser ? profile.linkedUser.email : '-'}
                          </TableCell>
                          <TableCell>{profile.accounts?.length || 0}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {profile.linkedUser ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReleaseProfile(profile._id, profile.linkedUser.id)}
                                >
                                  Release
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedProfile(profile);
                                    setAssignDialog(true);
                                  }}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Assign
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Subscription Management</CardTitle>
                    <CardDescription>Manage user subscriptions and limits</CardDescription>
                  </div>
                  <Button onClick={loadSubscriptions} className="w-full sm:w-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">User</TableHead>
                        <TableHead className="min-w-[120px]">Plan</TableHead>
                        <TableHead className="min-w-[120px]">Posts Limit</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>{sub.profiles?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge>{sub.plan_type}</Badge>
                          </TableCell>
                          <TableCell>{sub.posts_limit}</TableCell>
                          <TableCell>
                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              onValueChange={(value) => handleUpdateSubscription(sub.user_id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Change plan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free_trial">Free Trial</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Audit Logs</CardTitle>
                    <CardDescription>View all admin actions</CardDescription>
                  </div>
                  <Button onClick={loadAuditLogs} className="w-full sm:w-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Timestamp</TableHead>
                        <TableHead className="min-w-[200px]">Admin</TableHead>
                        <TableHead className="min-w-[150px]">Action</TableHead>
                        <TableHead className="min-w-[120px]">Entity</TableHead>
                        <TableHead className="min-w-[200px]">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>{log.profiles?.email || 'System'}</TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {log.action}
                            </code>
                          </TableCell>
                          <TableCell>{log.entity_type}</TableCell>
                          <TableCell className="text-xs">
                            {log.details ? JSON.stringify(log.details).slice(0, 50) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Role Assignment Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign a role to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={setSelectedRole} value={selectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Assignment Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Profile to User</DialogTitle>
            <DialogDescription>
              Assign profile {selectedProfile?.name} to a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User</Label>
              <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => !u.getlate_profile_id)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} {user.username ? `(${user.username})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignProfile}>
              Assign Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
