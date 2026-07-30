# Plano de Testes Manuais Integrados — Módulos de Gestão (Financeiro, Filiais e Usuários/RBAC)

## 1. Visão Geral & Escopo

Este plano estabelece o protocolo oficial para validação manual dos módulos **Financeiro**, **Filiais** e **Usuários/RBAC** no AutoSync, executados na branch `feat/management-modules-manual-testing`.

O objetivo é garantir que a aplicação web proporcione uma experiência completa e robusta no navegador, consumindo a API real em ambiente Docker e respeitando a governança multi-tenant e isolamento por filial (*branch context*).

---

## 2. Objetivos de Teste

1. **Financeiro**:
   - Garantir a renderização dos lançamentos (A Receber / A Pagar) com totais e formatação BRL.
   - Validar a criação de novos lançamentos e baixa de pagamentos com confirmação via modal `<ConfirmDialog>`.
   - Verificar a aplicação correta dos filtros por busca, tipo e status.

2. **Filiais**:
   - Validar listagem, criação e edição de unidades operacionais (*branches*).
   - Testar a alternância da filial ativa no contexto do usuário e a propagação instantânea via evento `autosync:branch-changed`.
   - Testar ativação e inativação de filiais com confirmação visual.

3. **Usuários e Governança RBAC**:
   - Validar listagem e filtro de usuários por papel (`ADMIN`, `MANAGER`, `FINANCIAL`, `STOCKIST`, `MECHANIC`, `ATTENDANT`).
   - Testar a criação de usuários com senha inicial e edição sem vazamento ou exigência de senha.
   - Testar a inspeção de permissões efetivas no modal dedicado.
   - Garantir a aplicação das travas de interface com base no hook `usePermissions()`.

---

## 3. Matriz de Cobertura de Testes

| Módulo | Arquivo de Caso de Teste | Suíte Automatizada Associada |
| :--- | :--- | :--- |
| **Financeiro** | `financial-test-cases.md` | `src/tests/pages/FinancialModule.test.tsx` |
| **Filiais** | `branches-test-cases.md` | `src/tests/pages/BranchesModule.test.tsx` |
| **Usuários/RBAC** | `users-rbac-test-cases.md` | `src/tests/pages/UsersModule.test.tsx` |
| **Multi-Branch Context** | `management-modules-test-plan.md` | `src/tests/integration/BranchContextSwitch.test.tsx` |

---

## 4. Ambiente de Execução Pré-requisito

- **Docker Containers**: `autosync_db` (PostgreSQL na porta 5435), `autosync_redis` (6379), `autosync_api` (3000), `autosync_frontend` (80 ou 5173 dev).
- **URL Base**: `http://localhost:5173` ou `http://localhost:80`
- **Credenciais Iniciais**:
  - `admin@autosync.com` / `admin123` (Papel `ADMIN`)

---

## 5. Critérios de Aceitação

- [x] Nenhuma regressão nas 15 suítes automatizadas (72/72 testes passando).
- [x] Zero erros de compilação TypeScript (`tsc --noEmit`).
- [x] Bundle de produção gerado sem falhas (`vite build`).
- [x] Atualização dinâmica do header `x-branch-id` ao trocar de filial ativa no App Shell.
- [x] Modais de confirmação visual para todas as ações críticas.
