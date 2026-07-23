import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/app/simulacao")({
  head: () => ({ meta: [{ title: "Simulação de Cenários · Ethere" }] }),
  component: Sim,
});

function Sim() {
  const [pld, setPld] = useState([15]);
  const [consumo, setConsumo] = useState([-10]);
  const [exposicao, setExposicao] = useState([20]);

  const base = 1_000_000;
  const impact = (pld[0] / 100) * 0.6 * base
    - (consumo[0] / 100) * 0.2 * base
    + (exposicao[0] / 100) * 0.4 * base;
  const projecao = base + impact;

  const data = Array.from({ length: 12 }).map((_, i) => ({
    m: `M${i + 1}`,
    base: base + i * 20000,
    cenario: base + i * 20000 + (impact * (i + 1)) / 12,
  }));

  return (
    <>
      <PageHeader
        title="Simulação de Cenários"
        description="Ajuste variáveis e projete impactos financeiros."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <SliderField label="Variação do PLD" value={pld} setValue={setPld} min={-30} max={50} suffix="%" />
          <SliderField label="Redução de consumo" value={consumo} setValue={setConsumo} min={-30} max={30} suffix="%" />
          <SliderField label="Exposição ao mercado" value={exposicao} setValue={setExposicao} min={0} max={100} suffix="%" />

          <div className="rounded-xl bg-surface p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" /> Recomendação
            </div>
            <p className="mt-2 text-sm">
              Reduza exposição em <b>5%</b> e trave contratos flexíveis. Economia estimada de{" "}
              <b>R$ 128k/mês</b>.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Receita base" value={fmt(base)} />
            <Metric label="Impacto do cenário" value={fmt(impact)} accent />
            <Metric label="Projeção total" value={fmt(projecao)} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm font-medium">Projeção financeira — 12 meses</div>
            <div className="mt-4 h-80">
              <ResponsiveContainer>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="cen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                  <Area dataKey="cenario" type="monotone" stroke="#2563EB" fill="url(#cen)" strokeWidth={2} />
                  <Area dataKey="base" type="monotone" stroke="var(--foreground)" fill="transparent" strokeDasharray="4 4" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SliderField({ label, value, setValue, min, max, suffix }: {
  label: string; value: number[]; setValue: (v: number[]) => void; min: number; max: number; suffix: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium">{value[0]}{suffix}</span>
      </div>
      <Slider className="mt-3" value={value} onValueChange={setValue} min={min} max={max} step={1} />
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={"mt-2 text-xl font-semibold tracking-tight " + (accent ? "text-[#2563EB]" : "")}>{value}</div>
    </div>
  );
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
