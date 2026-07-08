-- Create custom types
CREATE TYPE fixture_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Create Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Fixtures Table
CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status fixture_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT players_must_be_different CHECK (player1_id != player2_id)
);

-- Create Results Table
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE UNIQUE,
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_fixtures_date ON fixtures(date);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_player1_id ON fixtures(player1_id);
CREATE INDEX idx_fixtures_player2_id ON fixtures(player2_id);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- Players: Public Read
CREATE POLICY "Players are viewable by everyone" ON players
    FOR SELECT USING (true);

-- Players: Admin Full CRUD
CREATE POLICY "Admins can insert players" ON players
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update players" ON players
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete players" ON players
    FOR DELETE USING (auth.role() = 'authenticated');

-- Fixtures: Public Read
CREATE POLICY "Fixtures are viewable by everyone" ON fixtures
    FOR SELECT USING (true);

-- Fixtures: Admin Full CRUD
CREATE POLICY "Admins can insert fixtures" ON fixtures
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update fixtures" ON fixtures
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete fixtures" ON fixtures
    FOR DELETE USING (auth.role() = 'authenticated');

-- Results: Public Read
CREATE POLICY "Results are viewable by everyone" ON results
    FOR SELECT USING (true);

-- Results: Admin Full CRUD
CREATE POLICY "Admins can insert results" ON results
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update results" ON results
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete results" ON results
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create Standings View
CREATE OR REPLACE VIEW standings AS
WITH player_stats AS (
    SELECT
        p.id AS player_id,
        p.name AS player_name,
        p.avatar AS player_avatar,
        COUNT(r.id) AS matches_played,
        SUM(CASE WHEN r.player1_score > r.player2_score AND f.player1_id = p.id THEN 1
                 WHEN r.player2_score > r.player1_score AND f.player2_id = p.id THEN 1
                 ELSE 0 END) AS wins,
        SUM(CASE WHEN r.player1_score = r.player2_score AND (f.player1_id = p.id OR f.player2_id = p.id) THEN 1
                 ELSE 0 END) AS draws,
        SUM(CASE WHEN r.player1_score < r.player2_score AND f.player1_id = p.id THEN 1
                 WHEN r.player2_score < r.player1_score AND f.player2_id = p.id THEN 1
                 ELSE 0 END) AS losses,
        SUM(CASE WHEN f.player1_id = p.id THEN r.player1_score
                 WHEN f.player2_id = p.id THEN r.player2_score
                 ELSE 0 END) AS goals_for,
        SUM(CASE WHEN f.player1_id = p.id THEN r.player2_score
                 WHEN f.player2_id = p.id THEN r.player1_score
                 ELSE 0 END) AS goals_against
    FROM players p
    LEFT JOIN fixtures f ON (f.player1_id = p.id OR f.player2_id = p.id) AND f.status = 'completed'
    LEFT JOIN results r ON r.fixture_id = f.id
    GROUP BY p.id, p.name, p.avatar
)
SELECT
    player_id,
    player_name,
    player_avatar,
    COALESCE(matches_played, 0)::bigint AS matches_played,
    COALESCE(wins, 0)::bigint AS wins,
    COALESCE(draws, 0)::bigint AS draws,
    COALESCE(losses, 0)::bigint AS losses,
    COALESCE(goals_for, 0)::bigint AS goals_for,
    COALESCE(goals_against, 0)::bigint AS goals_against,
    COALESCE((goals_for - goals_against), 0)::bigint AS goal_difference,
    COALESCE((wins * 3 + draws * 1), 0)::bigint AS points
FROM player_stats
ORDER BY points DESC, goal_difference DESC, goals_for DESC, player_name ASC;
