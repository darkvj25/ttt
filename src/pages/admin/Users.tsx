import React, { useState, useEffect } from 'react';
import { PosCard } from '@/components/ui/pos-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User,
  Shield,
  Eye,
  EyeOff,
  Save,
  X,
  UserCheck,
  UserX
} from 'lucide-react';
import { userStorage, User as UserType } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'cashier' as 'admin' | 'cashier',
    isActive: true
  });

  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = () => {
    const allUsers = userStorage.getAll();
    setUsers(allUsers);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      role: 'cashier',
      isActive: true
    });
    setEditingUser(null);
  };

  const handleAddUser = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      confirmPassword: '',
      role: user.role,
      isActive: user.isActive
    });
    setShowDialog(true);
  };

  const handleDeleteUser = (user: UserType) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Cannot delete",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      const success = userStorage.delete(user.id);
      if (success) {
        loadUsers();
        toast({
          title: "User deleted",
          description: `${user.username} has been removed`,
        });
      }
    }
  };

  const toggleUserStatus = (user: UserType) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Cannot deactivate",
        description: "You cannot deactivate your own account",
        variant: "destructive",
      });
      return;
    }

    const success = userStorage.update(user.id, { isActive: !user.isActive });
    if (success) {
      loadUsers();
      toast({
        title: user.isActive ? "User deactivated" : "User activated",
        description: `${user.username} is now ${user.isActive ? 'inactive' : 'active'}`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username) {
      toast({
        title: "Missing username",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "Missing password",
        description: "Please enter a password for new users",
        variant: "destructive",
      });
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please confirm your password correctly",
        variant: "destructive",
      });
      return;
    }

    const userData: Partial<UserType> = {
      username: formData.username,
      role: formData.role,
      isActive: formData.isActive
    };

    if (formData.password) {
      userData.password = formData.password;
    }

    try {
      if (editingUser) {
        // Check if username is being changed and if it already exists
        if (editingUser.username !== formData.username) {
          const existingUser = users.find(u => u.username === formData.username && u.id !== editingUser.id);
          if (existingUser) {
            toast({
              title: "Username already exists",
              description: "Please choose a different username",
              variant: "destructive",
            });
            return;
          }
        }

        const success = userStorage.update(editingUser.id, userData);
        if (success) {
          toast({
            title: "User updated",
            description: `${userData.username} has been updated`,
          });
        }
      } else {
        // Check if username already exists
        const existingUser = users.find(u => u.username === formData.username);
        if (existingUser) {
          toast({
            title: "Username already exists",
            description: "Please choose a different username",
            variant: "destructive",
          });
          return;
        }
        
        userStorage.add({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive
        });
        
        toast({
          title: "User created",
          description: `${formData.username} has been created`,
        });
      }
      
      loadUsers();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save user",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? Shield : User;
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="secondary" className="bg-primary-light text-primary">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline">
        <User className="h-3 w-3 mr-1" />
        Cashier
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users and their permissions
          </p>
        </div>
        <Button onClick={handleAddUser} className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <PosCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by username or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline">
              Total: {users.length}
            </Badge>
            <Badge variant="secondary">
              Active: {users.filter(u => u.isActive).length}
            </Badge>
            <Badge variant="destructive">
              Admins: {users.filter(u => u.role === 'admin').length}
            </Badge>
          </div>
        </div>
      </PosCard>

      {/* Users Table */}
      <PosCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2">User</th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Created</th>
                <th className="text-center py-3 px-2">Status</th>
                <th className="text-center py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const isCurrentUser = user.id === currentUser?.id;
                
                return (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-2">
                        <div className="bg-primary-light p-2 rounded-full">
                          <RoleIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.username}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {user.isActive ? (
                          <UserCheck className="h-4 w-4 text-success" />
                        ) : (
                          <UserX className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserStatus(user)}
                          disabled={isCurrentUser}
                          className="h-8 w-8 p-0"
                        >
                          {user.isActive ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={isCurrentUser}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive disabled:text-muted-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No users found' : 'No users yet'}
              </p>
            </div>
          )}
        </div>
      </PosCard>

      {/* Add/Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and permissions' : 'Create a new system user'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'cashier') => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Cashier</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingUser ? '(leave blank to keep current)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required={!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password {editingUser && !formData.password ? '' : '*'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                required={!editingUser || formData.password !== ''}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active User</Label>
            </div>

            <DialogFooter className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;