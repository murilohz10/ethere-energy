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
