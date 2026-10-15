# Roadmap — Reestruturação Ethere

## Solicitação atual
- [x] Retirar geração térmica de toda a experiência, incluindo landing, Monitoramento e Intelligence.
- [x] Remover Clientes e Unidades de toda a experiência, sem alterar o banco.
- [x] Atualizar a landing com as funcionalidades atuais, mantendo o design.

## Etapa A — Base
- [x] Login real e dados no banco (já existia)
- [x] Tema claro/escuro (já existia; azul de ação do claro ajustado)
- [x] 5 níveis de acesso (Administrador, Gestor, Analista, Operacional, Leitura)
- [ ] Conversas do Intelligence no banco

## Etapa B — Gestão essencial
- [x] Módulo de cadastros retirado da experiência a pedido
- [x] ~~Gestão Operacional~~ removida da interface a pedido
- [ ] Alertas por pendências
- [ ] Convite/ativação de usuários

## Etapa C — Inteligência
- [ ] Central: período, comparação, fontes, histórico
- [ ] Intelligence: limite de 50 perguntas no Core
- [ ] BBCE/N5X como integração pendente

## Etapa D — Geradoras
- [ ] Importação de geração por CSV, gráficos por usina

## Etapa E — Cenários
- [ ] Cenários marcados como estimativa

## Transversal
- [ ] Visão Geral reorganizada, onboarding, revisão mobile

## Rodada sem backend (feita)
- [x] Visão Geral: painel "Requer atenção" no topo
- [x] Central: painel de Cenários (estimativa)
- [x] Monitoramento: bloco de fontes removido a pedido
- [x] Intelligence: contador de 50 perguntas/mês no Core (neste navegador)
- Deixado de lado por exigir backend: conversas no banco, importação de geração, histórico de análises, convites, alertas por pendência
- [x] Vínculos de cadastros retirados dos contratos; contraparte mantida como texto
- [x] Primeiro acesso sem etapa de unidade/usina; contrato e alerta opcionais
- [x] Revisão no celular (abas de Clientes corrigidas)

## Interpretação dos dados (doc "Evolução da interpretação")
- [x] Monitoramento: leitura diária/semanal/mensal do PLD
- [x] Central: cenários lado a lado (−X / referência / +X) com contratos que mais pesam
- [x] Contratos: leitura da carteira, comparação interna, análise individual, preço × PLD médio
- [x] Monitoramento: quadro de fontes removido; leitura do PLD acima do gráfico
- [x] Intelligence: sugestões de perguntas analíticas
- [x] Relatórios: construtor com nível de detalhe, revisão e interpretação
- [ ] Geradoras: análise de geração (depende de dados reais de geração)
