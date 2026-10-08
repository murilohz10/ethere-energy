-- market_series guarda dados públicos de mercado (PLD da CCEE), sem vínculo com
-- empresa. A leitura é liberada também para visitantes, para que as telas
-- funcionem antes do login real do Supabase estar ligado.
GRANT SELECT ON public.market_series TO anon;

DROP POLICY IF EXISTS market_series_select_public ON public.market_series;
CREATE POLICY market_series_select_public ON public.market_series
  FOR SELECT TO anon USING (true);
