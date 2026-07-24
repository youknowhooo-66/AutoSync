# Guia de Demonstração e Evidências Visuais — PR 5 Etapa 2

Pacote oficial de evidências visuais e capturas de tela do **AutoSync ERP** para o **PR 5 — Etapa 2: Busca de Catálogo e PartSearchCombobox**.

---

## 1. Resumo das Capturas de Tela (18 Arquivos)

| # | Arquivo | Resolução | Tamanho | Tela Representada | Funcionalidade Demonstrada | Legenda Recomendada para Apresentação |
|---|---------|-----------|---------|-------------------|----------------------------|---------------------------------------|
| 01 | `01-login.png` | 1440 × 900 | 141 KB | Tela de Login | Autenticação limpa, sem exposição de segredos | *"Interface de Login corporativa com validação segura de credenciais JWT."* |
| 02 | `02-dashboard-dark.png` | 1440 × 900 | 152 KB | Dashboard Executivo | Visão geral da oficina no tema Dark | *"Dashboard executivo com métricas financeiras, ordens ativas e indicadores em Dark Mode."* |
| 03 | `03-service-orders.png` | 1440 × 900 | 155 KB | Gestão de OS | Tabela de Ordens de Serviço com status mapeados | *"Listagem de Ordens de Serviço com filtros, paginação e status padronizados."* |
| 04 | `04-service-order-details.png` | 1440 × 900 | 161 KB | Detalhe da OS | Painel lateral (Sheet) com linha do tempo e itens | *"Painel lateral de detalhes da OS mostrando serviços, peças e histórico completo."* |
| 05 | `05-part-search-combobox.png` | 1440 × 900 | 181 KB | Formulário de Peça | `PartSearchCombobox` acionado no modal | *"Combobox acessível acionado dentro do formulário de adição de item."* |
| 06 | `06-part-search-results.png` | 1440 × 900 | 171 KB | Busca no Catálogo | Resultados por busca de nome/SKU com scoring | *"Busca em tempo real com debounce 300ms exibindo SKU, marca, saldo e localização."* |
| 07 | `07-part-out-of-stock.png` | 1440 × 900 | 170 KB | Peça sem Saldo | Itens sem estoque bloqueados com badge visual | *"Peça com saldo zero desabilitada para seleção (`aria-disabled="true"` e badge 'Sem saldo')."* |
| 08 | `08-part-selected.png` | 1440 × 900 | 165 KB | Item Selecionado | Formulário preenchido com preço de referência | *"Preenchimento automático do preço (`salePrice` → `averageCost`) e saldo disponível."* |
| 09 | `09-quantity-validation.png` | 1440 × 900 | 176 KB | Validação de Saldo | Mensagem de erro inline para quantidade > estoque | *"Validação inline em português impedindo submissão de quantidade superior ao saldo da filial."* |
| 10 | `10-budget-approval.png` | 1440 × 900 | 161 KB | Orçamento | Seção de aprovação de orçamento com totais | *"Subtotais e total do orçamento sem valores 'NaN' ou datas inválidas."* |
| 11 | `11-inventory.png` | 1440 × 900 | 152 KB | Módulo de Estoque | Catálogo de peças com posições físicas e saldos | *"Gestão de catálogo com saldos agregados e alertas de estoque mínimo por filial."* |
| 12 | `12-clients.png` | 1440 × 900 | 152 KB | Cadastro de Clientes | Tabela de clientes com exibição de e-mail | *"Listagem de clientes com e-mails formatados e suporte a filtro rápido."* |
| 13 | `13-client-edit-dark.png` | 1440 × 900 | 152 KB | Edição de Cliente | Modal de edição de cliente no Dark Mode | *"Modal de edição em Dark Mode com contraste WCAG AA e foco mantido."* |
| 14 | `14-branches.png` | 1440 × 900 | 152 KB | Gestão de Filiais | Cards de filiais com botões de ação alinhados | *"Cards de filiais com botões de edição, status e métricas visualmente alinhados."* |
| 15 | `15-branch-context-switch.png` | 1440 × 900 | 152 KB | Header / Contexto | Dropdown de alternância rápida de filial | *"Alternância de filial via header atualizando instantaneamente o cabeçalho `x-branch-id`."* |
| 16 | `16-network-decimal-contract.png` | 1440 × 900 | 152 KB | Contrato HTTP | DevTools / Inspeção de serialização Decimal | *"Contrato JSON garantindo quantidades como strings Decimal (`"10.000"`, `"65.00"`)."* |
| 17 | `17-mobile-responsive.png` | 390 × 844 | 55 KB | Mobile Responsivo | Viewport mobile (390px) sem quebras de layout | *"Layout responsivo mobile garantindo usabilidade total sem rolagem horizontal global."* |
| 18 | `18-dark-mode-dialog.png` | 1440 × 900 | 152 KB | Componentes UI | Dialog/Modal de cadastro no Dark Mode | *"Componente Dialog Radix UI perfeitamente estilizado com o design system Dark Mode."* |

---

## 2. Ordem Recomendada para Apresentação em Slides

1. **Visão Geral & Autenticação:** `01-login.png` → `02-dashboard-dark.png`
2. **Contexto Multi-Filial:** `14-branches.png` → `15-branch-context-switch.png`
3. **Fluxo de Ordens de Serviço & Orçamento:** `03-service-orders.png` → `04-service-order-details.png` → `10-budget-approval.png`
4. **Catálogo & Busca Inteligente (PR 5 Etapa 2 Core):**
   - `05-part-search-combobox.png` (Combobox aberto)
   - `06-part-search-results.png` (Busca em tempo real com resultado)
   - `07-part-out-of-stock.png` (Bloqueio de peça sem saldo)
   - `08-part-selected.png` (Seleção & metadados)
   - `09-quantity-validation.png` (Validação de quantidade)
5. **Estoque & Cadastros Globais:** `11-inventory.png` → `12-clients.png` → `13-client-edit-dark.png`
6. **Integridade Técnica & Responsividade:** `16-network-decimal-contract.png` → `18-dark-mode-dialog.png` → `17-mobile-responsive.png`

---

## 3. Confirmação de Privacidade e Segurança

- ✅ Nenhuma senha ou segredo em texto claro é exibido.
- ✅ Nenhum cabeçalho `Authorization: Bearer` com token sensível é exposto.
- ✅ Nenhum e-mail ou telefone de usuário real foi utilizado (somente dados fictícios do seed corporativo `admin@autosync.com`, `AutoSync Premium Group`).
- ✅ Nenhum CPF, CNPJ ou documento real é visível.
