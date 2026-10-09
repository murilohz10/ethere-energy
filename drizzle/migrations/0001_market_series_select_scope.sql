DROP POLICY IF EXISTS market_series_select ON public.market_series;
CREATE POLICY market_series_select ON public.market_series
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND current_company_id() IS NOT NULL);