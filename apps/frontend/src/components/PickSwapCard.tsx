import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowRight } from 'lucide-react';
import { PickSwapWithDetails } from '@/services/pickSwapService';
import { useDeletePickSwap } from '@/hooks/usePickSwaps';

interface PickSwapCardProps {
  swap: PickSwapWithDetails;
  isOwner?: boolean;
  onDelete?: () => void;
}

export const PickSwapCard: React.FC<PickSwapCardProps> = ({ 
  swap, 
  isOwner = false,
  onDelete 
}) => {
  const deletePickSwap = useDeletePickSwap();

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja deletar este pick swap?')) {
      try {
        await deletePickSwap.mutateAsync(swap.id);
        onDelete?.();
      } catch (error) {
        console.error('Erro ao deletar pick swap:', error);
      }
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Badge variant={swap.swap_type === 'best' ? 'default' : 'secondary'}>
              {swap.swap_type === 'best' ? 'Melhor Pick' : 'Pior Pick'}
            </Badge>
            <span>Pick Swap</span>
          </CardTitle>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deletePickSwap.isPending}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pick A */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-700">Pick A</h4>
              <p className="text-lg font-bold">
                {swap.pick_a.year} - {swap.pick_a.round}ª Rodada
              </p>
              <p className="text-sm text-gray-600">
                {swap.pick_a.original_team_name} ({swap.pick_a.original_team_abbreviation})
              </p>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
          </div>

          {/* Pick B */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-700">Pick B</h4>
              <p className="text-lg font-bold">
                {swap.pick_b.year} - {swap.pick_b.round}ª Rodada
              </p>
              <p className="text-sm text-gray-600">
                {swap.pick_b.original_team_name} ({swap.pick_b.original_team_abbreviation})
              </p>
            </div>
          </div>

          {/* Owner */}
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Proprietário:</span> {swap.owned_by_team.name} ({swap.owned_by_team.abbreviation})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Criado em: {new Date(swap.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 