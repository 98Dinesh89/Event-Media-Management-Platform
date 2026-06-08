CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_members (
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'photographer', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;

INSERT INTO clubs (name, description, created_by)
SELECT 'MediaVault Club', 'Default club for existing events and users', u.id
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'MediaVault Club')
ORDER BY u.created_at ASC
LIMIT 1

UPDATE events
SET club_id = (SELECT id FROM clubs ORDER BY created_at ASC LIMIT 1)
WHERE club_id IS NULL;

INSERT INTO club_members (club_id, user_id, role)
SELECT
  (SELECT id FROM clubs ORDER BY created_at ASC LIMIT 1),
  u.id,
  CASE
    WHEN u.role IN ('admin', 'photographer', 'member', 'viewer') THEN u.role
    ELSE 'viewer'
  END
FROM users u
WHERE EXISTS (SELECT 1 FROM clubs)
ON CONFLICT (club_id, user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
