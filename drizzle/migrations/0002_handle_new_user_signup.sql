CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _company_id uuid;
  _meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.companies (name, cnpj, segment)
  VALUES (
    NULLIF(TRIM(_meta->>'company_name'), ''),
    NULLIF(TRIM(_meta->>'cnpj'), ''),
    NULLIF(TRIM(_meta->>'profile_kind'), '')
  )
  RETURNING id INTO _company_id;

  INSERT INTO public.profiles (id, company_id, email, first_name, last_name, job_title, phone, profile_kind, onboarded)
  VALUES (
    NEW.id,
    _company_id,
    NEW.email,
    COALESCE(NULLIF(TRIM(_meta->>'first_name'), ''), ''),
    COALESCE(NULLIF(TRIM(_meta->>'last_name'), ''), ''),
    COALESCE(NULLIF(TRIM(_meta->>'job_title'), ''), ''),
    COALESCE(NULLIF(TRIM(_meta->>'phone'), ''), ''),
    COALESCE(NULLIF(TRIM(_meta->>'profile_kind'), ''), 'Comercializadora'),
    false
  );

  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (NEW.id, _company_id, 'Administrador');

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();