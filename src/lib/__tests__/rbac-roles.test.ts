import { describe, expect, it } from "vitest";
import { can, allPermissions, normalizeMatrix } from "@/lib/rbac";

describe("níveis de acesso", () => {
  it("removes registry permissions from persisted matrices", () => {
    const matrix = normalizeMatrix(JSON.parse('{"Gestor":["registry:view","registry:manage","contracts:view"]}'));
    expect(matrix.Gestor).toEqual(["contracts:view"]);
    expect(allPermissions.some((p) => p.startsWith("registry:"))).toBe(false);
  });
  it("Leitura não cria contratos nem exporta", () => {
    expect(can("Leitura", "contracts:create")).toBe(false);
    expect(can("Leitura", "reports:export")).toBe(false);
  });
  it("Operacional consulta contratos mas não edita", () => {
    expect(can("Operacional", "contracts:view")).toBe(true);
    expect(can("Operacional", "contracts:edit")).toBe(false);
  });
  it("Analista exporta relatórios mas não cria contratos", () => {
    expect(can("Analista", "reports:export")).toBe(true);
    expect(can("Analista", "contracts:create")).toBe(false);
  });
});

