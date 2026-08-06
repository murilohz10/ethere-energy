-- ============ enums ============
CREATE TYPE public.app_role AS ENUM ('Administrador', 'Gestor', 'Analista');

-- ============ companies ============
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  email text,
  phone text,
  segment text,
  plan_id text NOT NULL DEFAULT 'ethere-mensal',
  subscription_status text NOT NULL DEFAULT 'trialing',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX companies_cnpj_key ON public.companies (cnpj) WHERE cnpj IS NOT NULL;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  avatar_url text,
  profile_kind text NOT NULL DEFAULT 'Comercializadora',
  onboarded boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_company_idx ON public.profiles (company_id);

-- ============ user_roles ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX user_roles_company_idx ON public.user_roles (company_id);

-- ============ helper functions ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'Administrador');
$$;

CREATE OR REPLACE FUNCTION public.can_write()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'Administrador') OR public.has_role(auth.uid(), 'Gestor');
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ role_permissions ============
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, role)
);

-- ============ contracts ============
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  supplier text NOT NULL DEFAULT '',
  consumer text NOT NULL DEFAULT '',
  counterparty text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Venda',
  submarket text NOT NULL DEFAULT 'SE/CO',
  volume numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'Ativo',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contracts_company_idx ON public.contracts (company_id);
CREATE INDEX contracts_status_idx ON public.contracts (company_id, status);
CREATE INDEX contracts_end_date_idx ON public.contracts (company_id, end_date);
CREATE UNIQUE INDEX contracts_company_code_key ON public.contracts (company_id, code);
CREATE TRIGGER contracts_touch BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ alert rules ============
CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'PLD',
  threshold numeric NOT NULL DEFAULT 0,
  channel text NOT NULL DEFAULT 'Email',
  frequency text NOT NULL DEFAULT 'Imediato',
  priority text NOT NULL DEFAULT 'Média',
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alert_rules_company_idx ON public.alert_rules (company_id);
CREATE TRIGGER alert_rules_touch BEFORE UPDATE ON public.alert_rules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ alert events / notifications ============
CREATE TABLE public.alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.alert_rules (id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts (id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'engine',
  level text NOT NULL DEFAULT 'Info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  dedupe_key text,
  read boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alert_events_company_idx ON public.alert_events (company_id, created_at DESC);
CREATE UNIQUE INDEX alert_events_dedupe_key ON public.alert_events (company_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

-- ============ reports ============
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Personalizado',
  period_start date,
  period_end date,
  summary text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_company_idx ON public.reports (company_id, created_at DESC);

-- ============ consumptions ============
CREATE TABLE public.consumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts (id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  volume_mwh numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consumptions_company_idx ON public.consumptions (company_id, reference_month DESC);

-- ============ insights ============
CREATE TABLE public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'Informativo',
  category text NOT NULL DEFAULT 'Mercado',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  impact text NOT NULL DEFAULT '',
  recommendation text NOT NULL DEFAULT '',
  metric_value numeric,
  contract_id uuid REFERENCES public.contracts (id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX insights_company_idx ON public.insights (company_id, generated_at DESC);

-- ============ attachments ============
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  doc_type text NOT NULL DEFAULT 'Documento',
  bucket text NOT NULL DEFAULT 'company-files',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attachments_company_idx ON public.attachments (company_id, created_at DESC);
CREATE INDEX attachments_entity_idx ON public.attachments (entity_type, entity_id);

-- ============ audit logs ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies (id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  description text NOT NULL DEFAULT '',
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_company_idx ON public.audit_logs (company_id, created_at DESC);
CREATE INDEX audit_logs_action_idx ON public.audit_logs (company_id, action);

-- ============ grants ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consumptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.companies, public.profiles, public.user_roles, public.role_permissions,
  public.contracts, public.alert_rules, public.alert_events, public.reports,
  public.consumptions, public.insights, public.attachments, public.audit_logs TO service_role;

-- ============ RLS ============
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- companies: members read own company; admins update it
CREATE POLICY companies_select ON public.companies FOR SELECT TO authenticated
  USING (id = public.current_company_id());
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated
  USING (id = public.current_company_id() AND public.is_company_admin())
  WITH CHECK (id = public.current_company_id() AND public.is_company_admin());

-- profiles: own profile always; company members readable; admins manage
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR company_id = public.current_company_id());
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_admin())
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_admin());
CREATE POLICY profiles_delete_admin ON public.profiles FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_admin() AND id <> auth.uid());

-- user_roles: read own company; admins manage
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR company_id = public.current_company_id());
CREATE POLICY user_roles_admin_all ON public.user_roles FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_admin())
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_admin());

-- role_permissions: read by members, managed by admins
CREATE POLICY role_permissions_select ON public.role_permissions FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY role_permissions_admin_all ON public.role_permissions FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_admin())
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_admin());

-- contracts
CREATE POLICY contracts_select ON public.contracts FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY contracts_insert ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND public.can_write());
CREATE POLICY contracts_update ON public.contracts FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND public.can_write())
  WITH CHECK (company_id = public.current_company_id() AND public.can_write());
CREATE POLICY contracts_delete ON public.contracts FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_admin());

-- alert_rules
CREATE POLICY alert_rules_select ON public.alert_rules FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY alert_rules_write ON public.alert_rules FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.can_write())
  WITH CHECK (company_id = public.current_company_id() AND public.can_write());

-- alert_events
CREATE POLICY alert_events_select ON public.alert_events FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY alert_events_insert ON public.alert_events FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id());
CREATE POLICY alert_events_update ON public.alert_events FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
CREATE POLICY alert_events_delete ON public.alert_events FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND public.can_write());

-- reports
CREATE POLICY reports_select ON public.reports FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY reports_write ON public.reports FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.can_write())
  WITH CHECK (company_id = public.current_company_id() AND public.can_write());

-- consumptions
CREATE POLICY consumptions_select ON public.consumptions FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY consumptions_write ON public.consumptions FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.can_write())
  WITH CHECK (company_id = public.current_company_id() AND public.can_write());

-- insights
CREATE POLICY insights_select ON public.insights FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY insights_write ON public.insights FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- attachments
CREATE POLICY attachments_select ON public.attachments FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY attachments_write ON public.attachments FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.can_write())
  WITH CHECK (company_id = public.current_company_id() AND public.can_write());

-- audit_logs: read-only for company members
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());