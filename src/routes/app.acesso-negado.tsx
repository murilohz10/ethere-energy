import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessRole } from "@/lib/store";
import { roleDescriptions } from "@/lib/rbac";

export const Route = createFileRoute("/app/acesso-negado")({
  ssr: false,
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  const role = useAccessRole();

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-softer text-brand">
          <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">403 · Acesso negado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu nível de acesso <span className="font-medium text-foreground">{role}</span> não permite abrir esta área.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{roleDescriptions[role]}</p>
        <Button asChild className="mt-6 text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
          <Link to="/app">Voltar ao dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
