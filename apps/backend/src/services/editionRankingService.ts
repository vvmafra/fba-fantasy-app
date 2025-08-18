import pool from '../utils/postgresClient.js';

export interface EditionRankingTeam {
  team_id: number;
  team_name: string;
  team_abbreviation: string;
  owner_name?: string | null;
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
      WITH standings AS (
        SELECT 
          ts.team_id,
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
          COUNT(DISTINCT ts.season_id) as seasons_count,
          COUNT(CASE WHEN ts.elimination_round = 5 THEN 1 END) as championships,
          COUNT(CASE WHEN ts.elimination_round >= 4 THEN 1 END) as finals_appearances,
          COUNT(CASE WHEN ts.elimination_round >= 3 THEN 1 END) as conference_finals,
          COUNT(CASE WHEN ts.elimination_round > 0 THEN 1 END) as playoff_appearances
        FROM team_standings ts
        GROUP BY ts.team_id
      ),
      awards AS (
        SELECT 
          team_id,
          COUNT(*) as awards_points
        FROM (
          SELECT sa.mvp_team_id as team_id FROM season_awards sa WHERE sa.mvp_team_id IS NOT NULL
          UNION ALL SELECT sa.roy_team_id FROM season_awards sa WHERE sa.roy_team_id IS NOT NULL
          UNION ALL SELECT sa.smoy_team_id FROM season_awards sa WHERE sa.smoy_team_id IS NOT NULL
          UNION ALL SELECT sa.dpoy_team_id FROM season_awards sa WHERE sa.dpoy_team_id IS NOT NULL
          UNION ALL SELECT sa.mip_team_id FROM season_awards sa WHERE sa.mip_team_id IS NOT NULL
          UNION ALL SELECT sa.coy_team_id FROM season_awards sa WHERE sa.coy_team_id IS NOT NULL
        ) x
        GROUP BY team_id
      )
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        u.name as owner_name,
        COALESCE(s.standings_points, 0) + COALESCE(a.awards_points, 0) as total_points,
        COALESCE(s.standings_points, 0) as standings_points,
        COALESCE(a.awards_points, 0) as awards_points,
        COALESCE(s.seasons_count, 0) as seasons_count,
        COALESCE(s.championships, 0) as championships,
        COALESCE(s.finals_appearances, 0) as finals_appearances,
        COALESCE(s.conference_finals, 0) as conference_finals,
        COALESCE(s.playoff_appearances, 0) as playoff_appearances
      FROM teams t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN standings s ON s.team_id = t.id
      LEFT JOIN awards a ON a.team_id = t.id
      ORDER BY total_points DESC, championships DESC, finals_appearances DESC, conference_finals DESC
    `);

    return rows.map(row => ({
      team_id: row.team_id,
      team_name: row.team_name,
      team_abbreviation: row.team_abbreviation,
      owner_name: row.owner_name,
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
      WITH standings AS (
        SELECT 
          ts.team_id,
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
          1 as seasons_count,
          COUNT(CASE WHEN ts.elimination_round = 5 THEN 1 END) as championships,
          COUNT(CASE WHEN ts.elimination_round >= 4 THEN 1 END) as finals_appearances,
          COUNT(CASE WHEN ts.elimination_round >= 3 THEN 1 END) as conference_finals,
          COUNT(CASE WHEN ts.elimination_round > 0 THEN 1 END) as playoff_appearances
        FROM team_standings ts
        WHERE ts.season_id = $1
        GROUP BY ts.team_id
      ),
      awards AS (
        SELECT 
          team_id,
          COUNT(*) as awards_points
        FROM (
          SELECT sa.mvp_team_id as team_id FROM season_awards sa WHERE sa.season_id = $1 AND sa.mvp_team_id IS NOT NULL
          UNION ALL SELECT sa.roy_team_id FROM season_awards sa WHERE sa.season_id = $1 AND sa.roy_team_id IS NOT NULL
          UNION ALL SELECT sa.smoy_team_id FROM season_awards sa WHERE sa.season_id = $1 AND sa.smoy_team_id IS NOT NULL
          UNION ALL SELECT sa.dpoy_team_id FROM season_awards sa WHERE sa.season_id = $1 AND sa.dpoy_team_id IS NOT NULL
          UNION ALL SELECT sa.mip_team_id FROM season_awards sa WHERE sa.season_id = $1 AND sa.mip_team_id IS NOT NULL
          UNION ALL SELECT sa.coy_team_id FROM season_awards sa WHERE sa.season_id = $1 AND sa.coy_team_id IS NOT NULL
        ) x
        GROUP BY team_id
      )
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        u.name as owner_name,
        COALESCE(s.standings_points, 0) + COALESCE(a.awards_points, 0) as total_points,
        COALESCE(s.standings_points, 0) as standings_points,
        COALESCE(a.awards_points, 0) as awards_points,
        COALESCE(s.seasons_count, 0) as seasons_count,
        COALESCE(s.championships, 0) as championships,
        COALESCE(s.finals_appearances, 0) as finals_appearances,
        COALESCE(s.conference_finals, 0) as conference_finals,
        COALESCE(s.playoff_appearances, 0) as playoff_appearances
      FROM teams t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN standings s ON s.team_id = t.id
      LEFT JOIN awards a ON a.team_id = t.id
      WHERE COALESCE(s.standings_points, 0) > 0 OR COALESCE(a.awards_points, 0) > 0
      ORDER BY total_points DESC, championships DESC, finals_appearances DESC, conference_finals DESC
    `, [seasonId]);

    return rows.map(row => ({
      team_id: row.team_id,
      team_name: row.team_name,
      team_abbreviation: row.team_abbreviation,
      owner_name: row.owner_name,
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
      WITH standings AS (
        SELECT 
          ts.team_id,
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
          COUNT(DISTINCT ts.season_id) as seasons_count,
          COUNT(CASE WHEN ts.elimination_round = 5 THEN 1 END) as championships,
          COUNT(CASE WHEN ts.elimination_round >= 4 THEN 1 END) as finals_appearances,
          COUNT(CASE WHEN ts.elimination_round >= 3 THEN 1 END) as conference_finals,
          COUNT(CASE WHEN ts.elimination_round > 0 THEN 1 END) as playoff_appearances
        FROM team_standings ts
        WHERE ts.team_id = $1
        GROUP BY ts.team_id
      ),
      awards AS (
        SELECT 
          team_id,
          COUNT(*) as awards_points
        FROM (
          SELECT sa.mvp_team_id as team_id FROM season_awards sa WHERE sa.mvp_team_id = $1
          UNION ALL SELECT sa.roy_team_id FROM season_awards sa WHERE sa.roy_team_id = $1
          UNION ALL SELECT sa.smoy_team_id FROM season_awards sa WHERE sa.smoy_team_id = $1
          UNION ALL SELECT sa.dpoy_team_id FROM season_awards sa WHERE sa.dpoy_team_id = $1
          UNION ALL SELECT sa.mip_team_id FROM season_awards sa WHERE sa.mip_team_id = $1
          UNION ALL SELECT sa.coy_team_id FROM season_awards sa WHERE sa.coy_team_id = $1
        ) x
        GROUP BY team_id
      )
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        u.name as owner_name,
        COALESCE(s.standings_points, 0) + COALESCE(a.awards_points, 0) as total_points,
        COALESCE(s.standings_points, 0) as standings_points,
        COALESCE(a.awards_points, 0) as awards_points,
        COALESCE(s.seasons_count, 0) as seasons_count,
        COALESCE(s.championships, 0) as championships,
        COALESCE(s.finals_appearances, 0) as finals_appearances,
        COALESCE(s.conference_finals, 0) as conference_finals,
        COALESCE(s.playoff_appearances, 0) as playoff_appearances
      FROM teams t
      LEFT JOIN users u ON t.owner_id = u.id
      LEFT JOIN standings s ON s.team_id = t.id
      LEFT JOIN awards a ON a.team_id = t.id
      WHERE t.id = $1
    `, [teamId]);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      team_id: row.team_id,
      team_name: row.team_name,
      team_abbreviation: row.team_abbreviation,
      owner_name: row.owner_name,
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