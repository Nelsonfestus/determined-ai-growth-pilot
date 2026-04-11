-- SECTION 1: DDL only — add missing columns and create missing tables
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'User';
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS invited_by TEXT;
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE workspace_users ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS workspace_name TEXT;
ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS extra_field_1 TEXT;
ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS extra_field_2 TEXT;
ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE workspace_integrations ADD COLUMN IF NOT EXISTS workspace_id UUID;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS workspace_id UUID;

CREATE TABLE IF NOT EXISTS campaigns (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now(), workspace_id UUID, name TEXT NOT NULL, platform TEXT, status TEXT DEFAULT 'active', budget NUMERIC DEFAULT 0, spend NUMERIC DEFAULT 0, impressions BIGINT DEFAULT 0, clicks BIGINT DEFAULT 0, conversions BIGINT DEFAULT 0, revenue NUMERIC DEFAULT 0, start_date DATE, end_date DATE, objective TEXT, notes TEXT);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS workspace_id UUID;

CREATE TABLE IF NOT EXISTS creatives (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now(), workspace_id UUID, campaign_id UUID, name TEXT, type TEXT, status TEXT DEFAULT 'draft', headline TEXT, body_copy TEXT, cta TEXT, image_url TEXT, video_url TEXT, platform TEXT, notes TEXT);
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS workspace_id UUID;

CREATE TABLE IF NOT EXISTS reports (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now(), workspace_id UUID, name TEXT NOT NULL, type TEXT, date_range JSONB, filters JSONB, metrics JSONB, data JSONB, status TEXT DEFAULT 'draft', shared_with TEXT[], notes TEXT);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS workspace_id UUID;

CREATE TABLE IF NOT EXISTS scheduled_actions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now(), workspace_id UUID, campaign_id UUID, action_type TEXT, scheduled_at TIMESTAMPTZ, executed_at TIMESTAMPTZ, status TEXT DEFAULT 'pending', payload JSONB, notes TEXT);
ALTER TABLE scheduled_actions ADD COLUMN IF NOT EXISTS workspace_id UUID;

CREATE TABLE IF NOT EXISTS support_tickets (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now(), workspace_id UUID, user_email TEXT, subject TEXT, message TEXT, status TEXT DEFAULT 'open', priority TEXT DEFAULT 'normal', assigned_to TEXT, resolution TEXT);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_email TEXT;

CREATE TABLE IF NOT EXISTS activity_log (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now(), workspace_id UUID, user_email TEXT, action TEXT NOT NULL, entity_type TEXT, entity_id UUID, details TEXT, platform_action BOOLEAN DEFAULT false, metadata JSONB);
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Map old roles to new 3-tier system
UPDATE workspace_users SET role = 'Admin' WHERE role IN ('super_admin', 'admin', 'internal_admin');
UPDATE workspace_users SET role = 'Manager' WHERE role IN ('project_manager', 'support_agent', 'manager');
UPDATE workspace_users SET role = 'User' WHERE role IN ('client_user', 'user', 'viewer') OR role IS NULL OR role NOT IN ('Admin', 'Manager', 'User');

-- Add role constraint if not already present
DO $c$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_users_role_check') THEN
    ALTER TABLE workspace_users ADD CONSTRAINT workspace_users_role_check CHECK (role IN ('Admin', 'Manager', 'User'));
  END IF;
END $c$;

ALTER TABLE workspace_users ALTER COLUMN role SET NOT NULL;
ALTER TABLE workspace_users ALTER COLUMN role SET DEFAULT 'User';

-- SECTION 2: Functions and RLS — all inside EXECUTE so they compile
-- after the DDL above has been applied (deferred validation)
DO $migration$
DECLARE tbl TEXT; pol TEXT;
BEGIN

  -- Drop old functions
  EXECUTE 'DROP FUNCTION IF EXISTS is_workspace_member(UUID)';
  EXECUTE 'DROP FUNCTION IF EXISTS workspace_role(UUID)';

  -- Create helper functions using email from JWT (no user_id dependency)
  EXECUTE $f1$
    CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
    RETURNS BOOLEAN AS $body$
      SELECT EXISTS (
        SELECT 1 FROM workspace_users
        WHERE workspace_id = ws_id
          AND user_email = (auth.jwt() ->> 'email')
      );
    $body$ LANGUAGE sql SECURITY DEFINER STABLE
  $f1$;

  EXECUTE $f2$
    CREATE OR REPLACE FUNCTION workspace_role(ws_id UUID)
    RETURNS TEXT AS $body$
      SELECT COALESCE(role, 'User')
      FROM workspace_users
      WHERE workspace_id = ws_id
        AND user_email = (auth.jwt() ->> 'email')
      LIMIT 1;
    $body$ LANGUAGE sql SECURITY DEFINER STABLE
  $f2$;

  -- Enable RLS and drop old policies (only if table exists)
  FOR tbl, pol IN VALUES
    ('workspaces','workspaces_select'),('workspaces','workspaces_insert'),
    ('workspaces','workspaces_update'),('workspaces','workspaces_delete'),
    ('workspace_users','wu_select'),('workspace_users','wu_insert_admin'),
    ('workspace_users','wu_update_admin'),('workspace_users','wu_delete_admin'),
    ('workspace_integrations','integrations_select'),('workspace_integrations','integrations_insert'),
    ('workspace_integrations','integrations_update'),('workspace_integrations','integrations_delete'),
    ('campaigns','campaigns_select'),('campaigns','campaigns_write'),
    ('creatives','creatives_select'),('creatives','creatives_write'),
    ('reports','reports_select'),('reports','reports_write'),
    ('notifications','notifications_select'),('notifications','notifications_update'),
    ('scheduled_actions','sched_select'),('scheduled_actions','sched_write'),
    ('support_tickets','tickets_select'),('support_tickets','tickets_insert'),
    ('activity_log','log_select'),('activity_log','log_insert')
  LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = tbl AND n.nspname = 'public') THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, tbl);
    END IF;
  END LOOP;

  -- Create all RLS policies
  EXECUTE $p$CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (is_workspace_member(id) OR owner_email = (auth.jwt() ->> 'email'))$p$;
  EXECUTE $p$CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (auth.role() = 'authenticated')$p$;
  EXECUTE $p$CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (workspace_role(id) = 'Admin' OR owner_email = (auth.jwt() ->> 'email'))$p$;
  EXECUTE $p$CREATE POLICY "workspaces_delete" ON workspaces FOR DELETE USING (workspace_role(id) = 'Admin' OR owner_email = (auth.jwt() ->> 'email'))$p$;
  EXECUTE $p$CREATE POLICY "wu_select" ON workspace_users FOR SELECT USING (is_workspace_member(workspace_id) OR user_email = (auth.jwt() ->> 'email'))$p$;
  EXECUTE $p$CREATE POLICY "wu_insert_admin" ON workspace_users FOR INSERT WITH CHECK (workspace_role(workspace_id) = 'Admin')$p$;
  EXECUTE $p$CREATE POLICY "wu_update_admin" ON workspace_users FOR UPDATE USING (workspace_role(workspace_id) = 'Admin')$p$;
  EXECUTE $p$CREATE POLICY "wu_delete_admin" ON workspace_users FOR DELETE USING (workspace_role(workspace_id) = 'Admin')$p$;
  EXECUTE $p$CREATE POLICY "integrations_select" ON workspace_integrations FOR SELECT USING (is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "integrations_insert" ON workspace_integrations FOR INSERT WITH CHECK (is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "integrations_update" ON workspace_integrations FOR UPDATE USING (workspace_role(workspace_id) = 'Admin')$p$;
  EXECUTE $p$CREATE POLICY "integrations_delete" ON workspace_integrations FOR DELETE USING (workspace_role(workspace_id) = 'Admin')$p$;
  EXECUTE $p$CREATE POLICY "campaigns_select" ON campaigns FOR SELECT USING (is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "campaigns_write" ON campaigns FOR ALL USING (workspace_role(workspace_id) IN ('Admin', 'Manager'))$p$;
  EXECUTE $p$CREATE POLICY "creatives_select" ON creatives FOR SELECT USING (is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "creatives_write" ON creatives FOR ALL USING (workspace_role(workspace_id) IN ('Admin', 'Manager'))$p$;
  EXECUTE $p$CREATE POLICY "reports_select" ON reports FOR SELECT USING (is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "reports_write" ON reports FOR ALL USING (workspace_role(workspace_id) IN ('Admin', 'Manager'))$p$;
  EXECUTE $p$CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_email = (auth.jwt() ->> 'email') OR is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_email = (auth.jwt() ->> 'email'))$p$;
  EXECUTE $p$CREATE POLICY "sched_select" ON scheduled_actions FOR SELECT USING (is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "sched_write" ON scheduled_actions FOR ALL USING (workspace_role(workspace_id) IN ('Admin', 'Manager'))$p$;
  EXECUTE $p$CREATE POLICY "tickets_select" ON support_tickets FOR SELECT USING (user_email = (auth.jwt() ->> 'email') OR is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "tickets_insert" ON support_tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated')$p$;
  EXECUTE $p$CREATE POLICY "log_select" ON activity_log FOR SELECT USING (is_workspace_member(workspace_id))$p$;
  EXECUTE $p$CREATE POLICY "log_insert" ON activity_log FOR INSERT WITH CHECK (auth.role() = 'authenticated')$p$;

END $migration$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wu_workspace ON workspace_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wu_email ON workspace_users(user_email);
CREATE INDEX IF NOT EXISTS idx_integ_workspace ON workspace_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integ_type ON workspace_integrations(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_ws ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creatives_ws ON creatives(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reports_ws ON reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notif_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_actlog_ws ON activity_log(workspace_id);
