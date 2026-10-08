import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { UIMessage } from "ai";
import { companyContextSchema } from "@/lib/intelligence/context";
import { handleIntelligence } from "@/lib/intelligence/agent.server";

const bodySchema = z.object({
  messages: z.array(z.any()).min(1).max(200),
  context: companyContextSchema,
});

export const Route = createFileRoute("/api/intelligence")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Requisição inválida.", { status: 400 });
        return handleIntelligence(request, parsed.data.messages as UIMessage[], parsed.data.context);
      },
    },
  },
});
