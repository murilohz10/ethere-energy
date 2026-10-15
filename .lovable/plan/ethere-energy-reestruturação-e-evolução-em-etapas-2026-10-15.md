# Ethere Energy — Reestruturação e Evolução (em etapas)

Vou seguir o documento inteiro, de A até E, em várias mensagens. Antes de cada etapa, confiro o que já existe e mantenho tudo o que funciona hoje. Preços (Core R$ 599,90 / Pro R$ 1.199,90) e limites ficam como estão.

## Etapa A — Base
- **Tema claro e escuro:** o escuro atual continua sendo o padrão. Crio uma versão clara com fundo branco e o azul #3FA9F5 nos botões e ações, e um botão para alternar entre os dois.
- **Login real:** entrar, cadastrar, sair e recuperar senha passam a usar o backend de verdade. A sessão simulada deixa de existir.
- **5 níveis de acesso:** Administrador, Gestor, Analista, Operacional e Leitura. As permissões são verificadas no banco e também na tela.
- **Dados salvos no banco:** contratos, alertas, relatórios, equipe, plano, permissões e conversas do Intelligence saem do navegador e vão para o banco, separados por empresa.
- **Histórico de Atividades:** registra automaticamente quem fez cada alteração.

## Etapa B — Gestão essencial
- **Novo módulo "Clientes e Unidades":** cadastro de contrapartes, clientes, unidades e usinas (fonte, capacidade, local).
- **Novo módulo "Gestão Operacional":** tarefas e pendências com responsável, prazo, status e ligação a um contrato.
- **Contratos:** ganham ligação com cliente ou usina, documentos em PDF salvos de verdade e campos de pendência.
- **Alertas:** passam a disparar também por pendências e vencimentos. A tela só mostra "notificação enviada" quando o envio for confirmado.
- **Administração:** convite, ativação e desativação de usuários.

## Etapa C — Inteligência
- **Central de Inteligência:** escolha de período, comparação entre períodos, fonte e data de cada dado, limitações de cada análise e histórico das análises geradas e salvas.
- **Ethere Intelligence:** passa a usar a conta logada e os dados do banco, conta o limite de 50 perguntas do Core e diferencia fatos, estimativas e hipóteses.
- **Referências de preço (BBCE, N5X):** a interface fica pronta, mas aparece como "integração pendente" até existir acesso legítimo a esses dados.

## Etapa D — Geradoras
- **Usinas e dados de geração:** importação do histórico de geração por planilha (CSV), com checagem de formato e de registros duplicados.
- **Gráficos e relatórios por usina:** comparação entre períodos e entre geração realizada e esperada (só quando houver dado para isso).
- **Clima e hidrologia:** a ligação com essas fontes fica preparada e aparece como pendente quando a fonte não estiver disponível.

## Etapa E — Evolução analítica
- **Cenários:** cenários de preço e de geração, sempre marcados como estimativa, com a metodologia explicada.
- **Previsões:** só serão oferecidas depois de testadas com dados históricos e com a margem de erro medida. Até lá, aparecem como recurso experimental.

## Transversal
- **Visão Geral reorganizada:** primeiro o que exige atenção, depois os indicadores, a evolução, as pendências, as análises e o histórico. Ganha filtros de período e de unidade ou usina.
- **Primeiro acesso:** passo a passo com usuários, unidades ou usinas, contratos e alertas. Nenhum passo opcional bloqueia o usuário.
- **Telas vazias, carregando e com erro:** todas as listas e tabelas passam a mostrar esses estados com clareza.
- **Celular e acessibilidade:** a plataforma é revisada em celular e no uso por teclado.
- **Dados de demonstração:** sempre identificados como demonstração.

## Detalhes técnicos
- Enum `app_role` ganha `Operacional` e `Leitura`; `can_write()` revisado; novas tabelas `counterparties`, `units`, `generation_assets`, `generation_data`, `operational_tasks`, `analyses`, `intelligence_conversations` com GRANT + RLS por `current_company_id()`.
- Store em `src/lib/store.ts` migrado para repositories (`src/lib/api/repositories.ts`) com TanStack Query; localStorage só para preferências de UI.
- Tema via classe `.light`/`.dark` em `src/styles.css`, tokens semânticos, `theme-toggle.tsx` existente reaproveitado.
- Rotas novas: `app.clientes.tsx`, `app.operacional.tsx`, `app.usinas.tsx` (ou aba dentro de Clientes e Unidades), registradas no RBAC e na sidebar.
- Testes vitest para regras de permissão por nível e limites de plano.
- Cada etapa termina com build sem erros e teste no navegador com conta real.
