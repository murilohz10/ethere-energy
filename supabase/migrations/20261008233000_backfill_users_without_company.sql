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
