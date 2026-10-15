/**
 * Cadastros (clientes/contrapartes, unidades/usinas) e tarefas operacionais.
 * Isolamento por empresa garantido pelo banco (RLS + company_id).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage, toAppError } from "./errors";

export const counterpartyKinds = ["Cliente", "Fornecedor", "Contraparte", "Consumidor"] as const;
export const unitKinds = ["Unidade consumidora", "Usina"] as const;
export const generationSources = [
  "Solar",
  "Eólica",
  "Hidrelétrica",
  "PCH",
  "Biomassa",
  "Outra",
] as const;
export const taskCategories = [
  "Pendência",
  "Documentação",
  "Validação",
  "Vencimento",
  "Manutenção",
  "Faturamento",
] as const;
export const taskPriorities = ["Alta", "Média", "Baixa"] as const;
export const taskStatuses = ["Aberta", "Em andamento", "Concluída"] as const;

export type Counterparty = {
  id: string;
  kind: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
};
export type Unit = {
  id: string;
  kind: string;
  name: string;
  source: string;
  capacity_mw: number | null;
  submarket: string;
  city: string;
  state: string;
  active: boolean;
  counterparty_id: string | null;
  created_at: string;
};
export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  assignee_id: string | null;
  contract_id: string | null;
  unit_id: string | null;
  created_at: string;
};

type TableName = "counterparties" | "units" | "operational_tasks";

function useTable<T extends { id: string }>(table: TableName, companyId?: string) {
  const qc = useQueryClient();
  const key = [table, companyId];
  const query = useQuery({
    queryKey: key,
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw toAppError(error);
      return (data ?? []) as unknown as T[];
    },
  });
  const onError = (e: unknown) =>
    toast.error("Não foi possível salvar.", { description: errorMessage(e) });
  const save = useMutation({
    mutationFn: async (row: Partial<T> & { id?: string }) => {
      const { id, ...rest } = row as Record<string, unknown>;
      const res = id
        ? await supabase
            .from(table)
            .update(rest as never)
            .eq("id", id as string)
        : await supabase.from(table).insert({ ...rest, company_id: companyId } as never);
      if (res.error) throw toAppError(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await supabase.from(table).delete().eq("id", id);
      if (res.error) throw toAppError(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError,
  });
  return { ...query, items: query.data ?? [], save, remove };
}

export const useCounterparties = (companyId?: string) =>
  useTable<Counterparty>("counterparties", companyId);
export const useUnits = (companyId?: string) => useTable<Unit>("units", companyId);
export const useTasks = (companyId?: string) => useTable<Task>("operational_tasks", companyId);

/** Tarefa vencida: não concluída e com prazo anterior a hoje. */
export function isOverdue(
  task: Pick<Task, "status" | "due_date">,
  today = new Date().toISOString().slice(0, 10),
) {
  return task.status !== "Concluída" && !!task.due_date && task.due_date < today;
}
