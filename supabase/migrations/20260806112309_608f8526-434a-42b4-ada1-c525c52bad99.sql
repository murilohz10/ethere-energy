CREATE POLICY "company_files_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company-files' AND (storage.foldername(name))[1] = public.current_company_id()::text);
CREATE POLICY "company_files_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-files' AND (storage.foldername(name))[1] = public.current_company_id()::text AND public.can_write());
CREATE POLICY "company_files_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-files' AND (storage.foldername(name))[1] = public.current_company_id()::text AND public.can_write())
  WITH CHECK (bucket_id = 'company-files' AND (storage.foldername(name))[1] = public.current_company_id()::text AND public.can_write());
CREATE POLICY "company_files_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-files' AND (storage.foldername(name))[1] = public.current_company_id()::text AND public.can_write());