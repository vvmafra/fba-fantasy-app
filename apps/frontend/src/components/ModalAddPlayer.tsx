import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeams } from '@/hooks/useTeams';
import { useCreatePlayer } from '@/hooks/usePlayers';
import { CreatePlayerData } from '@/services/playerService';
import { Loader2, X } from 'lucide-react';

interface ModalAddPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  teamId?: number;
}

const ModalAddPlayer: React.FC<ModalAddPlayerProps> = ({ isOpen, onClose, teamId }) => {
  // Buscar todos os times
  const { data: teamsResponse, isLoading: teamsLoading } = useTeams();
  const teams = teamsResponse?.data || [];
  
  // Hook para criar jogador
  const createPlayerMutation = useCreatePlayer(teamId);
  
  // Estado do formulário
  const [formData, setFormData] = useState<CreatePlayerData>({
    name: '',
    position: 'PG',
    age: 20,
    ovr: 70,
    team_id: teamId || null,
    source: 'manual'
  });

  // Estado para posição secundária
  const [secondaryPosition, setSecondaryPosition] = useState<string>('none');

  // Função para lidar com mudança na posição secundária
  const handleSecondaryPositionChange = (value: string) => {
    // Não permitir que a posição secundária seja igual à principal
    if (value === formData.position) {
      return;
    }
    setSecondaryPosition(value);
  };

  // Função para lidar com mudanças no formulário
  const handleInputChange = (field: keyof CreatePlayerData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Se a posição principal mudou e é igual à secundária, limpar a secundária
    if (field === 'position' && secondaryPosition === value) {
      setSecondaryPosition('none');
    }
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    // Combinar posições se houver posição secundária
    const finalPosition = secondaryPosition && secondaryPosition !== 'none'
      ? `${formData.position}/${secondaryPosition}`
      : formData.position;

    const playerData = {
      name: formData.name,
      position: finalPosition,
      age: formData.age,
      ovr: formData.ovr,
      team_id: formData.team_id,
      source: formData.source
    };
    
    createPlayerMutation.mutate(playerData, {
      onSuccess: () => {
        // Resetar formulário
        setFormData({
          name: '',
          position: 'PG',
          age: 20,
          ovr: 70,
          team_id: teamId || null,
          source: 'manual'
        });
        setSecondaryPosition('none');
        onClose();
      }
    });
  };

  // Função para fechar o modal
  const handleClose = () => {
    if (!createPlayerMutation.isPending) {
      setFormData({
        name: '',
        position: 'PG',
        age: 20,
        ovr: 70,
        team_id: teamId || null,
        source: 'manual'
      });
      setSecondaryPosition('none');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Adicionar Jogador</span>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={createPlayerMutation.isPending}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Jogador */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Jogador *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome do jogador"
              required
              disabled={createPlayerMutation.isPending}
            />
          </div>

          {/* Posições */}
          <div className="grid grid-cols-2 gap-4">
            {/* Posição Principal */}
            <div className="space-y-2">
              <Label htmlFor="position">Posição Principal *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleInputChange('position', value)}
                disabled={createPlayerMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Posição principal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PG">PG - Point Guard</SelectItem>
                  <SelectItem value="SG">SG - Shooting Guard</SelectItem>
                  <SelectItem value="SF">SF - Small Forward</SelectItem>
                  <SelectItem value="PF">PF - Power Forward</SelectItem>
                  <SelectItem value="C">C - Center</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Posição Secundária */}
            <div className="space-y-2">
              <Label htmlFor="secondaryPosition">Posição Secundária</Label>
              <Select
                value={secondaryPosition}
                onValueChange={handleSecondaryPositionChange}
                disabled={createPlayerMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Posição secundária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="PG" disabled={formData.position === 'PG'}>PG - Point Guard</SelectItem>
                  <SelectItem value="SG" disabled={formData.position === 'SG'}>SG - Shooting Guard</SelectItem>
                  <SelectItem value="SF" disabled={formData.position === 'SF'}>SF - Small Forward</SelectItem>
                  <SelectItem value="PF" disabled={formData.position === 'PF'}>PF - Power Forward</SelectItem>
                  <SelectItem value="C" disabled={formData.position === 'C'}>C - Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Idade */}
          <div className="space-y-2">
            <Label htmlFor="age">Idade *</Label>
            <Input
              id="age"
              type="number"
              min="17"
              max="50"
              value={formData.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 20)}
              placeholder="20"
              required
              disabled={createPlayerMutation.isPending}
            />
          </div>

          {/* Overall */}
          <div className="space-y-2">
            <Label htmlFor="ovr">Overall (OVR) *</Label>
            <Input
              id="ovr"
              type="number"
              min="0"
              max="99"
              value={formData.ovr}
              onChange={(e) => handleInputChange('ovr', parseInt(e.target.value) || 70)}
              placeholder="70"
              required
              disabled={createPlayerMutation.isPending}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="team">Time</Label>
            <Select
              value={formData.team_id?.toString() || 'none'}
              onValueChange={(value) => handleInputChange('team_id', value === 'none' ? null : parseInt(value))}
              disabled={createPlayerMutation.isPending || teamsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={teamsLoading ? "Carregando times..." : "Selecione um time (opcional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem time (Free Agent)</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name} ({team.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createPlayerMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPlayerMutation.isPending || !formData.name.trim()}
            >
              {createPlayerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Jogador'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalAddPlayer;