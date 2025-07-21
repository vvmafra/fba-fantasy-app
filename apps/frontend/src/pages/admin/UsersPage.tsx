import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Edit, Trash2, Loader2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useUsers, useDeleteUser, useUpdateUser, useCreateUser } from '@/hooks/useUsers';
import { User } from '@/services/userService';

const UsersPage = () => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Buscar usuários da API
  const { data: usersResponse, isLoading, error } = useUsers({ sortBy: 'id', sortOrder: 'asc', limit: 1000 });

  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();
  const createUserMutation = useCreateUser();
  
  const users = usersResponse?.data || [];

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; email: string; role: 'admin' | 'user' }>({
    name: '',
    email: '',
    role: 'user',
  });

  // Estados para o modal de adicionar usuário
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState<{ name: string; email: string; role: 'admin' | 'user' }>({
    name: '',
    email: '',
    role: 'user',
  });

  // Estados para ordenação
  const [sortField, setSortField] = useState<'id' | 'name' | 'email' | 'role'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Se não for admin, redireciona (AdminLayout já faz essa verificação, mas mantemos como segurança extra)
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Filtrar e ordenar usuários
  const filteredAndSortedUsers = useMemo(() => {
    // Primeiro filtrar
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Depois ordenar
    return filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
      }

      // Comparar valores
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Comparar strings
      const comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [users, searchTerm, sortField, sortDirection]);

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="secondary" className="bg-nba-orange text-white">Admin</Badge>;
    }
    return <Badge variant="outline">Usuário</Badge>;
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSaveEdit = (userId: number) => {
    updateUserMutation.mutate(
      { id: userId, data: editForm },
      {
        onSuccess: () => setEditingUserId(null),
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleAddUser = () => {
    setAddUserModalOpen(true);
  };

  const handleSubmitAddUser = () => {
    createUserMutation.mutate(addUserForm, {
      onSuccess: () => {
        setAddUserModalOpen(false);
        setAddUserForm({ name: '', email: '', role: 'user' });
      },
    });
  };

  const handleCancelAddUser = () => {
    setAddUserModalOpen(false);
    setAddUserForm({ name: '', email: '', role: 'user' });
  };

  const handleSort = (field: 'id' | 'name' | 'email' | 'role') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'id' | 'name' | 'email' | 'role') => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-nba-orange" />
          <span className="ml-2 text-gray-600">Carregando usuários...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 font-medium">Erro ao carregar usuários</p>
            <p className="text-red-500 text-sm mt-2">
              {error.message || 'Tente novamente mais tarde'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-nba-orange" />
          <div>
            <h1 className="text-lg font-bold text-nba-dark sm:text-2xl md:text-3xl">Gerenciamento de Usuários</h1>
            {/* <p className="text-gray-600 hidden md:block">Gerencie todos os usuários da liga</p> */}
          </div>
        </div>
        <Button onClick={handleAddUser} className="bg-nba-orange hover:bg-nba-orange/90">
          <Plus className="h-4 w-4 mr-2" />Usuário
        </Button>
      </div>

      {/* Card principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="hidden md:block">Lista de Usuários</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-[80px] cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-2">
                      ID
                      {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Nome
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="w-[120px] cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-2">
                      Função
                      {getSortIcon('role')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <Input
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full"
                          />
                        ) : (
                          user.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <Input
                            value={editForm.email}
                            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                            className="w-full"
                          />
                        ) : (
                          user.email
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.id ? (
                          <select
                            value={editForm.role}
                            onChange={e => setEditForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                            className="border rounded px-2 py-1"
                          >
                            <option value="admin">Admin</option>
                            <option value="user">Usuário</option>
                          </select>
                        ) : (
                          getRoleBadge(user.role)
                        )}
                      </TableCell>
                      <TableCell>
                        {/* Data de criação, pode deixar igual */}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingUserId === user.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveEdit(user.id)}
                                disabled={updateUserMutation.isPending}
                              >
                                Salvar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={deleteUserMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                {deleteUserMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar usuário */}
      <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-nba-orange" />
              Adicionar Novo Usuário
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={addUserForm.name}
                onChange={(e) => setAddUserForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Digite o nome do usuário"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={addUserForm.email}
                onChange={(e) => setAddUserForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Digite o email do usuário"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={addUserForm.role}
                onValueChange={(value) => setAddUserForm(f => ({ ...f, role: value as 'admin' | 'user' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancelAddUser}
              disabled={createUserMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitAddUser}
              disabled={createUserMutation.isPending || !addUserForm.name || !addUserForm.email}
              className="bg-nba-orange hover:bg-nba-orange/90"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage; 