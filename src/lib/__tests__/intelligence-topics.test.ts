import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { excludeRetiredMarketMessages } from "@/lib/intelligence/topics";

const message = (id: string, role: UIMessage["role"], text: string): UIMessage => ({
  id, role, parts: [{ type: "text", text }],
});

describe("removed market topics", () => {
  it("removes thermal generation and its reply from restored conversations", () => {
    expect(excludeRetiredMarketMessages([
      message("1", "user", "Como evoluiu a geração térmica?"),
      message("2", "assistant", "A média foi 100 MWmed."),
      message("3", "user", "Como evoluiu o PLD?"),
      message("4", "assistant", "A série é demonstrativa."),
    ]).map((item) => item.id)).toEqual(["3", "4"]);
  });
  it("preserves hydrology and farm generation", () => {
    const messages = [message("1", "user", "Qual a geração da fazenda?"), message("2", "assistant", "Consulte hidrologia e PLD.")];
    expect(excludeRetiredMarketMessages(messages)).toEqual(messages);
  });
});