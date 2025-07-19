import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
}

export class SupabaseStorageService {
  private static BUCKET_NAME = 'playoff-images';

  // Upload de imagem para o Supabase Storage
  static async uploadImage(file: File, seasonId: number): Promise<UploadResult> {
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${seasonId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${this.BUCKET_NAME}/${fileName}`;

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Erro no upload para Supabase Storage:', error);
      throw error;
    }
  }

  // Deletar imagem do Supabase Storage
  static async deleteImage(filePath: string): Promise<void> {
    try {
      // Extrair o nome do arquivo do path completo
      const fileName = filePath.split('/').slice(-2).join('/'); // seasonId/filename.ext

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        throw new Error(`Erro ao deletar arquivo: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao deletar do Supabase Storage:', error);
      throw error;
    }
  }

  // Verificar se o bucket existe
  static async checkBucketExists(): Promise<boolean> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.warn('Erro ao listar buckets:', error.message);
        return false;
      }

      return buckets?.some(bucket => bucket.name === this.BUCKET_NAME) || false;
    } catch (error) {
      console.warn('Erro ao verificar bucket:', error);
      return false;
    }
  }

  // Listar imagens de uma temporada
  static async listSeasonImages(seasonId: number): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`${seasonId}/`);

      if (error) {
        throw new Error(`Erro ao listar imagens: ${error.message}`);
      }

      return data?.map(file => file.name) || [];
    } catch (error) {
      console.error('Erro ao listar imagens da temporada:', error);
      throw error;
    }
  }
} 