import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal,
  Download, FileX2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useContracts, brl, fmtDate, downloadFile, toCsv,
  type Contract, type ContractStatus, type ContractType, type Submarket,
} from "@/lib/store";

export const Route = createFileRoute("/app/contratos")({
  head: () => ({ meta: [{ title: "Contratos · Ethere" }] }),
  component: Contracts,
});

const subTone: Record<string, string> = {
  "SE/CO": "bg-brand/10 text-brand-dark",
  S: "bg-sky-500/10 text-sky-700",
  NE: "bg-indigo-500/10 text-indigo-700",
  N: "bg-slate-500/10 text-slate-700",
};

const statusTone: Record<ContractStatus, string> = {
  Ativo: "bg-brand-softer text-brand-dark ring-1 ring-brand/20",
  Pendente: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
  Encerrado: "bg-muted text-muted-foreground ring-1 ring-border",
};

const submarkets: Submarket[] = ["SE/CO", "S", "NE", "N"];
const statuses: ContractStatus[] = ["Ativo", "Pendente", "Encerrado"];
const types: ContractType[] = ["Compra", "Venda"];

type SortKey = "code" | "company" | "submarket" | "volume" | "price" | "endDate" | "status";

const emptyForm = (): Omit<Contract, "id" | "code"> => ({
  name: "",
  company: "",
  type: "Venda",
  submarket: "SE/CO",
  volume: 0,
  price: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  status: "Ativo",
  notes: "",
});

const daysTo = (iso: string) => Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000);

function Contracts() {
  const { contracts, add, update, remove } = useContracts();

  const [query, setQuery] = useState("");
  const [fStatus, setFStatus] = useState("todos");
  const [fSub, setFSub] = useState("todos");
  const [fType, setFType] = useState("todos");
  const [fDue, setFDue] = useState("todos");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "endDate", dir: "asc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<string[] | null>(null);

  const perPage = 5;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = contracts.filter((c) => {
      const matchQ =
        !q ||
        [c.code, c.name, c.company, c.submarket].some((v) => v.toLowerCase().includes(q));
      const matchStatus = fStatus === "todos" || c.status === fStatus;
      const matchSub = fSub === "todos" || c.submarket === fSub;
      const matchType = fType === "todos" || c.type === fType;
      const d = c.endDate ? daysTo(c.endDate) : Infinity;
      const matchDue =
        fDue === "todos" ||
        (fDue === "30" && d >= 0 && d <= 30) ||
        (fDue === "90" && d >= 0 && d <= 90) ||
        (fDue === "365" && d >= 0 && d <= 365) ||
        (fDue === "vencidos" && d < 0);
      return matchQ && matchStatus && matchSub && matchType && matchDue;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "pt-BR") * dir;
    });
  }, [contracts, query, fStatus, fSub, fType, fDue, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * perPage, current * perPage);

  const kpis = useMemo(() => {
    const active = filtered.filter((c) => c.status === "Ativo");
    const volume = filtered.reduce((s, c) => s + c.volume, 0);
    const avg = filtered.length ? filtered.reduce((s, c) => s + c.price, 0) / filtered.length : 0;
    const expiring = filtered.filter((c) => c.endDate && daysTo(c.endDate) >= 0 && daysTo(c.endDate) <= 90).length;
    return { total: filtered.length, active: active.length, volume, avg, expiring };
  }, [filtered]);

  const hasFilters = query || fStatus !== "todos" || fSub !== "todos" || fType !== "todos" || fDue !== "todos";

  const clearFilters = () => {
    setQuery(""); setFStatus("todos"); setFSub("todos"); setFType("todos"); setFDue("todos"); setPage(1);
  };

  const openNew = () => {
    setEditing(null); setForm(emptyForm()); setErrors({}); setFormOpen(true);
  };
  const openEdit = (c: Contract) => {
    setEditing(c);
    const { id: _id, code: _code, ...rest } = c;
    setForm(rest); setErrors({}); setFormOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Informe o nome do contrato.";
    if (!form.company.trim()) e.company = "Informe a empresa.";
    if (!form.volume || form.volume <= 0) e.volume = "Volume deve ser maior que zero.";
    if (!form.price || form.price <= 0) e.price = "Preço deve ser maior que zero.";
    if (!form.startDate) e.startDate = "Informe a data de início.";
    if (!form.endDate) e.endDate = "Informe a data de vencimento.";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = "Vencimento deve ser após o início.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      toast.error("Verifique os campos obrigatórios.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    if (editing) {
      update(editing.id, form);
      toast.success("Contrato atualizado", { description: `${form.name} foi salvo com sucesso.` });
    } else {
      add(form);
      toast.success("Contrato criado", { description: `${form.name} foi adicionado ao portfólio.` });
    }
    setSaving(false);
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    remove(toDelete);
    setSelected((s) => s.filter((id) => !toDelete.includes(id)));
    toast.success(toDelete.length > 1 ? `${toDelete.length} contratos removidos` : "Contrato removido");
    setToDelete(null);
  };

  const exportCsv = (rows: Contract[]) => {
    if (!rows.length) return toast.error("Nenhum contrato para exportar.");
    downloadFile(
      "contratos-ethere.csv",
      toCsv(rows.map((r) => ({
        Contrato: r.code, Nome: r.name, Empresa: r.company, Tipo: r.type, Submercado: r.submarket,
        Volume: r.volume, Preco: r.price, Inicio: r.startDate, Vencimento: r.endDate, Status: r.status,
      }))),
      "text/csv;charset=utf-8",
    );
    toast.success("Exportação concluída", { description: `${rows.length} contratos em CSV.` });
  };

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  return (
    <>
      <PageHeader
        title="Contratos"
        description="Portfólio consolidado com exposição por contrato."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)}>
              <Download className="mr-1 h-4 w-4" /> Exportar
            </Button>
            <Button size="sm" onClick={openNew} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
              <Plus className="mr-1 h-4 w-4" /> Novo contrato
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Kpi label="Contratos" value={String(kpis.total)} />
        <Kpi label="Ativos" value={String(kpis.active)} accent />
        <Kpi label="Volume total" value={`${kpis.volume.toFixed(1)} MWm`} />
        <Kpi label="Preço médio" value={brl(kpis.avg)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition focus-within:border-brand">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="w-56 bg-transparent placeholder:text-muted-foreground focus:outline-none"
            placeholder="Buscar por cliente, contrato ou submercado…"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Limpar busca">
              <X className="h-3.5 w-3.5 hover:text-foreground" />
            </button>
          )}
        </div>

        <FilterSelect value={fStatus} onChange={(v) => { setFStatus(v); setPage(1); }} placeholder="Status"
          options={[{ v: "todos", l: "Todos status" }, ...statuses.map((s) => ({ v: s, l: s }))]} />
        <FilterSelect value={fSub} onChange={(v) => { setFSub(v); setPage(1); }} placeholder="Submercado"
          options={[{ v: "todos", l: "Todos submercados" }, ...submarkets.map((s) => ({ v: s, l: s }))]} />
        <FilterSelect value={fType} onChange={(v) => { setFType(v); setPage(1); }} placeholder="Tipo"
          options={[{ v: "todos", l: "Compra e venda" }, ...types.map((s) => ({ v: s, l: s }))]} />
        <FilterSelect value={fDue} onChange={(v) => { setFDue(v); setPage(1); }} placeholder="Vencimento"
          options={[
            { v: "todos", l: "Qualquer vencimento" },
            { v: "30", l: "Vence em 30 dias" },
            { v: "90", l: "Vence em 90 dias" },
            { v: "365", l: "Vence em 12 meses" },
            { v: "vencidos", l: "Vencidos" },
          ]} />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
            Limpar filtros
          </Button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-brand-soft bg-brand-softer px-4 py-2.5 text-sm">
          <span className="font-medium text-brand-dark">{selected.length} selecionado(s)</span>
          <Button variant="outline" size="sm" onClick={() => exportCsv(contracts.filter((c) => selected.includes(c.id)))}>
            <Download className="mr-1 h-3.5 w-3.5" /> Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => { selected.forEach((id) => update(id, { status: "Encerrado" })); toast.success("Status atualizado para Encerrado"); setSelected([]); }}>
            Encerrar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setToDelete(selected)}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
          </Button>
          <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelected([])}>
            Limpar seleção
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-brand-softer/70 text-[11px] uppercase tracking-wider text-brand-dark/80">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <Checkbox
                    checked={allPageSelected}
                    aria-label="Selecionar todos"
                    onCheckedChange={(v) =>
                      setSelected((s) =>
                        v ? Array.from(new Set([...s, ...pageRows.map((r) => r.id)]))
                          : s.filter((id) => !pageRows.some((r) => r.id === id)))
                    }
                  />
                </th>
                <SortableTh label="Contrato" k="code" sort={sort} onSort={toggleSort} />
                <SortableTh label="Empresa" k="company" sort={sort} onSort={toggleSort} />
                <SortableTh label="Submercado" k="submarket" sort={sort} onSort={toggleSort} />
                <SortableTh label="Volume" k="volume" sort={sort} onSort={toggleSort} />
                <SortableTh label="Preço" k="price" sort={sort} onSort={toggleSort} />
                <SortableTh label="Vencimento" k="endDate" sort={sort} onSort={toggleSort} />
                <SortableTh label="Status" k="status" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3.5 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className="border-t border-border transition hover:bg-brand-softer/40">
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selected.includes(r.id)}
                      aria-label={`Selecionar ${r.code}`}
                      onCheckedChange={(v) => setSelected((s) => (v ? [...s, r.id] : s.filter((i) => i !== r.id)))}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-brand-dark">{r.code}</div>
                    <div className="text-xs text-muted-foreground">{r.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{r.company}</div>
                    <div className="text-xs text-muted-foreground">{r.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={"rounded-md px-2 py-0.5 text-[11px] font-semibold " + subTone[r.submarket]}>{r.submarket}</span>
                  </td>
                  <td className="px-6 py-4 tabular-nums">{r.volume.toLocaleString("pt-BR")} MWm</td>
                  <td className="px-6 py-4 tabular-nums">{brl(r.price)}</td>
                  <td className="px-6 py-4 text-muted-foreground tabular-nums">{fmtDate(r.endDate)}</td>
                  <td className="px-6 py-4">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", statusTone[r.status])}>{r.status}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        aria-label={`Editar ${r.code}`}
                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-brand-softer hover:text-brand-dark"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setToDelete([r.id])}
                          aria-label={`Excluir ${r.code}`}
                          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button aria-label="Mais ações" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { add({ ...r, name: `${r.name} (cópia)` }); toast.success("Contrato duplicado"); }}>
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportCsv([r])}>Exportar CSV</DropdownMenuItem>
                          {statuses.filter((s) => s !== r.status).map((s) => (
                            <DropdownMenuItem key={s} onClick={() => { update(r.id, { status: s }); toast.success(`Status alterado para ${s}`); }}>
                              Marcar como {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-softer text-brand">
              <FileX2 className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">
              {contracts.length === 0 ? "Nenhum contrato cadastrado" : "Nenhum resultado encontrado"}
            </div>
            <p className="max-w-sm text-xs text-muted-foreground">
              {contracts.length === 0
                ? "Cadastre seu primeiro contrato para acompanhar volume, preço e exposição."
                : "Ajuste a busca ou os filtros para visualizar contratos."}
            </p>
            {contracts.length === 0 ? (
              <Button size="sm" onClick={openNew} className="text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
                <Plus className="mr-1 h-4 w-4" /> Novo contrato
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={clearFilters}>Limpar filtros</Button>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-3 text-xs text-muted-foreground">
            <span>
              Exibindo {(current - 1) * perPage + 1}–{Math.min(current * perPage, filtered.length)} de {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Anterior</Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    "h-8 w-8 rounded-md border text-xs font-medium transition",
                    current === i + 1 ? "border-brand bg-brand text-white" : "border-border hover:border-brand-soft hover:text-brand-dark",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <Button variant="outline" size="sm" disabled={current === totalPages} onClick={() => setPage(current + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${editing.code}` : "Novo contrato"}</DialogTitle>
            <DialogDescription>
              {editing ? "Atualize as informações do contrato." : "Preencha os dados para adicionar ao portfólio."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <FormField label="Nome do contrato" error={errors.name} className="md:col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Suprimento anual" />
            </FormField>
            <FormField label="Empresa" error={errors.company}>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Alfa Indústria" />
            </FormField>
            <FormField label="Tipo">
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ContractType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Submercado">
              <Select value={form.submarket} onValueChange={(v) => setForm({ ...form, submarket: v as Submarket })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{submarkets.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Volume (MWm)" error={errors.volume}>
              <Input type="number" step="0.1" value={form.volume || ""} onChange={(e) => setForm({ ...form, volume: Number(e.target.value) })} placeholder="12,0" />
            </FormField>
            <FormField label="Preço contratado (R$/MWh)" error={errors.price}>
              <Input type="number" step="0.01" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="198,50" />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContractStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Data de início" error={errors.startDate}>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </FormField>
            <FormField label="Data de vencimento" error={errors.endDate}>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </FormField>
            <FormField label="Observações" className="md:col-span-2">
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas internas sobre o contrato…" />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
              {saving ? "Salvando…" : "Salvar contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toDelete && toDelete.length > 1 ? `Excluir ${toDelete.length} contratos?` : "Tem certeza que deseja excluir este contrato?"}
            </AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita e os indicadores serão atualizados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-soft", accent ? "border-brand-soft" : "border-border")}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

function FilterSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: { v: string; l: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[150px] rounded-lg border-border bg-card text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function SortableTh({ label, k, sort, onSort }: {
  label: string; k: SortKey; sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="px-6 py-3.5 text-left font-semibold">
      <button onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 transition hover:text-brand", active && "text-brand")}>
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

function FormField({ label, error, children, className }: {
  label: string; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
