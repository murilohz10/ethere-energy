ALTER TABLE public.companies ALTER COLUMN plan_id SET DEFAULT 'ethere-core';
UPDATE public.companies SET plan_id = 'ethere-core' WHERE plan_id NOT IN ('ethere-core','ethere-pro');

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS receives_alerts boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.company_plan(_company uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT plan_id FROM public.companies WHERE id = _company), 'ethere-core');
$$;

CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF public.company_plan(NEW.company_id) = 'ethere-pro' THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'contracts' THEN
    SELECT count(*) INTO n FROM public.contracts WHERE company_id = NEW.company_id;
    IF n >= 100 THEN RAISE EXCEPTION 'PLAN_LIMIT: Você atingiu o limite de 100 contratos do plano Ethere Core.'; END IF;
  ELSIF TG_TABLE_NAME = 'alert_rules' THEN
    SELECT count(*) INTO n FROM public.alert_rules WHERE company_id = NEW.company_id;
    IF n >= 5 THEN RAISE EXCEPTION 'PLAN_LIMIT: Você atingiu o limite de 5 alertas do plano Ethere Core.'; END IF;
  ELSIF TG_TABLE_NAME = 'reports' THEN
    SELECT count(*) INTO n FROM public.reports WHERE company_id = NEW.company_id
      AND date_trunc('month', created_at) = date_trunc('month', now());
    IF n >= 3 THEN RAISE EXCEPTION 'PLAN_LIMIT: Você atingiu o limite de 3 relatórios deste mês.'; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER contracts_plan_limit BEFORE INSERT ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
CREATE TRIGGER alert_rules_plan_limit BEFORE INSERT ON public.alert_rules FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
CREATE TRIGGER reports_plan_limit BEFORE INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

CREATE OR REPLACE FUNCTION public.enforce_notified_users()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF NEW.receives_alerts AND NOT COALESCE(OLD.receives_alerts, false)
     AND public.company_plan(NEW.company_id) <> 'ethere-pro' THEN
    SELECT count(*) INTO n FROM public.profiles WHERE company_id = NEW.company_id AND receives_alerts AND id <> NEW.id;
    IF n >= 2 THEN RAISE EXCEPTION 'PLAN_LIMIT: O plano Ethere Core permite notificações para até 2 usuários.'; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER profiles_notified_limit BEFORE INSERT OR UPDATE OF receives_alerts ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_notified_users();

-- O plano só muda pelo backend (futuro checkout), nunca pelo navegador.
CREATE OR REPLACE FUNCTION public.protect_company_plan()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.plan_id IS DISTINCT FROM OLD.plan_id OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status)
     AND COALESCE(auth.role(), '') IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'O plano da assinatura só pode ser alterado pelo faturamento.';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER companies_protect_plan BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.protect_company_plan();