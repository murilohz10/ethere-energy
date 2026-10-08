-- Ethere: o que falta no projeto Supabase mpulyamlzohjinuxpvnt para o app funcionar.
-- Cole tudo no SQL Editor e execute uma vez. Pode ser executado de novo sem duplicar nada.

-- ===== 1. Limites de plano (Core / Pro) e coluna de notificacao =====
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

DROP TRIGGER IF EXISTS contracts_plan_limit ON public.contracts;
CREATE TRIGGER contracts_plan_limit BEFORE INSERT ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
DROP TRIGGER IF EXISTS alert_rules_plan_limit ON public.alert_rules;
CREATE TRIGGER alert_rules_plan_limit BEFORE INSERT ON public.alert_rules FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
DROP TRIGGER IF EXISTS reports_plan_limit ON public.reports;
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

DROP TRIGGER IF EXISTS profiles_notified_limit ON public.profiles;
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

DROP TRIGGER IF EXISTS companies_protect_plan ON public.companies;
CREATE TRIGGER companies_protect_plan BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.protect_company_plan();

-- ===== 2. Cadastro: cria empresa, perfil e papel ao criar o usuario =====
-- Cadastro: ao criar um usuário no Auth, cria a empresa, o perfil e o papel de
-- Administrador a partir dos dados enviados no signUp (raw_user_meta_data).
-- Roda como SECURITY DEFINER porque o usuário recém-criado ainda não tem
-- permissão de escrita em companies / user_roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  kind text := CASE WHEN meta->>'profile_kind' = 'Fazenda de Energia'
                    THEN 'Fazenda de Energia' ELSE 'Comercializadora' END;
  new_company uuid;
BEGIN
  INSERT INTO public.companies (name, cnpj, email, phone, segment)
  VALUES (
    left(COALESCE(NULLIF(trim(meta->>'company_name'), ''), 'Minha empresa'), 140),
    NULLIF(left(trim(COALESCE(meta->>'cnpj', '')), 20), ''),
    NEW.email,
    NULLIF(left(trim(COALESCE(meta->>'phone', '')), 24), ''),
    kind
  )
  RETURNING id INTO new_company;

  INSERT INTO public.profiles (id, company_id, email, first_name, last_name, job_title, phone, profile_kind)
  VALUES (
    NEW.id,
    new_company,
    NEW.email,
    left(trim(COALESCE(meta->>'first_name', '')), 80),
    left(trim(COALESCE(meta->>'last_name', '')), 80),
    left(trim(COALESCE(meta->>'job_title', '')), 80),
    left(trim(COALESCE(meta->>'phone', '')), 24),
    kind
  );

  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (NEW.id, new_company, 'Administrador');

  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== 3. Contas ja existentes que ficaram sem empresa =====
-- Contas criadas antes do trigger `on_auth_user_created` existir ficaram sem
-- empresa, perfil e papel. Este bloco cria os três para cada uma delas, com a
-- mesma regra do trigger. Pode ser executado mais de uma vez sem duplicar nada.
DO $$
DECLARE
  u record;
  meta jsonb;
  kind text;
  doc text;
  new_company uuid;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    meta := COALESCE(u.raw_user_meta_data, '{}'::jsonb);
    kind := CASE WHEN meta->>'profile_kind' = 'Fazenda de Energia'
                 THEN 'Fazenda de Energia' ELSE 'Comercializadora' END;
    doc := NULLIF(left(trim(COALESCE(meta->>'cnpj', '')), 20), '');
    -- O CNPJ é único: se já pertence a outra empresa, fica em branco.
    IF doc IS NOT NULL AND EXISTS (SELECT 1 FROM public.companies WHERE cnpj = doc) THEN
      doc := NULL;
    END IF;

    INSERT INTO public.companies (name, cnpj, email, phone, segment)
    VALUES (
      left(COALESCE(NULLIF(trim(meta->>'company_name'), ''), 'Minha empresa'), 140),
      doc,
      u.email,
      NULLIF(left(trim(COALESCE(meta->>'phone', '')), 24), ''),
      kind
    )
    RETURNING id INTO new_company;

    INSERT INTO public.profiles (id, company_id, email, first_name, last_name, job_title, phone, profile_kind)
    VALUES (
      u.id,
      new_company,
      u.email,
      left(trim(COALESCE(meta->>'first_name', '')), 80),
      left(trim(COALESCE(meta->>'last_name', '')), 80),
      left(trim(COALESCE(meta->>'job_title', '')), 80),
      left(trim(COALESCE(meta->>'phone', '')), 24),
      kind
    );

    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (u.id, new_company, 'Administrador');
  END LOOP;
END $$;

-- ===== 4. Leitura publica do PLD =====
-- market_series guarda dados públicos de mercado (PLD da CCEE), sem vínculo com
-- empresa. A leitura é liberada também para visitantes, para que as telas
-- funcionem antes do login real do Supabase estar ligado.
GRANT SELECT ON public.market_series TO anon;

DROP POLICY IF EXISTS market_series_select_public ON public.market_series;
CREATE POLICY market_series_select_public ON public.market_series
  FOR SELECT TO anon USING (true);
