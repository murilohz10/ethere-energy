import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart, type UIMessage } from "ai";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Paperclip, RotateCcw, Database } from "lucide-react";
import {
  Conversation, ConversationContent, ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputTools, PromptInputSubmit,
  PromptInputButton, PromptInputSelect, PromptInputSelectContent, PromptInputSelectItem,
  PromptInputSelectTrigger, PromptInputSelectValue, usePromptInputAttachments, type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import logo from "@/assets/ethere-logo.png.asset.json";
import { cn } from "@/lib/utils";
import { useAlerts, useContracts, usePlan, useSession, useSettings } from "@/lib/store";
import { useCompanyProfile } from "@/lib/profile";
import { pageLabel, responseLevels, type CompanyContext, type ResponseLevel } from "@/lib/intelligence/context";

const STORAGE_KEY = "ethere.intelligence.v1";
const CHAT_ID = "ethere-intelligence";

const toolLabels: Record<string, string> = {
  get_current_market_data: "Dados atuais de mercado",
  get_pld_history: "Histórico do PLD",
  get_hydrology: "Reservatórios",
  get_contracts_summary: "Resumo de contratos",
  get_contract_expirations: "Vencimentos de contratos",
  get_portfolio_position: "Posição da carteira",
  calculate_exposure: "Exposição estimada",
  get_active_alerts: "Alertas configurados",
  get_generation_data: "Dados de geração",
};

const suggestions = [
  "O que aconteceu com o PLD hoje?",
  "Explique o comportamento do mercado nos últimos 30 dias.",
  "Analise este documento.",
  "Como esse dado se comportou recentemente?",
];

type Stored = { messages: UIMessage[]; level: ResponseLevel };

function readStored(): Stored {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch { /* ignore */ }
  return { messages: [], level: "Detalhado" };
}

const isTextFile = (f: FileUIPart) =>
  f.mediaType.startsWith("text/") || /json|csv|xml/.test(f.mediaType) || /\.(csv|txt|md|json)$/i.test(f.filename ?? "");

/** Planilhas/textos viram texto; PDFs e imagens seguem como arquivo. */
async function prepareFiles(files: FileUIPart[]) {
  const fileParts: FileUIPart[] = [];
  const texts: string[] = [];
  for (const f of files) {
    if (isTextFile(f)) {
      const content = await (await fetch(f.url)).text();
      texts.push(`[Arquivo anexado: ${f.filename ?? "arquivo"}]\n${content.slice(0, 60000)}`);
    } else if (f.mediaType === "application/pdf" || f.mediaType.startsWith("image/")) {
      fileParts.push(f);
    } else {
      toast.error(`Formato não suportado: ${f.filename ?? f.mediaType}`, { description: "Envie PDF, imagem, CSV ou texto." });
    }
  }
  return { fileParts, texts };
}

export function IntelligenceChat({ variant = "page" }: { variant?: "page" | "panel" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const { settings } = useSettings();
  const { contracts } = useContracts();
  const { alerts } = useAlerts();
  const { kind } = useCompanyProfile();
  const { plan } = usePlan();
  const [initial] = useState(readStored);
  const [level, setLevel] = useState<ResponseLevel>(initial.level);
  const [text, setText] = useState("");

  const contextRef = useRef<CompanyContext | null>(null);
  contextRef.current = {
    companyName: user?.company || settings.company.name,
    profile: kind,
    plan: plan.name,
    page: pageLabel(pathname),
    level,
    contracts: contracts.map(({ code, name, company, type, submarket, volume, price, startDate, endDate, status }) => ({
      code, name, company, type, submarket, volume, price, startDate, endDate, status,
    })),
    alerts: alerts.map(({ name, type, threshold, priority, enabled }) => ({ name, type, threshold, priority, enabled })),
  };

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/intelligence", body: () => ({ context: contextRef.current }) }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    id: CHAT_ID,
    messages: initial.messages,
    transport,
    onError: (e) => toast.error("Ethere Intelligence", { description: e.message || "Não foi possível responder agora." }),
  });

  useEffect(() => {
    if (status === "streaming" || status === "submitted") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, level }));
    } catch { /* quota */ }
  }, [messages, level, status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = async (msg: PromptInputMessage) => {
    const value = msg.text.trim();
    if (busy || (!value && !msg.files.length)) return;
    const { fileParts, texts } = await prepareFiles(msg.files);
    const fullText = [value || "Analise o arquivo anexado.", ...texts].join("\n\n");
    setText("");
    sendMessage({ text: fullText, files: fileParts });
  };

  const reset = () => {
    stop();
    setMessages([]);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const last = messages[messages.length - 1];
  const waiting = busy && (last?.role === "user" || !last?.parts.some((p) => p.type === "text" && p.text));

  return (
    <div className={cn("flex min-h-0 flex-col", variant === "page" ? "h-[calc(100vh-12rem)]" : "h-full")}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 truncate">
          <Database className="h-3.5 w-3.5 shrink-0" />
          {kind === "Fazenda de Energia" ? "Fazenda de geração" : "Comercializadora"} · {pageLabel(pathname)}
        </span>
        {messages.length > 0 && (
          <button onClick={reset} className="flex items-center gap-1 transition-colors hover:text-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Nova conversa
          </button>
        )}
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className={cn(variant === "panel" ? "px-4" : "px-2 sm:px-6")}>
          {messages.length === 0 ? (
            <Intro onPick={(s) => void submit({ text: s, files: [] })} />
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent
                  className={cn(
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent px-0 text-foreground",
                  )}
                >
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      if (m.role === "user") {
                        const shown = part.text.split("\n\n[Arquivo anexado:")[0];
                        const n = (part.text.match(/\[Arquivo anexado:/g) ?? []).length;
                        return (
                          <div key={i} className="whitespace-pre-wrap text-sm">
                            {shown}
                            {n > 0 && <div className="mt-1 text-xs opacity-80">{n} arquivo(s) anexado(s)</div>}
                          </div>
                        );
                      }
                      return <MessageResponse key={i}>{part.text}</MessageResponse>;
                    }
                    if (part.type === "file") {
                      return (
                        <div key={i} className="flex items-center gap-1.5 text-xs opacity-80">
                          <Paperclip className="h-3 w-3" /> {part.filename ?? "arquivo"}
                        </div>
                      );
                    }
                    if (part.type.startsWith("tool-")) {
                      const t = part as Extract<UIMessage["parts"][number], { type: `tool-${string}` }> & {
                        state: "input-streaming" | "input-available" | "output-available" | "output-error";
                        input?: unknown; output?: unknown; errorText?: string;
                      };
                      const name = part.type.slice(5);
                      return (
                        <Tool key={i} defaultOpen={false} className="my-2">
                          <ToolHeader type={t.type} state={t.state} title={`Consulta: ${toolLabels[name] ?? name}`} />
                          <ToolContent>
                            <ToolInput input={t.input} />
                            <ToolOutput output={t.output} errorText={t.errorText} />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {waiting && (
            <div className="px-1 text-sm">
              <Shimmer>Consultando os dados…</Shimmer>
            </div>
          )}
          {error && !busy && (
            <p className="text-xs text-red-500">Não foi possível concluir a resposta. Envie novamente quando quiser.</p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3">
        <PromptInput
          onSubmit={submit}
          accept="application/pdf,image/*,.csv,.txt,.md,.json,text/csv,text/plain"
          multiple
          maxFiles={5}
          maxFileSize={10 * 1024 * 1024}
          onError={(e) => toast.error(e.message)}
        >
          <PromptInputTextarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pergunte sobre o mercado ou a sua operação…"
            autoFocus
          />
          <PromptInputFooter>
            <PromptInputTools>
              <AttachButton />
              <PromptInputSelect value={level} onValueChange={(v) => setLevel(v as ResponseLevel)}>
                <PromptInputSelectTrigger className="h-8 w-auto gap-1 text-xs" aria-label="Nível de resposta">
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {responseLevels.map((l) => (
                    <PromptInputSelectItem key={l} value={l} className="text-xs">{l}</PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !text.trim()} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Informação e análise de dados. Para decisões estratégicas, consulte a Central de Inteligência.
        </p>
      </div>
    </div>
  );
}

function AttachButton() {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton onClick={() => attachments.openFileDialog()} aria-label="Anexar arquivo">
      <Paperclip className="h-4 w-4" />
      {attachments.files.length > 0 && <span className="text-xs">{attachments.files.length}</span>}
    </PromptInputButton>
  );
}

function Intro({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="mx-auto max-w-lg py-6">
      <img src={logo.url} alt="Ethere Intelligence" className="h-9 w-9 object-contain" />
      <h2 className="mt-4 text-base font-semibold tracking-tight">Olá! Eu sou o Ethere Intelligence.</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Posso ajudar você a entender os dados do mercado de energia, analisar informações da CCEE, ONS e ANA,
        interpretar dados da sua empresa e explicar documentos e planilhas.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Pergunte o que quiser sobre a sua operação ou sobre o mercado.</p>
      <div className="mt-5 grid gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground/90 transition hover:border-brand-soft hover:bg-brand-softer"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
