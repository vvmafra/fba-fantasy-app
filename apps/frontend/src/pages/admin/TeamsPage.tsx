import React, { useState, useMemo } from 'react';
import { Shield, Plus, Search, Edit, Trash2, Loader2, Users, ChevronUp, ChevronDown } from 'lucide-react';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTeams, useDeleteTeam, useUpdateTeam } from '@/hooks/useTeams';
import { useUsers } from '@/hooks/useUsers';
import { Team } from '@/services/teamService';
import { User } from '@/services/userService';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TeamsPage = () => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Buscar times da API
  const { data: teamsResponse, isLoading, error } = useTeams();
  
  // Buscar usuários para o dropdown de proprietários
  const { data: usersResponse } = useUsers({ sortBy: 'name', sortOrder: 'asc', limit: 1000 });

  const deleteTeamMutation = useDeleteTeam();
  const updateTeamMutation = useUpdateTeam();
  
  const teams = teamsResponse?.data || [];
  const users = usersResponse?.data || [];

  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ 
    name: string; 
    abbreviation: string; 
    conference: string;
    owner_id: number | null;
  }>({
    name: '',
    abbreviation: '',
    conference: '',
    owner_id: null,
  });

  // Estados para os dropdowns
  const [ownerOpen, setOwnerOpen] = useState(false);

  // Estados para ordenação
  const [sortField, setSortField] = useState<'name' | 'abbreviation' | 'conference' | 'owner_name'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Se não for admin, redireciona
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Filtrar e ordenar times
  const filteredAndSortedTeams = useMemo(() => {
    // Primeiro filtrar
    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.conference && team.conference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (team.owner_name && team.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Depois ordenar
    return filtered.sort((a, b) => {
      let aValue: string | null = null;
      let bValue: string | null = null;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'abbreviation':
          aValue = a.abbreviation;
          bValue = b.abbreviation;
          break;
        case 'conference':
          aValue = a.conference;
          bValue = b.conference;
          break;
        case 'owner_name':
          aValue = a.owner_name;
          bValue = b.owner_name;
          break;
      }

      // Tratar valores nulos
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null) return sortDirection === 'asc' ? -1 : 1;

      // Comparar strings
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [teams, searchTerm, sortField, sortDirection]);

  const getConferenceBadge = (conference: string | null) => {
    if (!conference) return <Badge variant="outline">Não definida</Badge>;
    
    if (conference === 'east') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Leste</Badge>;
    }
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Oeste</Badge>;
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditForm({ 
      name: team.name, 
      abbreviation: team.abbreviation, 
      conference: team.conference || '',
      owner_id: team.owner_id
    });
  };

  const handleSaveEdit = (teamId: number) => {
    updateTeamMutation.mutate(
      { id: teamId, data: editForm },
      {
        onSuccess: () => setEditingTeamId(null),
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
  };

  const handleDeleteTeam = (teamId: number) => {
    if (confirm('Tem certeza que deseja deletar este time?')) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const handleAddTeam = () => {
    // TODO: Implementar adição
  };

  const handleSort = (field: 'name' | 'abbreviation' | 'conference' | 'owner_name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'abbreviation' | 'conference' | 'owner_name') => {
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
          <span className="ml-2 text-gray-600">Carregando times...</span>
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
            <p className="text-red-600 font-medium">Erro ao carregar times</p>
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
          <Shield className="h-8 w-8 text-nba-orange" />
          <div>
            <h1 className="text-lg font-bold text-nba-dark sm:text-2xl md:text-3xl">Gerenciamento de Times</h1>
            {/* <p className="text-gray-600">Gerencie todos os times da liga</p> */}
          </div>
        </div>
        {/* 
        FUTURE FEATURE
        <Button onClick={handleAddTeam} className="bg-nba-orange hover:bg-nba-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Time
        </Button> */}
      </div>

      {/* Card principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="hidden md:block">Lista de Times</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar times..."
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
                  <TableHead className="w-[80px]">Logo</TableHead>
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
                    className="w-[100px] cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('abbreviation')}
                  >
                    <div className="flex items-center gap-2">
                      Abreviação
                      {getSortIcon('abbreviation')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="w-[120px] cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('conference')}
                  >
                    <div className="flex items-center gap-2">
                      Conferência
                      {getSortIcon('conference')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('owner_name')}
                  >
                    <div className="flex items-center gap-2">
                      Proprietário
                      {getSortIcon('owner_name')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum time encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        {team.logo_path ? (
                          <img 
                            src={`/images/${team.logo_path}`} 
                            alt={`Logo ${team.name}`}
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                            <Shield className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTeamId === team.id ? (
                          <Input
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full"
                          />
                        ) : (
                          team.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTeamId === team.id ? (
                          <Input
                            value={editForm.abbreviation}
                            onChange={e => setEditForm(f => ({ ...f, abbreviation: e.target.value }))}
                            className="w-full"
                            maxLength={3}
                          />
                        ) : (
                          team.abbreviation
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTeamId === team.id ? (
                          <Select
                            value={editForm.conference}
                            onValueChange={(value) => setEditForm(f => ({ ...f, conference: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="east">Leste</SelectItem>
                              <SelectItem value="west">Oeste</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getConferenceBadge(team.conference)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTeamId === team.id ? (
                          <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={ownerOpen}
                                className="w-full justify-between"
                              >
                                {editForm.owner_id
                                  ? users.find((user) => user.id === editForm.owner_id)?.name
                                  : "Selecione um proprietário..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Pesquisar usuário..." />
                                <CommandList>
                                  <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      onSelect={() => {
                                        setEditForm(f => ({ ...f, owner_id: null }));
                                        setOwnerOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !editForm.owner_id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      Sem proprietário
                                    </CommandItem>
                                    {users.map((user) => (
                                      <CommandItem
                                        key={user.id}
                                        onSelect={() => {
                                          setEditForm(f => ({ ...f, owner_id: user.id }));
                                          setOwnerOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            editForm.owner_id === user.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {user.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          team.owner_name || 'Sem proprietário'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingTeamId === team.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveEdit(team.id)}
                                disabled={updateTeamMutation.isPending}
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
                                onClick={() => handleEditTeam(team)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTeam(team.id)}
                                disabled={deleteTeamMutation.isPending}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                {deleteTeamMutation.isPending ? (
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
    </div>
  );
};

export default TeamsPage; 