import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { deadlineService, Deadline } from '@/services/deadlineService';
import { useToast } from '@/hooks/use-toast';

interface DeadlineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  deadline: Deadline | null;
  onSuccess: () => void;
}

const DeadlineEditModal: React.FC<DeadlineEditModalProps> = ({
  isOpen,
  onClose,
  deadline,
  onSuccess
}) => {
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (deadline) {
      setDeadlineDate(deadline.deadline_date);
      setDeadlineTime(deadline.deadline_time.substring(0, 5)); // Remove segundos
    }
  }, [deadline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deadline) return;

    setLoading(true);
    try {
      await deadlineService.updateDeadline(deadline.id, {
        deadline_date: deadlineDate,
        deadline_time: deadlineTime + ':00' // Adiciona segundos
      });

      toast({
        title: "Deadline atualizado",
        description: "O deadline foi atualizado com sucesso.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar deadline:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o deadline. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Deadline</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deadline-date">Data</Label>
            <Input
              id="deadline-date"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline-time">Horário</Label>
            <Input
              id="deadline-time"
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeadlineEditModal; 