/**
 * Importa o PLD horário da CCEE (CSV baixado do portal de dados abertos) para
 * `market_series`, como PLD médio diário por submercado.
 *
 *   npm run import:pld -- <arquivo.csv>              resumo, sem gravar nada
 *   npm run import:pld -- <arquivo.csv> --sql <out>  gera um SQL de upsert
 *   npm run import:pld -- <arquivo.csv> --apply      grava direto no Supabase
 *
 * `--apply` exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente: a
 * tabela só aceita escrita pelo service role.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { CCEE_SOURCE, dailyPld, parsePldCsv, type PldDay } from "../src/lib/api/ccee.ts";

const CHUNK = 500;

const toRow = (d: PldDay) => ({
  source: CCEE_SOURCE,
  series: "pld",
  submarket: d.submarket,
  reference_date: d.date,
  value: d.value,
  metadata: { min: d.min, max: d.max },
});

function toSql(days: PldDay[]): string {
  const values = days
    .map((d) => {
      const r = toRow(d);
      return `  ('${r.source}', '${r.series}', '${r.submarket}', '${r.reference_date}', ${r.value}, '${JSON.stringify(r.metadata)}'::jsonb)`;
    })
    .join(",\n");
  return `INSERT INTO public.market_series (source, series, submarket, reference_date, value, metadata)
VALUES
${values}
ON CONFLICT (source, series, submarket, reference_date)
DO UPDATE SET value = EXCLUDED.value, metadata = EXCLUDED.metadata;
`;
}

async function apply(days: PldDay[]) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar --apply.");
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  for (let i = 0; i < days.length; i += CHUNK) {
    const { error } = await supabase
      .from("market_series")
      .upsert(days.slice(i, i + CHUNK).map(toRow), {
        onConflict: "source,series,submarket,reference_date",
      });
    if (error) throw new Error(`Falha ao gravar em market_series: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--sql");
  const sqlOut = args.includes("--sql") ? args[args.indexOf("--sql") + 1] : undefined;
  if (!file || (args.includes("--sql") && !sqlOut)) {
    throw new Error("Uso: import-pld <arquivo.csv> [--sql <saida.sql>] [--apply]");
  }

  const hours = parsePldCsv(readFileSync(file, "utf8"));
  const { days, incomplete } = dailyPld(hours);
  if (!days.length) throw new Error("Nenhum dia completo encontrado no arquivo.");

  console.log(`Leituras horárias: ${hours.length}`);
  console.log(
    `Dias completos: ${days.length / 4} (${days[0].date} a ${days[days.length - 1].date})`,
  );
  console.log(`Linhas para market_series: ${days.length}`);
  if (incomplete.length) console.log(`Dias incompletos ignorados: ${incomplete.join(", ")}`);
  for (const d of days.slice(-4)) {
    console.log(
      `  ${d.date} ${d.submarket.padEnd(5)} média ${d.value}  mín ${d.min}  máx ${d.max}`,
    );
  }

  if (sqlOut) {
    writeFileSync(sqlOut, toSql(days));
    console.log(`SQL gravado em ${sqlOut}`);
  }
  if (args.includes("--apply")) {
    await apply(days);
    console.log("Gravado em market_series.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
