# AutoSync — Plano de ajustes para entrega (SOLID · ERP SaaS · Multitenancy)

## Contexto
O produto vai rodar num VPS da Hetzner (já preparado no `docker-compose.prod.yml`) para 1 empresa, 6 filiais e cerca de 50 usuários. Ele precisa estar pronto para receber outras empresas como SaaS.

A auditoria cobriu dependências, estrutura, camadas e isolamento entre empresas. Encontrou:
- furos críticos de isolamento entre empresas;
- duas arquiteturas em paralelo;
- código legado sem uso;
- dependências declaradas nos lugares errados;
- front-end sem checagem de tipos.

**Decisões:**
- Arquivar e remover os pacotes DDD em `packages/*`.
- Isolamento entre empresas em duas camadas: contexto de tenant + extensão Prisma no app, e RLS (Row-Level Security) no Postgres.
- Corte do go-live: pode ir ao ar com 1 empresa só com o isolamento no app. O RLS e as FKs compostas são obrigatórios **antes da 2ª empresa**.

**Fatos verificados no código:**
- O schema não tem `@db.Uuid` nem `@map`. As colunas são `text` e o nome é `"companyId"`.
- Express `^5.2.1`: erros em handlers async são encaminhados nativamente. Atenção: o curinga `*` vira `/*splat`.
- O hash de senha usa `bcryptjs`.
- O web guarda token e `companyId` em `localStorage` (`apps/web/src/modules/auth/state/auth.store.ts`).
- Só existe um `new PrismaClient`, em `shared/database/prismaClient.ts`; `src/config/prisma.ts` é reexport e tem 16 imports.
- `$queryRaw` é usado em `modules/stock/services/SearchPartsService.ts`; em `HealthService.ts` e `server.ts` é só `SELECT 1`.
- Workers: `shared/queue/EventsWorker.ts` e `modules/serviceOrders/workers/*`.

---

## Ordem de execução

### Passo 1 — Push e CI mínimo
- Fazer o push do commit pendente (precisa do GitHub App instalado).
- `ci.yml` passa a rodar: lint (api e web) → `tsc --noEmit` real no web (`tsc -p tsconfig.app.json`; hoje é no-op por causa do `"files": []`) → testes.
- O resto entra conforme ficar pronto.

### Passo 2 — Suíte de isolamento e regressões, antes de corrigir
- `apps/api/tests/integration/tenant-isolation.test.ts`:
  - Gera a lista de rotas a partir do router (`express-list-endpoints`) e **falha se alguma rota não tiver caso de teste**.
  - Inclui rotas que não são CRUD: PDF, dashboard, export, audit e search.
  - Duas empresas, A e B: o usuário de A ler, editar ou apagar recurso de B → 404.
  - Furos conhecidos marcados com `test.fails`: o CI fica verde e o teste quebra quando o furo for corrigido.
- Regressões de RBAC e mass assignment:
  - MECHANIC → 403 em `PUT /users/:id {role}`, `GET /companies` e `GET /audit`.
  - Trocar `companyId`, `branchId` ou `active` pelo body → rejeitado.

### Passo 3 — Fase 0: furos de segurança
| # | Ajuste | Onde |
|---|---|---|
| 0.1 | Remover `companies` da API do tenant: usuário só lê e edita a própria empresa (`id === tenant.companyId`). O onboarding de novas empresas passa a ser por CLI com a role de sistema. Sem SUPER_ADMIN dentro da API. | `modules/companies/routes/companies.routes.ts`, `PrismaCompanyRepository.ts` |
| 0.2 | Mass assignment: schemas Zod `.strict()` (allowlist) em **toda** rota de escrita. Só ADMIN altera `role` e `active`. Ninguém altera a própria role, nem `companyId`. | validators de cada módulo; `modules/users/controllers/UpdateUserController.ts`; middleware `validate()` que já existe em serviceOrders |
| 0.3 | `AuditLog.companyId` nullable (migração + backfill via `user.companyId`; logs sem usuário ficam `NULL`). Filtrar por empresa; acesso só para ADMIN/MANAGER. | `prisma/schema.prisma`, `controllers/AuditController.ts` |
| 0.4 | Validar que `partId`, `branchId`, `clientId` e `vehicleId` vindos do body pertencem ao tenant em todo use case que os recebe. Paliativo até as FKs compostas do passo 7. | `modules/stock/useCases/{StockEntry,StockTransfer,CreatePart}UseCase.ts`, use cases de OS |
| 0.5 | `x-branch-id` validado contra o banco (filial ∈ empresa; não-ADMIN só a própria filial). Repositórios nunca leem o header cru. | `shared/middlewares/tenantMiddleware.ts`, `authMiddleware.ts` |
| 0.6 | `rbacMiddleware` em todas as rotas, seguindo a matriz de `docs/PERMISSIONS.md`. | rotas dos módulos; `modules/auth/policy/PolicyEngine.ts` |
| 0.7 | **Login** — rate limit, hash e mensagens; detalhamento logo abaixo da tabela. | `app.ts`, `modules/auth/services/AuthenticateUserService.ts`, `modules/users/services/*` |
| 0.8 | Em produção, a API recusa subir com `CORS_ORIGIN='*'`. Tirar `x-company-id` e `x-tenant-id` dos headers aceitos: o tenant vem só do JWT e do banco. | `shared/config/env.ts`, `app.ts`, `apps/web/src/services/api.ts` |
| 0.9 | Gravar no audit só negações e mutações, não cada permissão concedida. | `PolicyEngine.ts:74` |
| 0.10 | Token em cookie `httpOnly; Secure; SameSite=Lax` em vez de `localStorage` (proteção contra roubo de sessão por XSS). Front e API ficam no mesmo domínio via Caddy, então não há CORS. | `auth.store.ts`, `api.ts`, `AuthenticateUserService`, `authMiddleware` (ler o cookie) |

**Detalhe do 0.7 (login):**
- Rate limit também em `/api/auth/login`.
- `trust proxy`: só aceitar o Caddy (configurar `trusted_proxies` no Caddy se houver Cloudflare na frente). Guardar o rate limit no Redis se houver mais de uma réplica.
- Trocar `bcryptjs` por `bcrypt` nativo, com cost 12. Fazer rehash no login bem-sucedido quando `getRounds(hash) < 12`.
- Quando o e-mail não existe, rodar `compare` contra um hash dummy, para o tempo de resposta não revelar quais e-mails existem.
- Checar `active` no login.
- Não logar o e-mail quando o login falha.

### Passo 4 — Remoções e client Prisma único
- Arquivar com a tag `archive/ddd-packages` e remover `packages/{domain,application,infrastructure,read-models,tests-e2e,types}`.
- Remover da API o legado sem uso:
  - `controllers/{Auth,Financial,Inventory,OS,Supplier,User}Controller.ts`
  - `src/middlewares/uploadMiddleware.ts`
  - `shared/infra/queue/QueueProvider.ts`
  - `shared/utils/Logger.ts`
- Remover `src/config/prisma.ts` e trocar os 16 imports por `shared/database`. Regra de ESLint `no-restricted-imports`: proibido importar `@prisma/client` (`PrismaClient`) e `prismaClient` fora de `shared/database/**` e `**/repositories/**`.
- Lixo no repositório:
  - Raiz: `fix-*.js`, `docs.zip`, `playwright-report/`, `test-results/`, `.cursor/`.
  - `apps/api/`: `fix-*.ts`, `refactor.ts`, `sync-types.ts`, `tsc_errors.txt`, `jest.config.js`.
  - `tools/fix-engine/`.

### Passo 5 — Contexto de tenant e extensão Prisma (isolamento no app)

**`shared/tenancy/TenantContext.ts`**
- `AsyncLocalStorage<{tenant:{companyId,userId,role,branchId}, inTransaction}>`.
- Fail-closed: acessar o banco sem contexto lança erro.

**`shared/database/prismaClient.ts`**
- `base` com a role `autosync_app` e nunca exportado.
- `prisma = base.$extends(...)`: em `$allModels.$allOperations`, se não estiver em transação, roda `base.$transaction([ $executeRaw\`SELECT set_config('app.company_id', ${companyId}, true)\`, query(args) ])`.
  - Usar `set_config(…, true)`, que aceita bind parameter e tem escopo de transação. Nunca `SET`/`SET LOCAL` com interpolação de string.
- Enquanto não houver RLS (até o passo 7), a mesma extensão injeta `where.companyId` como filtro no app.
- Rejeitar `companyId` em `data` de `update*`/`upsert`. No `create`, lançar erro se o `companyId` vier diferente do contexto.
- `tenantTransaction(fn)` é o único ponto que abre transação: chama `set_config` dentro e roda `fn(tx)` sob `TenantContext.runInTransaction`. `PrismaUnitOfWork` delega para ele. Lint barra `prisma.$transaction` direto.
- `type Db` = client sem `$transaction`, `$connect` etc. Os repositórios recebem `Db` pelo factory.

**`authMiddleware`**
- Abre o contexto com o `companyId` do JWT e carrega o usuário (se ele mudou de empresa, não acha → 401).
- Valida a filial (0.5).
- Chama `next()` num novo `TenantContext.run` com role e filial vindos do banco.

**Workers**
- O payload do job carrega `companyId`. O processor chama `TenantContext.run`.
- Arquivos: `shared/queue/EventsWorker.ts`, `modules/serviceOrders/workers/*`.

**SQL cru**
- `SearchPartsService` passa a rodar dentro de `tenantTransaction`, porque `$queryRaw` não passa por `$allModels`.

**Login e jobs de sistema (`runAsSystem`)**
- Usam um **client separado** com a role `autosync_system` (`BYPASSRLS`). Uma simples flag no ALS não basta.
- Lint restringe o import desse client a `modules/auth/**` e `jobs/**`.

**Testes**
- Os `test.fails` do passo 2 passam a falhar (furos corrigidos) e são convertidos em testes normais.

### Passo 6 — Operação mínima para o go-live

**Backup**
- WAL archiving com WAL-G ou pgBackRest, mais base backup diário para R2/B2, criptografado (LGPD). Isso dá recuperação ponto a ponto no tempo (PITR).
- `pg_dump` noturno criptografado como cópia lógica extra.

**Restore**
- Restaurar numa VM limpa usando `scripts/restore/restore.sh`, e documentar o tempo gasto.
- Gatilho de go-live: o restore precisa ter sido testado com sucesso.

**Monitoramento**
- GlitchTip ou Sentry para erros de api e web.
- Uptime check em `/health/ready`.
- Alertas de disco, CPU e memória do VPS.

**Migrations em serviço one-off no compose**
- Serviço `migrate` no compose (só ele recebe `OWNER_DATABASE_URL`).
- api e worker usam `depends_on: { migrate: { condition: service_completed_successfully } }` e só conhecem `DATABASE_URL` com a role `autosync_app`.
- Tirar o `migrate deploy` do CMD do Dockerfile. Isso resolve também `prisma` em deps (o CLI só fica na imagem do migrate).

**Roles do Postgres**
- `autosync_owner`, `autosync_app` e `autosync_system` são criadas pelo bootstrap da infra, sem senha no repositório.
- Grants e `ALTER DEFAULT PRIVILEGES` vão numa migration.

**Imagens**
- Tag de imagem por SHA, para o rollback ser só trocar a tag.

**→ GO-LIVE (1 empresa)**

### Passo 7 — Isolamento no banco, antes da 2ª empresa (antes do go-live se já houver 2+ empresas reais)

**Migration de RLS (roda como owner)**
- Para cada tabela com `"companyId"`: `ENABLE ROW LEVEL SECURITY` e policy `tenant_isolation`:
  - `USING ("companyId" = (SELECT NULLIF(current_setting('app.company_id', true), '')))`
  - mesma expressão em `WITH CHECK`.
- Em `"Company"`, comparar `"id"` em vez de `"companyId"`.
- O `NULLIF` evita o erro de `''` depois do primeiro uso da conexão. O `(SELECT …)` faz a expressão ser avaliada uma vez por statement.
- Grants para `autosync_app`: `SELECT/INSERT/UPDATE/DELETE` em tabelas e `USAGE/SELECT` em sequences. `REVOKE` em `_prisma_migrations`. `ALTER DEFAULT PRIVILEGES FOR ROLE autosync_owner`, para que tabelas novas não quebrem a API.

**`companyId` desnormalizado**
- Adicionar em `OSPart`, `OSService`, `InventoryMovement` e `PurchaseReceipt` (expand → backfill → contract).
- Com `@default(dbgenerated("NULLIF(current_setting('app.company_id', true), '')"))`, para que nested writes preencham sozinhos.

**FKs compostas**
- `@@unique([id, companyId])` nas entidades-alvo.
- Relações com `fields: [xId, companyId], references: [id, companyId], onDelete: Restrict`:
  - ServiceOrder→Client e →Vehicle
  - Vehicle→Client
  - OSPart→Part e →ServiceOrder
  - OSService→ServiceOrder
  - Stock→Part e →Branch
  - InventoryMovement→Part e →Branch
  - User→Branch
  - StockReservation, PurchaseRequest e PurchaseReceipt → seus pais
  - FinancialRecord→ServiceOrder
- Writes passam a usar escalares (`clientId`) em vez de `connect`. Nunca `SetNull`.
- O 0.4 deixa de ser o único guarda.

**Uniques e índices por tenant**
- `@@unique([companyId, plate])` em Vehicle, `[companyId, cnpj]` em Supplier, `[companyId, number]` em ServiceOrder, `[companyId, idempotencyKey]` em InventoryMovement.
- Continuam globais: `User.email`, `Company.document`, `Branch.cnpj`.
- `@@index([companyId, …])` em Branch, User, Client, Vehicle, Stock, Supplier, ServiceOrder (`status`, `createdAt`), FinancialRecord (`dueDate`, `status`) e AuditLog (`createdAt`).

**Numeração de OS**
- Tabela `CompanySequence`, inicializada com `MAX(number)` por empresa.
- `UPDATE … RETURNING` na mesma `tenantTransaction` do insert.

**Remover o filtro no app**
- Depois que o RLS estiver validado, retirar a injeção de `where.companyId` da extensão (fica só o `set_config`). Manter as rejeições de `companyId` em `data`.

**CI de RLS**
- Testes de integração conectam com a role `autosync_app`, não com `postgres`, que é superuser e ignora RLS.
- Check obrigatório no CI (precisa voltar vazio):
  `SELECT c.relname FROM pg_class c JOIN pg_attribute a ON a.attrelid=c.oid WHERE a.attname='companyId' AND c.relkind='r' AND NOT c.relrowsecurity;`
- Teste de FK cruzada: com `app.company_id = A`, inserir uma OS com `clientId` de B deve dar FK violation.

### Passo 8 — Dependências, SOLID por módulo, PWA e CD

**Dependências**
- `prisma` CLI só na imagem do migrate. Mover `@types/*` e `pino-pretty` para dev.
- Remover `express-async-errors` (Express 5 já encaminha erros async), `morgan`, `pg`, `multer`, `xlsx@0.18.5` (se importar planilha for requisito → `exceljs`), `@types/jest`, `@types/pino` e `ts-morph`.
- No web, remover `concurrently`, `wait-on`, `react-toastify` (migrar para sonner) e `react-icons` (migrar para lucide). Declarar ou remover `jspdf`.
- Unificar versões via `catalog:` do pnpm (typescript, vitest, @types/node, zod).

**Tooling**
- `apps/api/tsconfig.json` estende `tsconfig.base.json`, com os testes type-checked.
- typescript-eslint type-aware com `no-floating-promises` e `no-misused-promises`. Prettier.
- `strict` no web ligado módulo a módulo (catraca), sem segurar o go-live.

**SOLID, por módulo** (ordem: stock → serviceOrders → financial → demais)
- Um único composition root: os `index.ts` de cada módulo. Remover `container.ts` e `adapters/`.
- Nenhum use case ou controller importa client Prisma (hoje são 48 arquivos). Consultas vão para repositórios; operações com vários agregados usam `tenantTransaction` via `IUnitOfWork`.
- Migrar `Audit`, `Branch`, `Dashboard` e `PDF` legados para `modules/*`.
- Tirar a lógica de `financial.routes.ts`.
- Padronizar `serviceOrders` em `useCases/`, `repositories/`, `policies/` e `workers/`.
- Trocar `res.status(4xx/5xx)` e `throw new Error` por subclasses de `AppError` → `shared/middlewares/errorHandler.ts`.

**Web**
- Unificar módulos duplicados: `finance`×`financial`, `service-orders`×`serviceOrders`, `inventory`×`stock`.
- Remover `pages/` legadas.
- Renomear `back`/`front` para `@autosync/api`/`@autosync/web`.

**PWA**
- `vite-plugin-pwa` com service worker que cacheia **só assets, nunca respostas da API**, e fluxo de update (prompt ou `autoUpdate`).
- Manifest, ícones e revisão responsiva para tablet e celular.
- Descontinuar `apps/desktop` (Electron).

**CD**
- Build das imagens com tag SHA → GHCR → SSH no VPS → `migrate` → `up -d` → `scripts/smoke-p6.sh`.
- Migrations sempre em expand → backfill → contract.

**CI completo**
- `test:coverage` com os thresholds atuais.
- Playwright e2e.
- `pnpm audit --prod --audit-level=high`.
- Check de RLS e build das imagens.

---

## Verificação
- `pnpm install --frozen-lockfile && pnpm lint && pnpm -r typecheck && pnpm test` todos verdes.
- `tenant-isolation.test.ts` cobre 100% das rotas do router, sem nenhum `test.fails` restante depois do passo 5.
- Conectado como `autosync_app` no psql, dentro de `BEGIN`, com `set_config('app.company_id','<A>',true)`:
  - `SELECT` em `"Client"` não retorna linhas de B.
  - `INSERT` de OS com `clientId` de B dá FK violation.
- O check SQL de tabelas sem RLS volta vazio.
- `docker compose -f docker-compose.prod.yml up -d --build` sobe com `migrate` concluído antes da api, e `scripts/smoke-p6.sh` passa.
- Login via PWA no celular funciona, com o cookie `httpOnly` presente.
- Restore do backup numa VM limpa funciona, com o tempo documentado.
- `pnpm audit --prod` não aponta nada high nem critical.
