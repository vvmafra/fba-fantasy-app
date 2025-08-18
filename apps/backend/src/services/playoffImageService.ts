import pool from '../utils/postgresClient.js';

export interface PlayoffImage {
  id: number;
  season_id: number;
  image_url: string;
  title: string;
  description?: string;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlayoffImageRequest {
  season_id: number;
  image_url: string;
  title: string;
  description?: string;
  uploaded_by: number;
}

export interface UpdatePlayoffImageRequest {
  image_url?: string;
  title?: string;
  description?: string;
}

export class PlayoffImageService {
  // Buscar todas as imagens de playoffs
  static async getAllPlayoffImages(): Promise<PlayoffImage[]> {
    const { rows } = await pool.query(`
      SELECT 
        pi.*,
        s.season_number,
        s.year,
        u.name as uploader_name
      FROM playoff_images pi
      JOIN seasons s ON pi.season_id = s.id
      JOIN users u ON pi.uploaded_by = u.id
      ORDER BY pi.season_id DESC, pi.created_at DESC
    `);
    
    return rows;
  }

  // Buscar imagem de playoffs por temporada
  static async getPlayoffImageBySeason(seasonId: number): Promise<PlayoffImage | null> {
    const { rows } = await pool.query(`
      SELECT 
        pi.*,
        s.season_number,
        s.year,
        u.name as uploader_name
      FROM playoff_images pi
      JOIN seasons s ON pi.season_id = s.id
      JOIN users u ON pi.uploaded_by = u.id
      WHERE pi.season_id = $1
      ORDER BY pi.created_at DESC
      LIMIT 1
    `, [seasonId]);
    
    return rows[0] || null;
  }

  // Buscar imagem de playoffs por ID
  static async getPlayoffImageById(id: number): Promise<PlayoffImage | null> {
    const { rows } = await pool.query(`
      SELECT 
        pi.*,
        s.season_number,
        s.year,
        u.name as uploader_name
      FROM playoff_images pi
      JOIN seasons s ON pi.season_id = s.id
      JOIN users u ON pi.uploaded_by = u.id
      WHERE pi.id = $1
    `, [id]);
    
    return rows[0] || null;
  }

  // Criar nova imagem de playoffs
  static async createPlayoffImage(data: CreatePlayoffImageRequest): Promise<PlayoffImage> {
    const { rows } = await pool.query(`
      INSERT INTO playoff_images (season_id, image_url, title, description, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [data.season_id, data.image_url, data.title, data.description, data.uploaded_by]);
    
    return rows[0];
  }

  // Atualizar imagem de playoffs
  static async updatePlayoffImage(id: number, data: UpdatePlayoffImageRequest): Promise<PlayoffImage> {
    const fields = [];
    const values = [];
    let idx = 1;
    
    if (data.image_url !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(data.image_url);
    }
    if (data.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    
    if (fields.length === 0) throw new Error('Nenhum campo para atualizar');
    
            fields.push(`updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo')`);
    values.push(id);
    
    const sql = `UPDATE playoff_images SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await pool.query(sql, values);
    
    if (rows.length === 0) {
      throw new Error('Imagem de playoffs não encontrada');
    }
    
    return rows[0];
  }

  // Deletar imagem de playoffs
  static async deletePlayoffImage(id: number): Promise<void> {
    const { rows } = await pool.query('DELETE FROM playoff_images WHERE id = $1 RETURNING id', [id]);
    
    if (rows.length === 0) {
      throw new Error('Imagem de playoffs não encontrada');
    }
  }

  // Buscar ou criar imagem de playoffs para uma temporada
  static async getOrCreatePlayoffImage(seasonId: number, uploaderId: number): Promise<PlayoffImage> {
    let image = await this.getPlayoffImageBySeason(seasonId);
    
    if (!image) {
      // Criar nova imagem vazia para a temporada
      image = await this.createPlayoffImage({
        season_id: seasonId,
        image_url: '',
        title: `Playoffs - Temporada ${seasonId}`,
        description: '',
        uploaded_by: uploaderId
      });
    }
    
    return image;
  }

  // Limpar imagens com URLs inválidas
  static async cleanupInvalidImages(): Promise<number> {
    const { rowCount } = await pool.query(`
      DELETE FROM playoff_images 
      WHERE image_url LIKE '%via.placeholder.com%'
    `);
    
    return rowCount || 0;
  }
} 