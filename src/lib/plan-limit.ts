import { toast } from "sonner";
import { limitMessages } from "./billing";

/** Aviso objetivo de limite do plano, com acesso direto ao upgrade. */
export function showPlanLimit(message: string) {
  toast.error(message, {
    description: limitMessages.upgrade,
    action: {
      label: "Ver Ethere Pro",
      onClick: () => window.location.assign("/app/configuracoes?tab=assinatura"),
    },
  });
}
