import React, { useState, useMemo } from 'react';
import { Calendar, ChevronRight, AlertTriangle, CheckCircle, Clock, ChevronUp, ChevronDown, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useSeasons, useAdvanceToNextSeason, useGoBackToPreviousSeason } from '@/hooks/useSeasons';
import { useActiveLeagueCap, useCurrentLeagueAverageCap, useCreateLeagueCap, useLastLeagueCap } from '@/hooks/useLeagueCap';
import { Season } from '@/services/seasonService';

const SeasonsPage = () => {
  const { isAdmin } = useAuth();
  
  // Buscar temporadas da API
  const { data: seasonsResponse, isLoading, error } = useSeasons();
  const advanceSeasonMutation = useAdvanceToNextSeason();
  const goBackSeasonMutation = useGoBackToPreviousSeason();

  // Buscar dados do CAP
  const { data: activeLeagueCapResponse } = useActiveLeagueCap();
  const { data: currentAverageCapResponse } = useCurrentLeagueAverageCap();
  const { data: lastLeagueCapResponse } = useLastLeagueCap();
  const createLeagueCapMutation = useCreateLeagueCap();

  // Estados para os modais
  const [nextSeasonModalOpen, setNextSeasonModalOpen] = useState(false);
  const [goBackSeasonModalOpen, setGoBackSeasonModalOpen] = useState(false);
  const [newCapModalOpen, setNewCapModalOpen] = useState(false);
  const [newCapData, setNewCapData] = useState({
    min_cap: '',
    max_cap: ''
  });

  // Estados para ordenação
  const [sortField, setSortField] = useState<'season_number' | 'year'>('season_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Se não for admin, redireciona
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const seasons = seasonsResponse?.data || [];
  const activeSeason = seasons.find(season => season.is_active);
  const nextSeason = activeSeason ? seasons.find(season => season.season_number === activeSeason.season_number + 1) : null;

  // Ordenar temporadas
  const sortedSeasons = useMemo(() => {
    return seasons.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'season_number':
          aValue = a.season_number;
          bValue = b.season_number;
          break;
        case 'year':
          aValue = a.year;
          bValue = b.year;
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
  }, [seasons, sortField, sortDirection]);

  const handleSort = (field: 'season_number' | 'year') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'season_number' | 'year') => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const getSeasonStatus = (season: Season) => {
    if (season.is_active) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Ativa</Badge>;
    }
    
    if (activeSeason && season.season_number < activeSeason.season_number) {
      return <Badge variant="outline" className="text-gray-600">Concluída</Badge>;
    }
    
    return <Badge variant="outline" className="text-gray-500">Inativa</Badge>;
  };

  const getSeasonIcon = (season: Season) => {
    if (season.is_active) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    if (activeSeason && season.season_number < activeSeason.season_number) {
      return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
    
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const handleNextSeason = () => {
    setNextSeasonModalOpen(true);
  };

  const handleGoBackSeason = () => {
    setGoBackSeasonModalOpen(true);
  };

  const handleNewCap = () => {
    const currentAverage = currentAverageCapResponse?.data?.average_cap || 0;
    const lastCap = lastLeagueCapResponse?.data?.[0]; // Primeiro da lista (mais recente)

    console.log(currentAverage);
    console.log(lastCap);
    
    let minCap = lastCap?.min_cap || 0;
    let maxCap = lastCap?.max_cap || 0;
    
    // Se há um CAP anterior, calcular sugestão baseada na variação do CAP médio
    if (lastCap && lastCap.avg_cap > 0) {
      const capIncreasePercentage = ((currentAverage - lastCap.avg_cap) / lastCap.avg_cap);
      
      const newMinCap = minCap * (1 + capIncreasePercentage);
      const newMaxCap = maxCap * (1 + capIncreasePercentage);

      minCap = Math.ceil(newMinCap);
      maxCap = Math.ceil(newMaxCap);
    }
    
    setNewCapData({
      min_cap: minCap.toString(),
      max_cap: maxCap.toString()
    });
    setNewCapModalOpen(true);
  };

  const handleCreateNewCap = () => {
    if (!activeSeason || !newCapData.min_cap || !newCapData.max_cap) return;

    const data = {
      season_id: activeSeason.id,
      min_cap: parseInt(newCapData.min_cap),
      max_cap: parseInt(newCapData.max_cap)
    };

    createLeagueCapMutation.mutate(data, {
      onSuccess: () => {
        setNewCapModalOpen(false);
        setNewCapData({ min_cap: '', max_cap: '' });
      }
    });
  };

  const confirmNextSeason = () => {
    advanceSeasonMutation.mutate(undefined, {
      onSuccess: () => setNextSeasonModalOpen(false),
    });
  };

  const confirmGoBackSeason = () => {
    goBackSeasonMutation.mutate(undefined, {
      onSuccess: () => {
        setGoBackSeasonModalOpen(false);
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nba-orange"></div>
          <span className="ml-2 text-gray-600">Carregando temporadas...</span>
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
            <p className="text-red-600 font-medium">Erro ao carregar temporadas</p>
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
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-nba-orange" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Temporadas</h1>
          <p className="text-gray-600">Gerencie as temporadas da liga</p>
        </div>
      </div>

      {/* Card da Temporada Atual */}
      {activeSeason && (
        <Card className="border-2 border-nba-orange/20 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-nba-orange text-xl">
              <CheckCircle className="h-5 w-5" />
              Temporada Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Temporada {activeSeason.season_number}
              </h2>
              <p className="text-lg text-gray-600">
                {activeSeason.year}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChevronRight className="h-5 w-5 text-nba-orange" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleNextSeason}
              disabled={!nextSeason || advanceSeasonMutation.isPending}
              className="bg-nba-orange hover:bg-nba-orange/90 flex-1"
            >
              {advanceSeasonMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Avançando...
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Avançar para Próxima Temporada
                </>
              )}
            </Button>
            <Button 
              onClick={handleGoBackSeason}
              disabled={!activeSeason || activeSeason.season_number <= 1 || goBackSeasonMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {goBackSeasonMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Voltando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Voltar Temporada
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card do CAP Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-nba-orange" />
              CAP da Liga
            </div>
            <Button 
              onClick={handleNewCap}
              size="sm"
              className="bg-nba-orange hover:bg-nba-orange/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo CAP
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeLeagueCapResponse?.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {activeLeagueCapResponse.data.min_cap}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">CAP Mínimo</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {activeLeagueCapResponse.data.max_cap}
                  </div>
                  <div className="text-sm text-green-700 font-medium">CAP Máximo</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {activeLeagueCapResponse.data.avg_cap}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">CAP Médio (quando criado)</div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-600">
                <span className="font-medium">Criado para:</span> Temporada {activeLeagueCapResponse.data.season_number} ({activeLeagueCapResponse.data.year})
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum CAP configurado para a temporada atual</p>
              <Button 
                onClick={handleNewCap}
                className="bg-nba-orange hover:bg-nba-orange/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Configurar CAP
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Todas as Temporadas */}
      <Card>
        <CardHeader>
          <CardTitle className="hidden md:block">Todas as Temporadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('season_number')}
                  >
                    <div className="flex items-center gap-2">
                      Temporada
                      {getSortIcon('season_number')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('year')}
                  >
                    <div className="flex items-center gap-2">
                      Ano
                      {getSortIcon('year')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSeasons.map((season) => (
                  <TableRow key={season.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getSeasonIcon(season)}
                        Temporada {season.season_number}
                      </div>
                    </TableCell>
                    <TableCell>{season.year}</TableCell>
                    <TableCell>
                      {getSeasonStatus(season)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação - Próxima Temporada */}
      <Dialog open={nextSeasonModalOpen} onOpenChange={setNextSeasonModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar Avanço de Temporada
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja avançar para a próxima temporada?
              <br />
              <strong>Próxima temporada:</strong> Temporada {nextSeason?.season_number} ({nextSeason?.year})
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNextSeasonModalOpen(false)}
              disabled={advanceSeasonMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmNextSeason} 
              disabled={advanceSeasonMutation.isPending}
              className="bg-nba-orange hover:bg-nba-orange/90"
            >
              {advanceSeasonMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirmando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Voltar Temporada */}
      <Dialog open={goBackSeasonModalOpen} onOpenChange={setGoBackSeasonModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar Volta de Temporada
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja voltar para a temporada anterior?
              <br />
              <strong>Temporada anterior:</strong> Temporada {activeSeason ? activeSeason.season_number - 1 : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setGoBackSeasonModalOpen(false)}
              disabled={goBackSeasonMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmGoBackSeason} 
              disabled={goBackSeasonMutation.isPending}
              className="bg-nba-orange hover:bg-nba-orange/90"
            >
              {goBackSeasonMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirmando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Criar Novo CAP */}
      <Dialog open={newCapModalOpen} onOpenChange={setNewCapModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-nba-orange" />
              Configurar Novo CAP
            </DialogTitle>
            <DialogDescription>
              Configure os limites mínimo e máximo do CAP para a temporada atual.
              <br />
              <span className="text-sm text-gray-500">
                💡 <strong>Dica:</strong> Os valores são baseados no CAP médio atual da liga.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="min_cap">CAP Mínimo</Label>
              <Input
                id="min_cap"
                type="number"
                value={newCapData.min_cap}
                onChange={(e) => setNewCapData(prev => ({ ...prev, min_cap: e.target.value }))}
                placeholder="Ex: 643"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_cap">CAP Máximo</Label>
              <Input
                id="max_cap"
                type="number"
                value={newCapData.max_cap}
                onChange={(e) => setNewCapData(prev => ({ ...prev, max_cap: e.target.value }))}
                placeholder="Ex: 683"
                min="0"
              />
            </div>

            {currentAverageCapResponse?.data?.average_cap && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>CAP Médio Atual:</strong> {currentAverageCapResponse.data.average_cap}
                </div>
                {lastLeagueCapResponse?.data?.[0] && (
                  <div className="text-xs text-gray-500 mt-1">
                    <strong>Variação desde último CAP:</strong> {(() => {
                      const lastCap = lastLeagueCapResponse.data[0];
                      const variation = ((currentAverageCapResponse.data.average_cap - lastCap.avg_cap) / lastCap.avg_cap) * 100;
                      return `${variation > 0 ? '+' : ''}${variation.toFixed(2)}%`;
                    })()}
                  </div>
                )}
              </div>
            )}

            {newCapData.min_cap && newCapData.max_cap && parseInt(newCapData.min_cap) >= parseInt(newCapData.max_cap) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-600">
                  ⚠️ O CAP máximo deve ser maior que o CAP mínimo
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewCapModalOpen(false)}
              disabled={createLeagueCapMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateNewCap} 
              disabled={
                !newCapData.min_cap || 
                !newCapData.max_cap || 
                parseInt(newCapData.min_cap) >= parseInt(newCapData.max_cap) ||
                createLeagueCapMutation.isPending
              }
              className="bg-nba-orange hover:bg-nba-orange/90"
            >
              {createLeagueCapMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                'Criar CAP'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeasonsPage; 