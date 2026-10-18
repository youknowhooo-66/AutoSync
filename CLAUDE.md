# AutoSync ERP

ERP web para oficinas mecânicas: ordens de serviço com aprovação de orçamento, estoque de peças baseado em movimentações, compras, financeiro e auditoria. Multi-empresa (`companyId`) e multi-filial (`branchId`), com RBAC.

Plataforma: **somente web** — SPA React servida por Nginx/Vercel + API REST. O Electron foi descontinuado: `apps/desktop` é legado e será removido; não altere nem adicione código nele.

## Monorepo (pnpm + Turborepo)

- `apps/api` (pacote `back`) — Express 5, Prisma 6, PostgreSQL 15, Redis + BullMQ. Worker de eventos em `src/shared/queue/EventsWorker.ts` (processo separado).
- `apps/web` (pacote `front`) — React 19, Vite, Tailwind 4, Radix/shadcn (`src/components/ui`), TanStack Query/Table, React Hook Form + Zod, Zustand.
- `packages/*` — modelo de domínio DDD (domain, application, infrastructure, read-models). **Não é importado por `apps/api` nem `apps/web`**: mudar ali não muda o comportamento da API.
- `docs/` — bounded contexts, agregados, state machine, event storming, permissões. Consulte antes de mudar regra de negócio.

## Comandos

```bash
pnpm install
pnpm dev                                   # api + web
pnpm --filter back run typecheck
pnpm --filter front run typecheck
pnpm --filter back run lint
pnpm --filter front run lint
pnpm test:env:up                           # Postgres 5436 + Redis 6380 para testes
pnpm --filter back run test                # precisa do test:env rodando
pnpm --filter front run test
pnpm test:e2e                              # Playwright
pnpm --filter back exec prisma migrate dev --name <nome>
```

CI (`.github/workflows/ci.yml`) roda lint, typecheck e testes de api/web e `pnpm build`. Rode o mesmo antes de push.

## API (`apps/api`)

- Módulos em `src/modules/<modulo>/`: `routes → controllers → useCases/services → repositories → Prisma`. Controller só valida entrada e delega; regra de negócio fica em use case/service; repository só acessa Prisma.
- Rotas registradas em `src/app.ts`. Tudo depois de `authMiddleware` é autenticado.
- **Multi-tenant:** toda query filtra por `companyId` vindo de `req.user.companyId` (carregado do banco pelo `authMiddleware`). Nunca use `companyId`/`branchId` de header, query ou body para autorizar — `tenantMiddleware` lê headers do cliente.
- Permissão: `rbacMiddleware(Permission.X)` (`src/modules/auth/middleware/rbacMiddleware.ts`; permissões e mapa por perfil em `src/modules/auth/rbac/`). Perfis: `ADMIN`, `MANAGER`, `STOCKIST`, `MECHANIC`, `FINANCIAL`, `ATTENDANT`. Toda rota nova precisa de `rbacMiddleware` — hoje só `serviceOrders` e `dashboard` usam; não copie o padrão das demais rotas, que estão sem checagem de perfil.
- `ensureRole` (`src/shared/middlewares`) não é usado; prefira `rbacMiddleware`.
- Erros: lance `AppError` (`src/shared/errors/AppError.ts`); o `errorHandler` formata a resposta.
- Valores monetários e quantidades usam `Prisma.Decimal`. Não converta para `number` para fazer conta.
- Estoque muda só via `InventoryMovement` (`IN`, `OUT`, `ADJUSTMENT`, `TRANSFER`, `RETURN`); nunca atualize saldo direto sem registrar movimentação.
- Escritas que tocam mais de uma tabela (OS + estoque + financeiro) vão em `prisma.$transaction`.
- Config via `env` de `src/shared/config/env.ts` (validado com Zod), não `process.env` direto. Log via `logger` de `src/shared/logger`, não `console`.
- Schema em `apps/api/prisma/schema.prisma`. Nunca edite migration já aplicada; crie uma nova.

## Web (`apps/web`)

- Rotas em `src/App.tsx`. Módulos ativos: `auth`, `dashboard`, `service-orders`, `inventory`, `clients`, `vehicles` e as páginas em `src/pages`.
- `src/modules/serviceOrders`, `stock`, `finance`, `financial` e `reports` não são referenciados por nenhuma rota — são duplicatas legadas, não edite.
- HTTP via `src/services/api.ts`; estado de servidor com TanStack Query; formulários com React Hook Form + Zod.
- Filial ativa vem do `BranchContext`.

## Testes

- Vitest em api e web; web usa Testing Library + MSW.
- Testes da API rodam em série contra Postgres real. O `tests/globalSetup.ts` executa `prisma db push --accept-data-loss`: garanta que `DATABASE_URL` aponta para o banco de teste (`apps/api/.env.test`, porta 5436), nunca para dev/prod.
- Testes que compartilham estado de banco usam `describe.sequential`.
