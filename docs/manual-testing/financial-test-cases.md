# Casos de Teste Manuais — Módulo Financeiro

## CT-FIN-01: Listagem de Lançamentos e Totais Consolidados

- **Pré-condição**: Usuário autenticado como `ADMIN` ou `FINANCIAL`.
- **Passos**:
  1. Navegar até a rota `/financeiro` via menu lateral ou atalho `Cmd+K`.
  2. Verificar o carregamento dos cards de métricas no topo da página:
     - Total A Receber (Pendente).
     - Total A Pagar (Pendente).
     - Balanço Operacional Projetado.
  3. Observar a tabela de lançamentos financeiros.
- **Resultado Esperado**:
  - Os valores monetários são exibidos no padrão BRL (`R$ X.XXX,XX`).
  - Lançamentos do tipo `RECEIVABLE` possuem badge verde e do tipo `PAYABLE` possuem badge rosa/vermelho.
  - Lançamentos com status `PAID` exibem badge "Pago", enquanto `PENDING` exibe "Pendente".

---

## CT-FIN-02: Filtro Dinâmico por Tipo e Status

- **Pré-condição**: Existência de lançamentos a receber e a pagar no banco de dados.
- **Passos**:
  1. No seletor "Todos os Tipos", alterar para "A Receber (Entradas)".
  2. No seletor "Todos os Status", alterar para "Pendentes".
  3. Digitar um termo de busca no campo de texto (ex: "Troca de Óleo").
- **Resultado Esperado**:
  - A tabela filtra instantaneamente os registros sem recarregar a página.
  - A chamada de API envia os query params `type=RECEIVABLE&status=PENDING`.
  - O botão "Limpar Filtros" restaura a listagem completa.

---

## CT-FIN-03: Criação de Novo Lançamento Financeiro

- **Pré-condição**: Usuário com permissão `financial.manage`.
- **Passos**:
  1. Clicar no botão "+ Novo Lançamento".
  2. Preencher o formulário no modal:
     - Tipo: `A Pagar (Saída)`
     - Categoria: `Fornecedores Peças`
     - Valor Monetário: `1.250,00`
     - Data de Vencimento: `2026-09-15`
     - Descrição: `Compra de pastilhas de freio Lote #99`
  3. Clicar em "Salvar Lançamento".
- **Resultado Esperado**:
  - O modal é fechado após resposta HTTP 201 da API `/financial`.
  - É exibida notificação Toast informando "Lançamento criado com sucesso!".
  - A tabela e as métricas são invalidadas e atualizadas automaticamente via TanStack Query.

---

## CT-FIN-04: Baixa de Pagamento com Modal de Confirmação

- **Pré-condição**: Registro com status `PENDING` visível na tabela.
- **Passos**:
  1. Localizar um lançamento pendente e clicar no botão "Baixar".
  2. Observar o surgimento do modal `<ConfirmDialog>`:
     - Título: "Confirmar Baixa de Pagamento".
     - Descrição detalhada do valor e categoria a ser quitado.
  3. Clicar em "Confirmar Baixa".
- **Resultado Esperado**:
  - O endpoint `PATCH /financial/:id/pay` é invocado com `{ status: 'PAID' }`.
  - O modal fecha e a notificação Toast confirma a baixa.
  - O status do lançamento transiciona para "Pago" na tabela e os cards de métricas se recalculam.
