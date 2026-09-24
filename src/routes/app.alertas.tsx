import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell, Plus, AlertTriangle, AlertCircle, Info, TrendingDown, Pencil, Trash2, Copy, MoreHorizontal, BellOff, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts, fmtDate, type AlertRule, type AlertPriority } from "@/lib/store";
import { useCompanyProfile, alertTypesByProfile, alertTypeHints } from "@/lib/profile";

export const Route = createFileRoute("/app/alertas")({
  head: () => ({ meta: [{ title: "Alertas · Ethere" }] }),
  component: Alerts,
});

const style: Record<AlertPriority, { border: string; bg: string; icon: typeof Bell; chip: string }> = {
  Alta: { border: "border-l-red-500", bg: "bg-red-500/10 text-red-600", icon: AlertTriangle, chip: "bg-red-500/10 text-red-600 ring-1 ring-red-500/20" },
  Média: { border: "border-l-amber-500", bg: "bg-amber-500/10 text-amber-700", icon: AlertCircle, chip: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20" },
  Baixa: { border: "border-l-brand", bg: "bg-brand-softer text-brand-dark", icon: TrendingDown, chip: "bg-brand-softer text-brand-dark ring-1 ring-brand/20" },
  Info: { border: "border-l-slate-400", bg: "bg-muted text-muted-foreground", icon: Info, chip: "bg-muted text-muted-foreground ring-1 ring-border" },
};

const priorities: AlertPriority[] = ["Alta", "Média", "Baixa", "Info"];
const noThresholdTypes = ["Regulação", "Clima", "Mercado"];
const channels: AlertRule["channel"][] = ["Email", "SMS", "Push"];
const frequencies: AlertRule["frequency"][] = ["Imediato", "Diário", "Semanal"];

const emptyForm = (): Omit<AlertRule, "id" | "createdAt"> => ({
  name: "", type: "PLD", threshold: 0, channel: "Email", frequency: "Imediato", priority: "Média", enabled: true,
});

function Alerts() {
  const { alerts, add, update, remove, duplicate } = useAlerts();
  const { kind } = useCompanyProfile();
  const alertTypes = alertTypesByProfile[kind] as AlertRule["type"][];
  void alertTypeHints;
  const [query, setQuery] = useState("");
  const [fPriority, setFPriority] = useState("todos");
  const [fState, setFState] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<AlertRule | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter((a) => {
      const matchQ = !q || [a.name, a.type, a.channel].some((v) => v.toLowerCase().includes(q));
      const matchP = fPriority === "todos" || a.priority === fPriority;
      const matchS = fState === "todos" || (fState === "ativos" ? a.enabled : !a.enabled);
      return matchQ && matchP && matchS;
    });
  }, [alerts, query, fPriority, fState]);

  const counts = useMemo(() => ({
    active: alerts.filter((a) => a.enabled).length,
    high: alerts.filter((a) => a.priority === "Alta").length,
    mid: alerts.filter((a) => a.priority === "Média").length,
    low: alerts.filter((a) => a.priority === "Baixa" || a.priority === "Info").length,
  }), [alerts]);

  const openNew = () => { setEditing(null); setForm(emptyForm()); setErrors({}); setOpen(true); };
  const openEdit = (a: AlertRule) => {
    setEditing(a);
    const { id: _id, createdAt: _c, ...rest } = a;
    setForm(rest); setErrors({}); setOpen(true);
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Informe o nome do alerta.";
    if (form.type !== "Regulação" && (!form.threshold || form.threshold <= 0)) e.threshold = "Informe um limite válido.";
    setErrors(e);
    if (Object.keys(e).length) return toast.error("Verifique os campos obrigatórios.");
    if (editing) { update(editing.id, form); toast.success("Alerta atualizado"); }
    else { add(form); toast.success("Alerta criado", { description: form.name }); }
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Alertas"
        description={profileDescription}
        actions={
          <Button size="sm" onClick={openNew} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
            <Plus className="mr-1 h-4 w-4" /> Nova regra
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Ativos", v: counts.active, tone: "text-foreground", ring: "border-brand-soft" },
          { l: "Alta prioridade", v: counts.high, tone: "text-red-500", ring: "border-red-500/30" },
          { l: "Média prioridade", v: counts.mid, tone: "text-amber-500", ring: "border-amber-500/30" },
          { l: "Baixa/Info", v: counts.low, tone: "text-brand-dark", ring: "border-brand-soft" },
        ].map((s) => (
          <div key={s.l} className={cn("rounded-2xl border bg-card p-5 shadow-soft", s.ring)}>
            <div className="text-xs font-medium text-muted-foreground">{s.l}</div>
            <div className={cn("mt-2 text-3xl font-semibold tracking-tight tabular-nums", s.tone)}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition focus-within:border-brand">
          <Search className="h-4 w-4" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar alerta…"
            className="w-52 bg-transparent placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <Select value={fPriority} onValueChange={setFPriority}>
          <SelectTrigger className="h-9 w-auto min-w-[150px] rounded-lg bg-card text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="text-xs">Todas prioridades</SelectItem>
            {priorities.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fState} onValueChange={setFState}>
          <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-lg bg-card text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos" className="text-xs">Todos estados</SelectItem>
            <SelectItem value="ativos" className="text-xs">Ativos</SelectItem>
            <SelectItem value="inativos" className="text-xs">Pausados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {filtered.map((a, i) => {
          const s = style[a.priority];
          const Icon = s.icon;
          return (
            <div
              key={a.id}
              className={cn(
                "flex flex-wrap items-start gap-4 border-l-4 p-5 transition hover:bg-brand-softer/40",
                i > 0 && "border-t border-t-border",
                s.border,
                !a.enabled && "opacity-60",
              )}
            >
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", s.bg)}>
                <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="text-sm font-semibold">{a.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {a.type}
                  {a.type !== "Regulação" && ` · limite ${a.threshold}`}
                  {" · "}{a.channel} · {a.frequency} · criado em {fmtDate(a.createdAt)}
                </div>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", s.chip)}>{a.priority}</span>
              <div className="flex items-center gap-1">
                <Switch
                  checked={a.enabled}
                  aria-label="Ativar alerta"
                  onCheckedChange={(v) => { update(a.id, { enabled: v }); toast.success(v ? "Alerta ativado" : "Alerta pausado"); }}
                />
                <button onClick={() => openEdit(a)} aria-label="Editar alerta" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-brand-softer hover:text-brand-dark">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setToDelete(a)} aria-label="Excluir alerta" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button aria-label="Mais ações" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { duplicate(a.id); toast.success("Alerta duplicado"); }}>
                      <Copy className="mr-2 h-3.5 w-3.5" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { update(a.id, { enabled: !a.enabled }); toast.success(a.enabled ? "Alerta pausado" : "Alerta ativado"); }}>
                      {a.enabled ? "Pausar" : "Ativar"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-softer text-brand">
              <BellOff className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">
              {alerts.length === 0 ? "Nenhuma regra de alerta" : "Nenhum alerta encontrado"}
            </div>
            <p className="max-w-sm text-xs text-muted-foreground">
              Crie regras para ser avisado sobre variações de PLD, reservatórios e vencimentos.
            </p>
            <Button size="sm" onClick={openNew} className="text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
              <Plus className="mr-1 h-4 w-4" /> Nova regra
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar alerta" : "Nova regra de alerta"}</DialogTitle>
            <DialogDescription>Defina o gatilho, o canal e a prioridade da notificação.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome do alerta</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PLD SE/CO acima de R$ 220" />
              {errors.name && <p className="text-xs font-medium text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AlertRule["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{alertTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limite</Label>
              <Input type="number" value={form.threshold || ""} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} placeholder="220" />
              {errors.threshold && <p className="text-xs font-medium text-red-500">{errors.threshold}</p>}
            </div>
            <div className="space-y-2">
              <Label>Canal de notificação</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as AlertRule["channel"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{channels.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as AlertRule["frequency"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{frequencies.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as AlertPriority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 md:col-span-2">
              <span className="text-sm">Alerta ativo</span>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>Salvar alerta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este alerta?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete?.name} deixará de ser monitorado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => { if (toDelete) { remove([toDelete.id]); toast.success("Alerta removido"); } setToDelete(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
