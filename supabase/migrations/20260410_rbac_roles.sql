-- ============================================================
-- RBAC: Add `role` column to workspace_users table
-- Values: 'Admin', 'Manager', 'User'
-- ============================================================

ALTER TABLE workspace_users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'User'
  CHECK (role IN ('Admin', 'Manager', 'User'));

-- Update existing super_admin / admin entries
UPDATE workspace_users SET role = 'Admin'
WHERE role = 'User'
  AND user_email IN (
    SELECT email FROM auth.users
    JOIN user_profiles ON auth.users.id = user_profiles.id
    WHERE user_profiles.role IN ('super_admin', 'admin', 'internal_admin')
  );

-- ============================================================
-- RLS: Enforce permissions based on workspace role
-- ============================================================

-- Allow SELECT for all authenticated members of the workspace
CREATE POLICY "workspace_users_select" ON workspace_users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth.users.id FROM auth.users
      WHERE auth.users.email = workspace_users.user_email
    )
    OR
    EXISTS (
      SELECT 1 FROM workspace_users wu
      WHERE wu.workspace_id = workspace_users.workspace_id
        AND wu.user_email = auth.jwt() ->> 'email'
        AND wu.role IN ('Admin', 'Manager')
    )
  );

-- Only Admins can INSERT new workspace_users
CREATE POLICY "workspace_users_insert_admin_only" ON workspace_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_users wu
      WHERE wu.workspace_id = NEW.workspace_id
        AND wu.user_email = auth.jwt() ->> 'email'
        AND wu.role = 'Admin'
    )
  );

-- Only Admins can UPDATE roles
CREATE POLICY "workspace_users_update_admin_only" ON workspace_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_users wu
      WHERE wu.workspace_id = workspace_users.workspace_id
        AND wu.user_email = auth.jwt() ->> 'email'
        AND wu.role = 'Admin'
    )
  );

-- Only Admins can DELETE users
CREATE POLICY "workspace_users_delete_admin_only" ON workspace_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_users wu
      WHERE wu.workspace_id = workspace_users.workspace_id
        AND wu.user_email = auth.jwt() ->> 'email'
        AND wu.role = 'Admin'
    )
  );

-- ============================================================
-- Silo all new vertical data by workspace_id
-- (workspace_integrations already has workspace_id column)
-- ============================================================

-- Ensure RLS is enabled on workspace_integrations
ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_workspace_isolation" ON workspace_integrations
  FOR ALL
  USING (
    workspace_id IN (
      SELECT wu.workspace_id FROM workspace_users wu
      WHERE wu.user_email = auth.jwt() ->> 'email'
    )
  );
