-- ============================================================
-- COMPLETE DATABASE SETUP — v2 (safe for existing databases)
-- Determined AI Growth Pilot — All Tables & Schema
--
-- ✅ Safe to run on a database that already has some tables
-- ✅ Uses ALTER TABLE to add missing columns to existing tables
-- ✅ RLS helper functions use auth.jwt() email (not user_id)
--    so they work even if user_id column doesn't exist yet
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. WORKSPACES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS workspaces (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT now(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  status           TEXT DEFAULT 'onboarding',
  plan             TEXT DEFAULT 'starter',
  billing_status   TEXT DEFAULT 'trial',
  owner_email      TEXT,
  assigned_pm      TEXT,
  assigned_admin   TEXT,
  assigned_support TEXT,
  logo_url         TEXT,
  industry         TEXT,
  website          TEXT,
  notes            TEXT
);

-- Add any columns that might be missing from an older schema
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS logo_url        TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS industry        TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS website         TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS assigned_pm     TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS assigned_admin  TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS assigned_support TEXT;

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 2. WORKSPACE_USERS  (RBAC — adds role + user_id columns)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS workspace_users (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID,
  user_email   TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'User',
  status       TEXT DEFAULT 'active',
  invited_by   TEXT
);

-- Safely add columns that may not exist in the old table
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS user_id    UUID;
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS invited_by TEXT;
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS status     TEXT DEFAULT 'active';

-- Add the RBAC role column — this is the critical new column
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'User';

-- Add the check constraint only if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspace_users_role_check'
  ) THEN
    ALTER TABLE workspace_users
      ADD CONSTRAINT workspace_users_role_check
      CHECK (role IN ('Admin', 'Manager', 'User'));
  END IF;
END $$;

-- Backfill: any existing rows with NULL role get 'User'
UPDATE workspace_users SET role = 'User' WHERE role IS NULL;

-- Make role NOT NULL now that all rows are filled
ALTER TABLE workspace_users ALTER COLUMN role SET NOT NULL;
ALTER TABLE workspace_users ALTER COLUMN role SET DEFAULT 'User';

ALTER TABLE workspace_users ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 3. WORKSPACE_INTEGRATIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS workspace_integrations (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT now(),
  workspace_id   UUID,
  workspace_name TEXT,
  type           TEXT NOT NULL,
  label          TEXT,
  status         TEXT DEFAULT 'active',
  api_key        TEXT,
  api_secret     TEXT,
  account_id     TEXT,
  extra_field_1  TEXT,
  extra_field_2  TEXT,
  notes          TEXT,
  last_synced_at TIMESTAMPTZ
);

ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS workspace_name  TEXT;
ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS extra_field_1   TEXT;
ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS extra_field_2   TEXT;
ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS last_synced_at  TIMESTAMPTZ;
ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS notes           TEXT;

ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 4. CAMPAIGNS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaigns (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID,
  name         TEXT NOT NULL,
  platform     TEXT,
  status       TEXT DEFAULT 'active',
  budget       NUMERIC DEFAULT 0,
  spend        NUMERIC DEFAULT 0,
  impressions  BIGINT DEFAULT 0,
  clicks       BIGINT DEFAULT 0,
  conversions  BIGINT DEFAULT 0,
  revenue      NUMERIC DEFAULT 0,
  start_date   DATE,
  end_date     DATE,
  objective    TEXT,
  notes        TEXT
);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS revenue    NUMERIC DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS objective  TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notes      TEXT;

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 5. CREATIVES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS creatives (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID,
  campaign_id  UUID,
  name         TEXT,
  type         TEXT,
  status       TEXT DEFAULT 'draft',
  headline     TEXT,
  body_copy    TEXT,
  cta          TEXT,
  image_url    TEXT,
  video_url    TEXT,
  platform     TEXT,
  notes        TEXT
);

ALTER TABLE creatives ADD COLUMN IF NOT EXISTS body_copy  TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS cta        TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS video_url  TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS notes      TEXT;

ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 6. REPORTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS reports (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID,
  name         TEXT NOT NULL,
  type         TEXT,
  date_range   JSONB,
  filters      JSONB,
  metrics      JSONB,
  data         JSONB,
  status       TEXT DEFAULT 'draft',
  shared_with  TEXT[],
  notes        TEXT
);

ALTER TABLE reports ADD COLUMN IF NOT EXISTS shared_with  TEXT[];
ALTER TABLE reports ADD COLUMN IF NOT EXISTS notes        TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS data         JSONB;

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 7. NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID,
  user_email   TEXT,
  title        TEXT NOT NULL,
  message      TEXT,
  type         TEXT DEFAULT 'info',
  is_read      BOOLEAN DEFAULT false,
  action_url   TEXT,
  metadata     JSONB
);

-- NOTE: user_id is optional — we use user_email for matching
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_email   TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url   TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata     JSONB;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 8. SCHEDULED_ACTIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scheduled_actions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID,
  campaign_id  UUID,
  action_type  TEXT,
  scheduled_at TIMESTAMPTZ,
  executed_at  TIMESTAMPTZ,
  status       TEXT DEFAULT 'pending',
  payload      JSONB,
  notes        TEXT
);

ALTER TABLE scheduled_actions ADD COLUMN IF NOT EXISTS payload  JSONB;
ALTER TABLE scheduled_actions ADD COLUMN IF NOT EXISTS notes    TEXT;

ALTER TABLE scheduled_actions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 9. SUPPORT_TICKETS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS support_tickets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now(),
  workspace_id UUID,
  user_email   TEXT,
  subject      TEXT,
  message      TEXT,
  status       TEXT DEFAULT 'open',
  priority     TEXT DEFAULT 'normal',
  assigned_to  TEXT,
  resolution   TEXT
);

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority   TEXT DEFAULT 'normal';

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- 10. ACTIVITY_LOG  (NEW — audit trail from workspace wizard)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT now(),
  workspace_id    UUID,
  user_email      TEXT,
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  details         TEXT,
  platform_action BOOLEAN DEFAULT false,
  metadata        JSONB
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- RLS HELPER FUNCTIONS
-- ⚠️ Uses auth.jwt() ->> 'email' instead of user_id
--    so these work even if user_id column doesn't exist yet
-- ═══════════════════════════════════════════════════════════

-- Drop and recreate to ensure latest version
DROP FUNCTION IF EXISTS is_workspace_member(UUID);
DROP FUNCTION IF EXISTS workspace_role(UUID);

CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_users
    WHERE workspace_id = ws_id
      AND user_email = auth.jwt() ->> 'email'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION workspace_role(ws_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(role, 'User')
  FROM workspace_users
  WHERE workspace_id = ws_id
    AND user_email = auth.jwt() ->> 'email'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- Drop existing ones first to avoid "already exists" errors
-- ═══════════════════════════════════════════════════════════

-- ── workspaces ────────────────────────────────────────────
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON workspaces;

CREATE POLICY "workspaces_select" ON workspaces FOR SELECT
  USING (is_workspace_member(id) OR owner_email = (auth.jwt() ->> 'email'));

CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE
  USING (workspace_role(id) = 'Admin' OR owner_email = (auth.jwt() ->> 'email'));

CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE
  USING (workspace_role(id) = 'Admin' OR owner_email = (auth.jwt() ->> 'email'));

-- ── workspace_users ───────────────────────────────────────
DROP POLICY IF EXISTS "wu_select"        ON workspace_users;
DROP POLICY IF EXISTS "wu_insert_admin"  ON workspace_users;
DROP POLICY IF EXISTS "wu_update_admin"  ON workspace_users;
DROP POLICY IF EXISTS "wu_delete_admin"  ON workspace_users;

CREATE POLICY "wu_select" ON workspace_users FOR SELECT
  USING (
    is_workspace_member(workspace_id)
    OR user_email = (auth.jwt() ->> 'email')
  );

CREATE POLICY "wu_insert_admin" ON workspace_users FOR INSERT
  WITH CHECK (workspace_role(workspace_id) = 'Admin');

CREATE POLICY "wu_update_admin" ON workspace_users FOR UPDATE
  USING (workspace_role(workspace_id) = 'Admin');

CREATE POLICY "wu_delete_admin" ON workspace_users FOR DELETE
  USING (workspace_role(workspace_id) = 'Admin');

-- ── workspace_integrations ────────────────────────────────
DROP POLICY IF EXISTS "integrations_select" ON workspace_integrations;
DROP POLICY IF EXISTS "integrations_insert" ON workspace_integrations;
DROP POLICY IF EXISTS "integrations_update" ON workspace_integrations;
DROP POLICY IF EXISTS "integrations_delete" ON workspace_integrations;

CREATE POLICY "integrations_select" ON workspace_integrations FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "integrations_insert" ON workspace_integrations FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "integrations_update" ON workspace_integrations FOR UPDATE
  USING (workspace_role(workspace_id) = 'Admin');

CREATE POLICY "integrations_delete" ON workspace_integrations FOR DELETE
  USING (workspace_role(workspace_id) = 'Admin');

-- ── campaigns ─────────────────────────────────────────────
DROP POLICY IF EXISTS "campaigns_select" ON campaigns;
DROP POLICY IF EXISTS "campaigns_write"  ON campaigns;

CREATE POLICY "campaigns_select" ON campaigns FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "campaigns_write" ON campaigns FOR ALL
  USING (workspace_role(workspace_id) IN ('Admin', 'Manager'));

-- ── creatives ─────────────────────────────────────────────
DROP POLICY IF EXISTS "creatives_select" ON creatives;
DROP POLICY IF EXISTS "creatives_write"  ON creatives;

CREATE POLICY "creatives_select" ON creatives FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "creatives_write" ON creatives FOR ALL
  USING (workspace_role(workspace_id) IN ('Admin', 'Manager'));

-- ── reports ───────────────────────────────────────────────
DROP POLICY IF EXISTS "reports_select" ON reports;
DROP POLICY IF EXISTS "reports_write"  ON reports;

CREATE POLICY "reports_select" ON reports FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "reports_write" ON reports FOR ALL
  USING (workspace_role(workspace_id) IN ('Admin', 'Manager'));

-- ── notifications ─────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (
    user_email = (auth.jwt() ->> 'email')
    OR is_workspace_member(workspace_id)
  );

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_email = (auth.jwt() ->> 'email'));

-- ── scheduled_actions ─────────────────────────────────────
DROP POLICY IF EXISTS "sched_select" ON scheduled_actions;
DROP POLICY IF EXISTS "sched_write"  ON scheduled_actions;

CREATE POLICY "sched_select" ON scheduled_actions FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "sched_write" ON scheduled_actions FOR ALL
  USING (workspace_role(workspace_id) IN ('Admin', 'Manager'));

-- ── support_tickets ───────────────────────────────────────
DROP POLICY IF EXISTS "tickets_select" ON support_tickets;
DROP POLICY IF EXISTS "tickets_insert" ON support_tickets;

CREATE POLICY "tickets_select" ON support_tickets FOR SELECT
  USING (
    user_email = (auth.jwt() ->> 'email')
    OR is_workspace_member(workspace_id)
  );

CREATE POLICY "tickets_insert" ON support_tickets FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ── activity_log ──────────────────────────────────────────
DROP POLICY IF EXISTS "log_select" ON activity_log;
DROP POLICY IF EXISTS "log_insert" ON activity_log;

CREATE POLICY "log_select" ON activity_log FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "log_insert" ON activity_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_workspace_users_workspace  ON workspace_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_users_email      ON workspace_users(user_email);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace     ON workspace_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type          ON workspace_integrations(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace        ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creatives_workspace        ON creatives(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reports_workspace          ON reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_email        ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_log_workspace     ON activity_log(workspace_id);
