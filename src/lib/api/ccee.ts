/**
 * Leitura dos dados abertos da CCEE — PLD horário por submercado.
 *
 * Formato do CSV publicado no portal:
 * MES_REFERENCIA;SUBMERCADO;PERIODO_COMERCIALIZACAO;DIA;HORA;PLD_HORA
 *
 * Aqui só há parsing e agregação: nenhuma chamada de rede ou de banco, para
 * que o mesmo código sirva ao script de importação e ao servidor.
 */

import type { Submarket } from "./types";

export const CCEE_SOURCE = "ccee";

const HEADER = "MES_REFERENCIA;SUBMERCADO;PERIODO_COMERCIALIZACAO;DIA;HORA;PLD_HORA";
const HOURS_PER_DAY = 24;

const submarketByCcee: Record<string, Submarket> = {
  SUDESTE: "SE/CO",
  SUL: "S",
  NORDESTE: "NE",
  NORTE: "N",
};

export type PldHour = {
  submarket: Submarket;
  /** Dia de referência (YYYY-MM-DD, horário de Brasília). */
  date: string;
  hour: number;
  /** R$/MWh. */
  value: number;
};

export type PldDay = {
  submarket: Submarket;
  date: string;
  /** Média das 24 horas do dia, em R$/MWh. */
  value: number;
  min: number;
  max: number;
};

/** Converte o CSV da CCEE em leituras horárias. Lança erro na primeira linha inválida. */
export function parsePldCsv(text: string): PldHour[] {
  // Cada linha passa por trim() adiante, o que também cobre arquivos com CRLF.
  const lines = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).split(/\n/);
  if (lines[0]?.trim() !== HEADER) {
    throw new Error(`Cabeçalho inesperado no CSV da CCEE: "${lines[0] ?? ""}".`);
  }

  const hours: PldHour[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const [month, rawSubmarket, , rawDay, rawHour, rawValue] = line.split(";");
    const submarket = submarketByCcee[rawSubmarket];
    const day = Number(rawDay);
    const hour = Number(rawHour);
    const value = Number(rawValue);
    const valid =
      /^\d{6}$/.test(month ?? "") &&
      submarket !== undefined &&
      Number.isInteger(day) &&
      day >= 1 &&
      day <= 31 &&
      Number.isInteger(hour) &&
      hour >= 0 &&
      hour < HOURS_PER_DAY &&
      rawValue !== "" &&
      Number.isFinite(value);
    if (!valid) throw new Error(`Linha ${i + 1} inválida no CSV da CCEE: "${line}".`);

    hours.push({
      submarket,
      date: `${month.slice(0, 4)}-${month.slice(4)}-${String(day).padStart(2, "0")}`,
      hour,
      value,
    });
  }
  return hours;
}

/**
 * Agrega as leituras horárias em PLD médio diário por submercado.
 * Dias sem as 24 horas publicadas ficam de fora e são devolvidos em `incomplete`.
 */
export function dailyPld(hours: PldHour[]): { days: PldDay[]; incomplete: string[] } {
  const groups = new Map<string, PldHour[]>();
  for (const h of hours) {
    const key = `${h.date}|${h.submarket}`;
    const group = groups.get(key);
    if (group) group.push(h);
    else groups.set(key, [h]);
  }

  const days: PldDay[] = [];
  const incomplete: string[] = [];
  for (const [key, group] of groups) {
    if (
      new Set(group.map((h) => h.hour)).size !== HOURS_PER_DAY ||
      group.length !== HOURS_PER_DAY
    ) {
      incomplete.push(key);
      continue;
    }
    const values = group.map((h) => h.value);
    days.push({
      submarket: group[0].submarket,
      date: group[0].date,
      value: +(values.reduce((a, b) => a + b, 0) / HOURS_PER_DAY).toFixed(2),
      min: Math.min(...values),
      max: Math.max(...values),
    });
  }

  days.sort((a, b) => a.date.localeCompare(b.date) || a.submarket.localeCompare(b.submarket));
  return { days, incomplete: incomplete.sort() };
}
