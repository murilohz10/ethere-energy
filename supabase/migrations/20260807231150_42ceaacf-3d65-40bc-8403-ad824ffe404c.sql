CREATE TABLE public.market_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'mock',
  series text NOT NULL,
  submarket text NOT NULL DEFAULT 'SE/CO',
  reference_date date NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, series, submarket, reference_date)
);

GRANT SELECT ON public.market_series TO authenticated;
GRANT ALL ON public.market_series TO service_role;

ALTER TABLE public.market_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY market_series_select ON public.market_series
  FOR SELECT TO authenticated USING (true);

CREATE INDEX market_series_lookup_idx ON public.market_series (series, submarket, reference_date DESC);

CREATE TRIGGER market_series_touch BEFORE UPDATE ON public.market_series
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();