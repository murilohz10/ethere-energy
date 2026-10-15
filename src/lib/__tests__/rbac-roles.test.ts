import { describe, expect, it } from "vitest";
import { can } from "@/lib/rbac";
import { isOverdue } from "@/lib/api/operations";

describe("níveis de acesso", () => {
  it("Leitura não cria contratos nem exporta", () => {
    expect(can("Leitura", "contracts:create")).toBe(false);
    expect(can("Leitura", "reports:export")).toBe(false);
  });
  it("Operacional gerencia tarefas mas não edita contratos", () => {
    expect(can("Operacional", "operations:manage")).toBe(true);
    expect(can("Operacional", "contracts:edit")).toBe(false);
  });
  it("Analista exporta relatórios mas não gerencia tarefas", () => {
    expect(can("Analista", "reports:export")).toBe(true);
    expect(can("Analista", "operations:manage")).toBe(false);
  });
});

describe("tarefas atrasadas", () => {
  it("considera atrasada só tarefa aberta com prazo passado", () => {
    expect(isOverdue({ status: "Aberta", due_date: "2026-01-01" }, "2026-02-01")).toBe(true);
    expect(isOverdue({ status: "Concluída", due_date: "2026-01-01" }, "2026-02-01")).toBe(false);
  });
});
