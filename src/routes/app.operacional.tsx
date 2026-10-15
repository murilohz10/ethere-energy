import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ListChecks, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCan, useContracts, useSession, useSettings } from "@/lib/store";
import {
  isOverdue, taskCategories, taskPriorities, taskStatuses, useTasks, useUnits, type Task,
} from "@/lib/api/operations";
import { Field, Pick, RowActions } from "./app.clientes";

export const Route = createFileRoute("/app/operacional")({
  head: () => ({
    meta: [
      { title: "Gestão Operacional · Ethere" },
      { name: "description", content: "Tarefas, pendências e prazos da operação de energia." },
      { property: "og:title", content: "Gestão Operacional · Ethere" },
      { property: "og:description", content: "Acompanhe tarefas, pendências e prazos ligados aos seus contratos." },
    ],
  }),
  component: OperationsPage,
});

const fmt = (d: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR") : "—");

function OperationsPage() {
  const { user } = useSession();
  const can = useCan();
  const editable = can("operations:manage");
  const tasks = useTasks(user?.companyId);
  const units = useUnits(user?.companyId);
  const { items: contracts } = useContracts();
  const { users } = useSettings();
  const [filter, setFilter] = useState("Abertas");
  const [form, setForm] = useState<Partial<Task> | null>(null);

  const list = useMemo(() => tasks.items.filter((t) =>
    filter === "Todas" ? true : filter === "Concluídas" ? t.status === "Concluída" : filter === "Atrasadas" ? isOverdue(t) : t.status !== "Concluída",
  ), [tasks.items, filter]);

  const counts = {
    open: tasks.items.filter((t) => t.status !== "Concluída").length,
    overdue: tasks.items.filter((t) => isOverdue(t)).length,
    done: tasks.items.filter((t) => t.status === "Concluída").length,
  };

  const blank: Partial<Task> = { title: "", description: "", category: "Pendência", priority: "Média", status: "Aberta", due_date: null, assignee_id: null, contract_id: null, unit_id: null };
  const name = (id: string | null, arr: { id: string; name: string }[]) => arr.find((x) => x.id === id)?.name ?? "—";

  const submit = () => {
    if (!form?.title?.trim()) return toast.error("Informe o título da tarefa.");
    tasks.save.mutate(
      { id: form.id, title: form.title.trim(), description: form.description ?? "", category: form.category, priority: form.priority, status: form.status, due_date: form.due_date || null, assignee_id: form.assignee_id || null, contract_id: form.contract_id || null, unit_id: form.unit_id || null, ...(form.id ? {} : { created_by: user?.id }) } as Partial<Task>,
      { onSuccess: () => { toast.success(form.id ? "Tarefa atualizada." : "Tarefa criada."); setForm(null); } },
    );
  };

  return (
    <>
      <PageHeader
        title="Gestão Operacional"
        description="Tarefas, pendências de documentação e prazos ligados a contratos e unidades."
        actions={editable && <Button size="sm" onClick={() => setForm(blank)}><Plus className="mr-1 h-4 w-4" />Nova tarefa</Button>}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[["Em aberto", counts.open], ["Atrasadas", counts.overdue], ["Concluídas", counts.done]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className={cn("mt-1 text-2xl font-semibold tabular-nums", l === "Atrasadas" && Number(v) > 0 && "text-destructive")}>{v}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["Abertas", "Atrasadas", "Concluídas", "Todas"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>

      {tasks.isLoading ? <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
        : tasks.error ? <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">Não foi possível carregar as tarefas.</p>
        : !list.length ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <ListChecks className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma tarefa neste filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr className="border-b border-border">
                <th className="p-3">Tarefa</th><th className="p-3">Categoria</th><th className="p-3">Prioridade</th><th className="p-3">Prazo</th><th className="p-3">Responsável</th><th className="p-3">Vínculo</th><th className="p-3">Status</th><th className="p-3" />
              </tr></thead>
              <tbody>{list.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-3"><p className="font-medium">{t.title}</p>{t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}</td>
                  <td className="p-3">{t.category}</td>
                  <td className="p-3">{t.priority}</td>
                  <td className={cn("p-3 tabular-nums", isOverdue(t) && "font-medium text-destructive")}>{fmt(t.due_date)}</td>
                  <td className="p-3 text-muted-foreground">{name(t.assignee_id, users)}</td>
                  <td className="p-3 text-muted-foreground">{t.contract_id ? contracts.find((c) => c.id === t.contract_id)?.code ?? "—" : name(t.unit_id, units.items)}</td>
                  <td className="p-3">{t.status}</td>
                  <td className="p-3 text-right">{editable && (
                    <div className="flex justify-end">
                      {t.status !== "Concluída" && <Button size="icon" variant="ghost" aria-label="Concluir" onClick={() => tasks.save.mutate({ id: t.id, status: "Concluída" }, { onSuccess: () => toast.success("Tarefa concluída.") })}><CheckCircle2 className="h-4 w-4" /></Button>}
                      <RowActions onEdit={() => setForm(t)} onDelete={() => tasks.remove.mutate(t.id, { onSuccess: () => toast.success("Tarefa removida.") })} />
                    </div>)}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
          {form && <div className="grid gap-3">
            <Field label="Título"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} /></Field>
            <Field label="Descrição"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Categoria"><Pick value={form.category!} options={taskCategories} onChange={(v) => setForm({ ...form, category: v })} /></Field>
              <Field label="Prioridade"><Pick value={form.priority!} options={taskPriorities} onChange={(v) => setForm({ ...form, priority: v })} /></Field>
              <Field label="Status"><Pick value={form.status!} options={taskStatuses} onChange={(v) => setForm({ ...form, status: v })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prazo"><Input type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value || null })} /></Field>
              <Field label="Responsável"><Pick value={form.assignee_id ?? "none"} options={["none", ...users.map((u) => u.id)]} labels={{ none: "Ninguém", ...Object.fromEntries(users.map((u) => [u.id, u.name])) }} onChange={(v) => setForm({ ...form, assignee_id: v === "none" ? null : v })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contrato"><Pick value={form.contract_id ?? "none"} options={["none", ...contracts.map((c) => c.id)]} labels={{ none: "Nenhum", ...Object.fromEntries(contracts.map((c) => [c.id, `${c.code} · ${c.name}`])) }} onChange={(v) => setForm({ ...form, contract_id: v === "none" ? null : v })} /></Field>
              <Field label="Unidade / usina"><Pick value={form.unit_id ?? "none"} options={["none", ...units.items.map((u) => u.id)]} labels={{ none: "Nenhuma", ...Object.fromEntries(units.items.map((u) => [u.id, u.name])) }} onChange={(v) => setForm({ ...form, unit_id: v === "none" ? null : v })} /></Field>
            </div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button><Button onClick={submit} disabled={tasks.save.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
