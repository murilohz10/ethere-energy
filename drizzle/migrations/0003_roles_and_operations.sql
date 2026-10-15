ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'Operacional';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'Leitura';

CREATE OR REPLACE FUNCTION public.can_operate()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
    AND role::text IN ('Administrador','Gestor','Operacional'));
$$;

CREATE TABLE public.counterparties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'Cliente',
  name text NOT NULL,
  document text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counterparties TO authenticated;
GRANT ALL ON public.counterparties TO service_role;
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
CREATE POLICY counterparties_select ON public.counterparties FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY counterparties_write ON public.counterparties FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.can_write())
  WITH CHECK (company_id = public.current_company_id() AND public.can_write());
CREATE TRIGGER counterparties_touch BEFORE UPDATE ON public.counterparties FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  counterparty_id uuid REFERENCES public.counterparties(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'Unidade consumidora',
  name text NOT NULL,
  source text NOT NULL DEFAULT '',
  capacity_mw numeric,
  submarket text NOT NULL DEFAULT 'SE/CO',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY units_select ON public.units FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY units_write ON public.units FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.can_write())
  WITH CHECK (company_id = public.current_company_id() AND public.can_write());
CREATE TRIGGER units_touch BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.operational_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Pendência',
  priority text NOT NULL DEFAULT 'Média',
  status text NOT NULL DEFAULT 'Aberta',
  due_date date,
  assignee_id uuid,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_tasks TO authenticated;
GRANT ALL ON public.operational_tasks TO service_role;
ALTER TABLE public.operational_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_select ON public.operational_tasks FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY tasks_write ON public.operational_tasks FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.can_operate())
  WITH CHECK (company_id = public.current_company_id() AND public.can_operate());
CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.operational_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS counterparty_id uuid REFERENCES public.counterparties(id) ON DELETE SET NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;