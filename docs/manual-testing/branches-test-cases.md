# Casos de Teste Manuais — Módulo de Filiais

## CT-BRA-01: Visualização dos Cards de Filiais

- **Pré-condição**: Usuário autenticado.
- **Passos**:
  1. Acessar a rota `/filiais`.
  2. Verificar a disposição das unidades operacionais em grid de cards.
- **Resultado Esperado**:
  - Cada card exibe nome da unidade, CNPJ formatado (`00.000.000/0001-00`), endereço, telefone formatado e e-mail.
  - A filial atualmente selecionada no contexto exibe um indicador destacado "Ativa no Contexto" com borda de destaque.

---

## CT-BRA-02: Alternância de Filial Ativa (Branch Context Switch)

- **Pré-condição**: Pelo menos duas filiais ativas no sistema.
- **Passos**:
  1. Em um card de filial não selecionada, clicar em "Selecionar Unidade" ou utilizar a chave de filial no cabeçalho do App Shell.
  2. Observar as mudanças na interface e no armazenamento.
- **Resultado Esperado**:
  - O estado global de `BranchContext` é atualizado.
  - A chave `@AutoSync:branchId` e `@AutoSync:activeBranch` no `localStorage` são atualizadas.
  - É disparado o evento customizado `autosync:branch-changed`.
  - Todas as queries ativas do TanStack Query vinculadas ao `branchId` (Financeiro, Ordens de Serviço, Estoque) são invalidadas e recarregadas com o cabeçalho `x-branch-id`.

---

## CT-BRA-03: Cadastro de Nova Filial

- **Pré-condição**: Usuário autenticado como `ADMIN` ou com permissão `branch.manage`.
- **Passos**:
  1. Clicar em "+ Nova Filial".
  2. Preencher os campos do modal:
     - Nome: `Filial Leste`
     - CNPJ: `12.345.678/0001-09`
     - Endereço: `Av. Radial Leste, 2000 - São Paulo - SP`
     - Telefone: `(11) 2222-8888`
     - E-mail: `leste@autosync.com.br`
  3. Clicar em "Salvar Filial".
- **Resultado Esperado**:
  - A requisição `POST /branches` é enviada à API com os dados informados.
  - Toast de confirmação é exibido.
  - O novo card de filial é renderizado no grid imediatamente.

---

## CT-BRA-04: Inativação / Reativação de Filial com Confirmação

- **Pré-condição**: Filial secundária ativa no grid.
- **Passos**:
  1. No card da filial secundária, clicar em "Desativar".
  2. Verificar o modal de confirmação `<ConfirmDialog>`.
  3. Confirmar a inativação.
- **Resultado Esperado**:
  - Endpoint `PUT /branches/:id` é acionado com `{ active: false }`.
  - O card passa a exibir a badge "Inativa" com estilo esmaecido.
  - O botão de alternância transiciona para "Ativar".
  - A filial ativa no contexto do usuário não permite desativação direta.
