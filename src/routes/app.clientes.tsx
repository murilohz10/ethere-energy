import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Factory, Loader2, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCan, useSession } from "@/lib/store";
import { useCompanyProfile } from "@/lib/profile";
import {
  counterpartyKinds,
  generationSources,
  unitKinds,
  useCounterparties,
  useUnits,
  type Counterparty,
  type Unit,
} from "@/lib/api/operations";
import { Field, Pick, RowActions } from "@/components/ethere/form-bits";

export const Route = createFileRoute("/app/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes e Unidades · Ethere" },
      {
        name: "description",
        content: "Cadastro de clientes, contrapartes, unidades consumidoras e usinas.",
      },
      { property: "og:title", content: "Clientes e Unidades · Ethere" },
      {
        property: "og:description",
        content: "Organize clientes, contrapartes, unidades e usinas da sua empresa.",
      },
    ],
  }),
  component: ClientsPage,
});

const SUBMARKETS = ["SE/CO", "S", "NE", "N"];

function ClientsPage() {
  const { user } = useSession();
  const { isFarm } = useCompanyProfile();
  const can = useCan();
  const editable = can("registry:manage");
  const cps = useCounterparties(user?.companyId);
  const units = useUnits(user?.companyId);

  return (
    <>
      <PageHeader
        title="Clientes e Unidades"
        description={
          isFarm
            ? "Usinas, compradores e contrapartes dos seus contratos de venda."
            : "Clientes, fornecedores, contrapartes e unidades consumidoras da carteira."
        }
      />
      <Tabs defaultValue={isFarm ? "unidades" : "clientes"}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="clientes">
            <Users className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Clientes e contrapartes</span><span className="sm:hidden">Clientes</span>&nbsp;({cps.items.length})
          </TabsTrigger>
          <TabsTrigger value="unidades">
            <Factory className="mr-1.5 h-4 w-4" />
            {isFarm ? "Usinas" : "Unidades e usinas"} ({units.items.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clientes" className="mt-6">
          <CounterpartyList data={cps} editable={editable} />
        </TabsContent>
        <TabsContent value="unidades" className="mt-6">
          <UnitList data={units} cps={cps.items} editable={editable} isFarm={isFarm} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function State({
  loading,
  error,
  empty,
  label,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  label: string;
}) {
  if (loading)
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  if (error)
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Não foi possível carregar os dados. Atualize a página.
      </p>
    );
  if (empty)
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <Building2 className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      </div>
    );
  return null;
}

const emptyCp: Partial<Counterparty> = {
  kind: "Cliente",
  name: "",
  document: "",
  email: "",
  phone: "",
  notes: "",
};

function CounterpartyList({
  data,
  editable,
}: {
  data: ReturnType<typeof useCounterparties>;
  editable: boolean;
}) {
  const [form, setForm] = useState<Partial<Counterparty> | null>(null);
  const submit = () => {
    if (!form?.name?.trim()) return toast.error("Informe o nome.");
    data.save.mutate(
      {
        id: form.id,
        kind: form.kind,
        name: form.name.trim(),
        document: form.document ?? "",
        email: form.email ?? "",
        phone: form.phone ?? "",
        notes: form.notes ?? "",
      },
      {
        onSuccess: () => {
          toast.success(form.id ? "Cadastro atualizado." : "Cadastro criado.");
          setForm(null);
        },
      },
    );
  };
  return (
    <>
      {editable && (
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setForm(emptyCp)}>
            <Plus className="mr-1 h-4 w-4" />
            Novo cadastro
          </Button>
        </div>
      )}
      <State
        loading={data.isLoading}
        error={data.error}
        empty={!data.items.length}
        label="Nenhum cliente ou contraparte cadastrado ainda."
      />
      {!!data.items.length && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">Nome</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">CNPJ/CPF</th>
                <th className="p-3">Contato</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.kind}</td>
                  <td className="p-3 text-muted-foreground">{c.document || "—"}</td>
                  <td className="p-3 text-muted-foreground">{c.email || c.phone || "—"}</td>
                  <td className="p-3 text-right">
                    {editable && (
                      <RowActions
                        onEdit={() => setForm(c)}
                        onDelete={() =>
                          data.remove.mutate(c.id, {
                            onSuccess: () => toast.success("Cadastro removido."),
                          })
                        }
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar cadastro" : "Novo cadastro"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid gap-3">
              <Field label="Nome">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={160}
                />
              </Field>
              <Field label="Tipo">
                <Pick
                  value={form.kind!}
                  options={counterpartyKinds}
                  onChange={(v) => setForm({ ...form, kind: v })}
                />
              </Field>
              <Field label="CNPJ/CPF">
                <Input
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                  maxLength={20}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="E-mail">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={160}
                  />
                </Field>
                <Field label="Telefone">
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={30}
                  />
                </Field>
              </div>
              <Field label="Observações">
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  maxLength={500}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={data.save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UnitList({
  data,
  cps,
  editable,
  isFarm,
}: {
  data: ReturnType<typeof useUnits>;
  cps: Counterparty[];
  editable: boolean;
  isFarm: boolean;
}) {
  const blank: Partial<Unit> = {
    kind: isFarm ? "Usina" : "Unidade consumidora",
    name: "",
    source: "",
    capacity_mw: null,
    submarket: "SE/CO",
    city: "",
    state: "",
    active: true,
    counterparty_id: null,
  };
  const [form, setForm] = useState<Partial<Unit> | null>(null);
  const submit = () => {
    if (!form?.name?.trim()) return toast.error("Informe o nome.");
    if (form.capacity_mw != null && (isNaN(form.capacity_mw) || form.capacity_mw < 0))
      return toast.error("Capacidade inválida.");
    data.save.mutate(
      {
        id: form.id,
        kind: form.kind,
        name: form.name.trim(),
        source: form.kind === "Usina" ? (form.source ?? "") : "",
        capacity_mw: form.capacity_mw,
        submarket: form.submarket,
        city: form.city ?? "",
        state: (form.state ?? "").toUpperCase().slice(0, 2),
        active: form.active,
        counterparty_id: form.counterparty_id || null,
      },
      {
        onSuccess: () => {
          toast.success(form.id ? "Unidade atualizada." : "Unidade criada.");
          setForm(null);
        },
      },
    );
  };
  const cpName = (id: string | null) => cps.find((c) => c.id === id)?.name ?? "—";
  return (
    <>
      {editable && (
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={() => setForm(blank)}>
            <Plus className="mr-1 h-4 w-4" />
            {isFarm ? "Nova usina" : "Nova unidade"}
          </Button>
        </div>
      )}
      <State
        loading={data.isLoading}
        error={data.error}
        empty={!data.items.length}
        label={
          isFarm
            ? "Cadastre sua primeira usina para acompanhar a geração."
            : "Nenhuma unidade cadastrada ainda."
        }
      />
      {!!data.items.length && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">Nome</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Fonte</th>
                <th className="p-3">Capacidade</th>
                <th className="p-3">Submercado</th>
                <th className="p-3">Local</th>
                <th className="p-3">Vínculo</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">
                    {u.name}
                    {!u.active && (
                      <span className="ml-2 text-xs text-muted-foreground">(inativa)</span>
                    )}
                  </td>
                  <td className="p-3">{u.kind}</td>
                  <td className="p-3">{u.source || "—"}</td>
                  <td className="p-3 tabular-nums">
                    {u.capacity_mw != null
                      ? `${Number(u.capacity_mw).toLocaleString("pt-BR")} MW`
                      : "—"}
                  </td>
                  <td className="p-3">{u.submarket}</td>
                  <td className="p-3 text-muted-foreground">
                    {[u.city, u.state].filter(Boolean).join("/") || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">{cpName(u.counterparty_id)}</td>
                  <td className="p-3 text-right">
                    {editable && (
                      <RowActions
                        onEdit={() => setForm(u)}
                        onDelete={() =>
                          data.remove.mutate(u.id, {
                            onSuccess: () => toast.success("Unidade removida."),
                          })
                        }
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form?.id ? "Editar" : "Nova"} {form?.kind === "Usina" ? "usina" : "unidade"}
            </DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid gap-3">
              <Field label="Nome">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={160}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <Pick
                    value={form.kind!}
                    options={unitKinds}
                    onChange={(v) => setForm({ ...form, kind: v })}
                  />
                </Field>
                {form.kind === "Usina" && (
                  <Field label="Fonte">
                    <Pick
                      value={form.source || "Solar"}
                      options={generationSources}
                      onChange={(v) => setForm({ ...form, source: v })}
                    />
                  </Field>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacidade (MW)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.capacity_mw ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        capacity_mw: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Submercado">
                  <Pick
                    value={form.submarket!}
                    options={SUBMARKETS}
                    onChange={(v) => setForm({ ...form, submarket: v })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <Field label="Cidade">
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    maxLength={80}
                  />
                </Field>
                <Field label="UF">
                  <Input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    maxLength={2}
                  />
                </Field>
              </div>
              <Field label="Cliente / contraparte vinculada">
                <Pick
                  value={form.counterparty_id ?? "none"}
                  options={["none", ...cps.map((c) => c.id)]}
                  labels={{
                    none: "Sem vínculo",
                    ...Object.fromEntries(cps.map((c) => [c.id, c.name])),
                  }}
                  onChange={(v) => setForm({ ...form, counterparty_id: v === "none" ? null : v })}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={data.save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
