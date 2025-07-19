import pool from '../utils/postgresClient.js';

export interface EditionRankingTeam {
  team_id: number;
  team_name: string;
  team_abbreviation: string;
  total_points: number;
  standings_points: number;
  awards_points: number;
  seasons_count: number;
  championships: number;
  finals_appearances: number;
  conference_finals: number;
  playoff_appearances: number;
}

export class EditionRankingService {
  // Calcular ranking de edição para todos os times
  static async getEditionRanking(): Promise<EditionRankingTeam[]> {
    const { rows } = await pool.query(`
      WITH team_points AS (
        SELECT 
          t.id as team_id,
          t.name as team_name,
          t.abbreviation as team_abbreviation,
          -- Pontos dos standings
          COALESCE(SUM(
            CASE 
              WHEN ts.seed = 1 THEN 4
              WHEN ts.seed BETWEEN 2 AND 4 THEN 3
              WHEN ts.seed BETWEEN 5 AND 8 THEN 2
              ELSE 0
            END +
            CASE 
              WHEN ts.elimination_round = 1 THEN 1
              WHEN ts.elimination_round = 2 THEN 3
              WHEN ts.elimination_round = 3 THEN 6
              WHEN ts.elimination_round = 4 THEN 8
              WHEN ts.elimination_round = 5 THEN 13
              ELSE 0
            END
          ), 0) as standings_points,
          -- Pontos dos awards
          COALESCE(SUM(
            CASE WHEN sa.mvp_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.roy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.smoy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.dpoy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.mip_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.coy_team_id = t.id THEN 1 ELSE 0 END
          ), 0) as awards_points,
          -- Estatísticas
          COUNT(DISTINCT ts.season_id) as seasons_count,
          COUNT(CASE WHEN ts.elimination_round = 5 THEN 1 END) as championships,
          COUNT(CASE WHEN ts.elimination_round >= 4 THEN 1 END) as finals_appearances,
          COUNT(CASE WHEN ts.elimination_round >= 3 THEN 1 END) as conference_finals,
          COUNT(CASE WHEN ts.elimination_round > 0 THEN 1 END) as playoff_appearances
        FROM teams t
        LEFT JOIN team_standings ts ON t.id = ts.team_id
        LEFT JOIN season_awards sa ON t.id IN (
          sa.mvp_team_id, 
          sa.roy_team_id, 
          sa.smoy_team_id, 
          sa.dpoy_team_id, 
          sa.mip_team_id, 
          sa.coy_team_id
        )
        GROUP BY t.id, t.name, t.abbreviation
      )
      SELECT 
        team_id,
        team_name,
        team_abbreviation,
        standings_points + awards_points as total_points,
        standings_points,
        awards_points,
        seasons_count,
        championships,
        finals_appearances,
        conference_finals,
        playoff_appearances
      FROM team_points
      ORDER BY total_points DESC, championships DESC, finals_appearances DESC, conference_finals DESC
    `);

    return rows.map(row => ({
      team_id: row.team_id,
      team_name: row.team_name,
      team_abbreviation: row.team_abbreviation,
      total_points: parseInt(row.total_points),
      standings_points: parseInt(row.standings_points),
      awards_points: parseInt(row.awards_points),
      seasons_count: parseInt(row.seasons_count),
      championships: parseInt(row.championships),
      finals_appearances: parseInt(row.finals_appearances),
      conference_finals: parseInt(row.conference_finals),
      playoff_appearances: parseInt(row.playoff_appearances)
    }));
  }

  // Calcular ranking de edição por temporada específica
  static async getEditionRankingBySeason(seasonId: number): Promise<EditionRankingTeam[]> {
    const { rows } = await pool.query(`
      WITH team_points AS (
        SELECT 
          t.id as team_id,
          t.name as team_name,
          t.abbreviation as team_abbreviation,
          -- Pontos dos standings para a temporada específica
          COALESCE(SUM(
            CASE 
              WHEN ts.seed = 1 THEN 4
              WHEN ts.seed BETWEEN 2 AND 4 THEN 3
              WHEN ts.seed BETWEEN 5 AND 8 THEN 2
              ELSE 0
            END +
            CASE 
              WHEN ts.elimination_round = 1 THEN 1
              WHEN ts.elimination_round = 2 THEN 3
              WHEN ts.elimination_round = 3 THEN 6
              WHEN ts.elimination_round = 4 THEN 8
              WHEN ts.elimination_round = 5 THEN 13
              ELSE 0
            END
          ), 0) as standings_points,
          -- Pontos dos awards para a temporada específica
          COALESCE(SUM(
            CASE WHEN sa.mvp_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.roy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.smoy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.dpoy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.mip_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.coy_team_id = t.id THEN 1 ELSE 0 END
          ), 0) as awards_points,
          -- Estatísticas para a temporada específica
          1 as seasons_count,
          COUNT(CASE WHEN ts.elimination_round = 5 THEN 1 END) as championships,
          COUNT(CASE WHEN ts.elimination_round >= 4 THEN 1 END) as finals_appearances,
          COUNT(CASE WHEN ts.elimination_round >= 3 THEN 1 END) as conference_finals,
          COUNT(CASE WHEN ts.elimination_round > 0 THEN 1 END) as playoff_appearances
        FROM teams t
        LEFT JOIN team_standings ts ON t.id = ts.team_id AND ts.season_id = $1
        LEFT JOIN season_awards sa ON t.id IN (
          sa.mvp_team_id, 
          sa.roy_team_id, 
          sa.smoy_team_id, 
          sa.dpoy_team_id, 
          sa.mip_team_id, 
          sa.coy_team_id
        ) AND sa.season_id = $1
        GROUP BY t.id, t.name, t.abbreviation
      )
      SELECT 
        team_id,
        team_name,
        team_abbreviation,
        standings_points + awards_points as total_points,
        standings_points,
        awards_points,
        seasons_count,
        championships,
        finals_appearances,
        conference_finals,
        playoff_appearances
      FROM team_points
      WHERE standings_points > 0 OR awards_points > 0
      ORDER BY total_points DESC, championships DESC, finals_appearances DESC, conference_finals DESC
    `, [seasonId]);

    return rows.map(row => ({
      team_id: row.team_id,
      team_name: row.team_name,
      team_abbreviation: row.team_abbreviation,
      total_points: parseInt(row.total_points),
      standings_points: parseInt(row.standings_points),
      awards_points: parseInt(row.awards_points),
      seasons_count: parseInt(row.seasons_count),
      championships: parseInt(row.championships),
      finals_appearances: parseInt(row.finals_appearances),
      conference_finals: parseInt(row.conference_finals),
      playoff_appearances: parseInt(row.playoff_appearances)
    }));
  }

  // Buscar ranking de um time específico
  static async getTeamEditionRanking(teamId: number): Promise<EditionRankingTeam | null> {
    const { rows } = await pool.query(`
      WITH team_points AS (
        SELECT 
          t.id as team_id,
          t.name as team_name,
          t.abbreviation as team_abbreviation,
          -- Pontos dos standings
          COALESCE(SUM(
            CASE 
              WHEN ts.seed = 1 THEN 4
              WHEN ts.seed BETWEEN 2 AND 4 THEN 3
              WHEN ts.seed BETWEEN 5 AND 8 THEN 2
              ELSE 0
            END +
            CASE 
              WHEN ts.elimination_round = 1 THEN 1
              WHEN ts.elimination_round = 2 THEN 3
              WHEN ts.elimination_round = 3 THEN 6
              WHEN ts.elimination_round = 4 THEN 8
              WHEN ts.elimination_round = 5 THEN 13
              ELSE 0
            END
          ), 0) as standings_points,
          -- Pontos dos awards
          COALESCE(SUM(
            CASE WHEN sa.mvp_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.roy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.smoy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.dpoy_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.mip_team_id = t.id THEN 1 ELSE 0 END +
            CASE WHEN sa.coy_team_id = t.id THEN 1 ELSE 0 END
          ), 0) as awards_points,
          -- Estatísticas
          COUNT(DISTINCT ts.season_id) as seasons_count,
          COUNT(CASE WHEN ts.elimination_round = 5 THEN 1 END) as championships,
          COUNT(CASE WHEN ts.elimination_round >= 4 THEN 1 END) as finals_appearances,
          COUNT(CASE WHEN ts.elimination_round >= 3 THEN 1 END) as conference_finals,
          COUNT(CASE WHEN ts.elimination_round > 0 THEN 1 END) as playoff_appearances
        FROM teams t
        LEFT JOIN team_standings ts ON t.id = ts.team_id
        LEFT JOIN season_awards sa ON t.id IN (
          sa.mvp_team_id, 
          sa.roy_team_id, 
          sa.smoy_team_id, 
          sa.dpoy_team_id, 
          sa.mip_team_id, 
          sa.coy_team_id
        )
        WHERE t.id = $1
        GROUP BY t.id, t.name, t.abbreviation
      )
      SELECT 
        team_id,
        team_name,
        team_abbreviation,
        standings_points + awards_points as total_points,
        standings_points,
        awards_points,
        seasons_count,
        championships,
        finals_appearances,
        conference_finals,
        playoff_appearances
      FROM team_points
    `, [teamId]);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      team_id: row.team_id,
      team_name: row.team_name,
      team_abbreviation: row.team_abbreviation,
      total_points: parseInt(row.total_points),
      standings_points: parseInt(row.standings_points),
      awards_points: parseInt(row.awards_points),
      seasons_count: parseInt(row.seasons_count),
      championships: parseInt(row.championships),
      finals_appearances: parseInt(row.finals_appearances),
      conference_finals: parseInt(row.conference_finals),
      playoff_appearances: parseInt(row.playoff_appearances)
    };
  }
} 