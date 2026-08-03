import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/ethere/app-shell";
import { useSession, useAccessRole } from "@/lib/store";
import { canAccessPath } from "@/lib/rbac";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated } = useSession();
  const role = useAccessRole();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!canAccessPath(role, pathname)) {
      navigate({ to: "/app/acesso-negado", replace: true });
    }
  }, [isAuthenticated, role, pathname, navigate]);

  if (!isAuthenticated || !checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

