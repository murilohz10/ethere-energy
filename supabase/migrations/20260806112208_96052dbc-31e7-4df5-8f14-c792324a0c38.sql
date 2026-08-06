REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_company_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_write() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_company_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_write() TO authenticated, service_role;