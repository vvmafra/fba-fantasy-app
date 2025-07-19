import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { playoffImageService, PlayoffImage } from '@/services/playoffImageService';
import { SupabaseStorageService } from '@/services/supabaseStorage';
import { useQueryClient } from '@tanstack/react-query';

interface PlayoffImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  seasonId: number;
  existingImage?: PlayoffImage | null;
}

const PlayoffImageModal = ({ isOpen, onClose, seasonId, existingImage }: PlayoffImageModalProps) => {
  const [title, setTitle] = useState(existingImage?.title || '');
  const [description, setDescription] = useState(existingImage?.description || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingImage?.image_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione apenas arquivos de imagem',
          variant: 'destructive',
        });
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no máximo 5MB',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadToSupabase = async (file: File): Promise<string> => {
    try {
      // Verificar se o bucket existe
      const bucketExists = await SupabaseStorageService.checkBucketExists();
      
      if (!bucketExists) {
        // Fallback: usar base64 da imagem real
        console.warn('Bucket não configurado. Usando base64 da imagem.');
        return await convertFileToBase64(file);
      }
      
      // Fazer upload da imagem
      const result = await SupabaseStorageService.uploadImage(file, seasonId);
      
      return result.url;
    } catch (error) {
      console.error('Erro no upload:', error);
      // Fallback: usar base64 da imagem real em caso de erro
      console.warn('Erro no upload. Usando base64 da imagem.');
      return await convertFileToBase64(file);
    }
  };

  // Converter arquivo para base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };



  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Erro',
        description: 'O título é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!imageFile && !existingImage?.image_url) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = existingImage?.image_url || '';

      // Se há um novo arquivo, fazer upload
      if (imageFile) {
        imageUrl = await handleUploadToSupabase(imageFile);
      }

      if (existingImage) {
        // Atualizar imagem existente
        await playoffImageService.updatePlayoffImage(existingImage.id, {
          title,
          description,
          image_url: imageUrl,
        });
        
        toast({
          title: 'Sucesso',
          description: 'Imagem atualizada com sucesso',
        });
      } else {
        // Criar nova imagem
        await playoffImageService.createPlayoffImage({
          season_id: seasonId,
          title,
          description,
          image_url: imageUrl,
        });
        
        toast({
          title: 'Sucesso',
          description: 'Imagem enviada com sucesso',
        });
      }

      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['playoff-images', 'season', seasonId] });
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingImage) return;

    if (!confirm('Tem certeza que deseja deletar esta imagem?')) return;

    setIsLoading(true);

    try {
      await playoffImageService.deletePlayoffImage(existingImage.id);
      
      toast({
        title: 'Sucesso',
        description: 'Imagem deletada com sucesso',
      });

      queryClient.invalidateQueries({ queryKey: ['playoff-images', 'season', seasonId] });
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao deletar imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingImage ? 'Editar Imagem dos Playoffs' : 'Upload Imagem dos Playoffs'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label htmlFor="image">Imagem</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full h-48 object-contain mx-auto rounded"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon size={48} className="mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar uma imagem ou arraste aqui
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} className="mr-2" />
                    Selecionar Imagem
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Playoffs 2023-24 - Final"
              disabled={isLoading}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a imagem ou contexto dos playoffs..."
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingImage && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Deletar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
            className="bg-nba-orange hover:bg-nba-orange/90"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                {existingImage ? 'Atualizar' : 'Enviar'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlayoffImageModal; 