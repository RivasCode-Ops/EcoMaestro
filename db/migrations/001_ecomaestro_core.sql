-- EcoMaestro — núcleo de demandas e passagens pelo condomínio
-- Postgres / Supabase · v1 · 2026-05-31

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Intenções (catálogo fixo, alinhado ao MODELO-CONDOMINIO)
CREATE TABLE IF NOT EXISTS intents (
  id          SMALLSERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  default_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO intents (code, description, default_sequence) VALUES
  ('ideia_nova', 'Demanda nova / projeto do zero', '["dlogica","workbench","cursor","max"]'::jsonb),
  ('feature_nova', 'Nova funcionalidade em produto existente', '["workbench","cursor","max"]'::jsonb),
  ('governanca', 'Escopo, handoff, PR, método', '["workbench","cursor","max"]'::jsonb),
  ('implementar', 'Implementação técnica', '["workbench","cursor","max"]'::jsonb),
  ('auditar', 'Auditoria de repositório', '["max","workbench"]'::jsonb),
  ('pesquisar', 'Pesquisa externa com fontes', '["cortana","workbench"]'::jsonb),
  ('fire', 'Independência financeira (FIRE)', '["freedom"]'::jsonb),
  ('financeiro_real', 'Finanças reais (consórcio, recuperação)', '["consorcio","workbench"]'::jsonb),
  ('comercial', 'Decisão comercial / fornecedor', '["arbilocal","cortana","workbench"]'::jsonb),
  ('correcao_rapida', 'Bug urgente / hotfix local', '["workbench","cursor","max"]'::jsonb),
  ('gasto_bem', 'Custo de gasto em bem durável', '["simulador_troca_moto","freedom"]'::jsonb),
  ('repo_github', 'Repo GitHub sem intenção explícita', '["workbench","cursor","max"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Demanda (entidade central)
CREATE TYPE demand_status AS ENUM (
  'draft',
  'triaged',
  'in_progress',
  'under_review',
  'completed',
  'archived'
);

CREATE TYPE demand_source_type AS ENUM (
  'description',
  'github',
  'localhost',
  'mixed'
);

CREATE TYPE resident_code AS ENUM (
  'dlogica',
  'workbench',
  'cursor',
  'max',
  'cortana',
  'freedom',
  'consorcio',
  'recuperacao',
  'arbilocal',
  'simulador_troca_moto',
  'geogrowth'
);

CREATE TABLE IF NOT EXISTS demands (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  source_type       demand_source_type NOT NULL DEFAULT 'description',
  github_url        TEXT,
  localhost_url     TEXT,
  tipo_demanda      TEXT CHECK (tipo_demanda IN ('novo', 'feature', 'outro')),
  status            demand_status NOT NULL DEFAULT 'draft',
  intent_id         SMALLINT REFERENCES intents(id),
  current_intent    TEXT,
  current_resident  resident_code,
  primary_resident  resident_code,
  confidence_pct    SMALLINT CHECK (confidence_pct BETWEEN 0 AND 100),
  payload_snapshot  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_intent ON demands(intent_id);
CREATE INDEX IF NOT EXISTS idx_demands_github ON demands(github_url) WHERE github_url IS NOT NULL;

-- Passagem de um morador sobre a demanda
CREATE TYPE resident_run_status AS ENUM (
  'pending',
  'running',
  'done',
  'failed',
  'skipped'
);

CREATE TABLE IF NOT EXISTS demand_resident_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id       UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  resident        resident_code NOT NULL,
  intent_id       SMALLINT REFERENCES intents(id),
  sequence_order  SMALLINT NOT NULL DEFAULT 0,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  input_payload   JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload  JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          resident_run_status NOT NULL DEFAULT 'pending',
  workbench_kit   TEXT,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  run_notes       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runs_demand ON demand_resident_runs(demand_id);
CREATE INDEX IF NOT EXISTS idx_runs_resident ON demand_resident_runs(resident);

-- Relatório materializado (opcional — espelha UI “O que precisa / Quem aplica”)
CREATE TABLE IF NOT EXISTS demand_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id       UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE UNIQUE,
  needs           JSONB NOT NULL DEFAULT '[]'::jsonb,
  aplicadores     JSONB NOT NULL DEFAULT '[]'::jsonb,
  routing_label   TEXT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atualiza updated_at em demands
CREATE OR REPLACE FUNCTION set_demands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_demands_updated_at ON demands;
CREATE TRIGGER tr_demands_updated_at
  BEFORE UPDATE ON demands
  FOR EACH ROW EXECUTE FUNCTION set_demands_updated_at();
