-- Isolamento multi-tenant (LGPD) — EcoMaestro enterprise
ALTER TABLE demands ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'local';
ALTER TABLE demands ADD COLUMN IF NOT EXISTS project_folder TEXT;

CREATE INDEX IF NOT EXISTS idx_demands_tenant ON demands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_demands_tenant_project ON demands(tenant_id, project_folder);

-- RLS (ativar no Supabase com política por tenant)
-- ALTER TABLE demands ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY demands_tenant_isolation ON demands
--   USING (tenant_id = current_setting('app.tenant_id', true));
