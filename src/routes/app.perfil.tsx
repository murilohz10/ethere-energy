import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Check, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import {
  fullName, initials, isEmail, isStrongPassword, maskCnpj, maskPhone, useSession, useSettings,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil · Ethere" },
      { name: "description", content: "Gerencie seus dados pessoais, empresa, senha e plano na Ethere." },
      { property: "og:title", content: "Meu perfil · Ethere" },
      { property: "og:description", content: "Dados pessoais, segurança e plano contratado." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateUser } = useSession();
  const { settings } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", role: "", company: "", cnpj: "", phone: "", email: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName, lastName: user.lastName, role: user.role,
        company: user.company, cnpj: user.cnpj, phone: user.phone, email: user.email,
      });
    }
  }, [user]);

  function save() {
    if (!form.firstName.trim()) return toast.error("Informe seu nome.");
    if (!isEmail(form.email)) return toast.error("E-mail inválido.");
    setSaving(true);
    setTimeout(() => {
      updateUser(form);
      setSaving(false);
      toast.success("Perfil atualizado.");
    }, 600);
  }

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) return toast.error("Escolha uma imagem de até 1,5 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      updateUser({ avatar: String(reader.result) });
      toast.success("Foto de perfil atualizada.");
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <PageHeader title="Meu perfil" description="Gerencie seus dados pessoais, acesso e plano contratado." />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={`Foto de ${fullName(user)}`} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full text-lg font-semibold text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
                  {initials(user)}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="Alterar foto"
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{fullName(user) || "Usuário"}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.role || "—"}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.company || "—"}</div>
            </div>
          </div>
          {user?.avatar && (
            <Button variant="ghost" size="sm" className="mt-4 text-muted-foreground" onClick={() => { updateUser({ avatar: "" }); toast.success("Foto removida."); }}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover foto
            </Button>
          )}

          <div className="mt-6 rounded-xl border border-brand-soft bg-brand-softer p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-dark">
              <Sparkles className="h-3.5 w-3.5" /> Plano contratado
            </div>
            <div className="mt-2 text-lg font-semibold tracking-tight">{user?.plan || settings.plan}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {(user?.plan || settings.plan) === "Professional"
                ? "Contratos ilimitados, alertas avançados, análises por IA e relatórios trimestrais."
                : "Monitoramento do PLD, até 20 contratos, alertas essenciais e relatórios mensais."}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-brand-dark">
              <Check className="h-3.5 w-3.5" /> Trial ativo · 12 dias restantes
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="text-sm font-semibold">Dados pessoais</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nome" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Field label="Sobrenome" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <Field label="Cargo" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
            <Field label="Empresa" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: maskCnpj(v) })} />
            <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: maskPhone(v) })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={save} disabled={saving} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
              {saving ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Salvando…</> : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </div>

      <PasswordCard />
    </>
  );
}

function PasswordCard() {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return toast.error("Informe a senha atual.");
    if (!isStrongPassword(next)) return toast.error("A nova senha deve ter ao menos 8 caracteres.");
    if (next !== confirm) return toast.error("As senhas não coincidem.");
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setCurrent(""); setNext(""); setConfirm("");
      toast.success("Senha alterada com sucesso.");
    }, 700);
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-brand" /> Segurança
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Senha atual</Label>
          <div className="relative">
            <Input type={show ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} className="pr-10" />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nova senha</Label>
          <Input type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Confirmar nova senha</Label>
          <Input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="outline" disabled={saving} className={cn(saving && "opacity-70")}>
          {saving ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Alterando…</> : "Alterar senha"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
