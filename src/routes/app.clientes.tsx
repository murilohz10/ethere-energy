import { createFileRoute, redirect } from "@tanstack/react-router";

// Keep previously shared URLs working without restoring the retired module.
export const Route = createFileRoute("/app/clientes")({
  beforeLoad: () => { throw redirect({ to: "/app", replace: true }); },
});
