# AutoSync ERP

> ERP para oficinas mecânicas: ordens de serviço, estoque de peças rastreável, financeiro e auditoria, com suporte multi-empresa e multi-filial.

O AutoSync centraliza a operação de uma oficina — do cadastro do cliente e do veículo até a aprovação do orçamento, a execução do serviço, a baixa de peças no estoque e o lançamento financeiro. Cada operação é isolada por empresa (`companyId`) e filial (`branchId`), registrada em log de auditoria e controlada por perfil de acesso (RBAC).

Roda como aplicação web (React + Vite), como app desktop (Electron, Windows/macOS) e é distribuído via Docker.

## Funcionalidades

- **Ordens de serviço** — ciclo `OPEN → IN_PROGRESS → AWAITING_PARTS → FINISHED/CANCELLED`, peças e serviços por OS, busca de peças com combobox paginado e fluxo de peça rápida.
- **Aprovação de orçamento** — aprovação assistida, via portal do cliente ou assinatura digital; alterações após aprovação invalidam o orçamento.
- **Estoque baseado em movimentações** — entradas, saídas, ajustes, transferências entre filiais e devoluções, com histórico completo e precisão `Decimal`.
- **Reserva de peças e compras** — reserva de estoque por OS (consumo parcial/total, liberação) e solicitações de compra com aprovação e recebimento parcial.
- **Cadastros** — clientes (PF/PJ), veículos, fornecedores, peças, usuários, empresas e filiais.
- **Financeiro** — contas a pagar/receber, status de pagamento e emissão de fatura em PDF.
- **Dashboard e relatórios** — indicadores operacionais e financeiros.
- **Segurança e auditoria** — JWT, RBAC (`ADMIN`, `MANAGER`, `STOCKIST`, `MECHANIC`, `FINANCIAL`, `ATTENDANT`), rate limiting, Helmet, correlation ID e trilha de auditoria por operação.
- **Observabilidade** — logs estruturados (Pino) e health checks (`/health/live`, `/health/ready`).

## Arquitetura

Monorepo `pnpm` + Turborepo, com o núcleo de negócio modelado em DDD (bounded contexts) e eventos de domínio processados de forma assíncrona.

```
apps/
  api/        # API REST — Express 5, Prisma, PostgreSQL, BullMQ (worker de eventos)
  web/        # Front-end — React 19, Vite, Tailwind 4, TanStack Query/Table, Zustand
  desktop/    # Shell Electron que empacota o front-end
packages/
  domain/          # Agregados, entidades e regras de negócio (sem dependência de infra)
  application/     # Casos de uso
  infrastructure/  # Adapters e publicação de eventos
  read-models/     # Projeções e views de leitura (CQRS), com replay de eventos
  types/           # Tipos compartilhados entre apps
  tests-e2e/       # Testes de integração entre camadas
docs/         # Domínio (event storming, agregados, state machine, ERD), testes e operação
```

Fluxo de uma requisição na API: `Route → Controller → Service → Repository → Prisma → PostgreSQL`. Eventos de domínio vão para uma fila no Redis (BullMQ) e são consumidos pelo `EventsWorker`, que roda como processo separado.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Back-end | Node.js 22, TypeScript, Express 5, Prisma 6, PostgreSQL 15, Redis 7, BullMQ, Zod, Pino, Swagger |
| Front-end | React 19, Vite, Tailwind CSS 4, Radix UI, TanStack Query/Table/Virtual, React Hook Form, Zustand, Recharts |
| Desktop | Electron |
| Testes | Vitest, Testing Library, MSW, Supertest, Playwright |
| Infra | Docker Compose, Nginx, GitHub Actions, Vercel (front-end) |

## Como rodar

Pré-requisitos: Node.js `>= 22.13`, pnpm `>= 11.1.2` e Docker.

```bash
pnpm install

# Tudo em containers (db, redis, api, worker, frontend) com hot reload
pnpm docker:dev
```

Ou rodando os apps localmente (subindo só PostgreSQL e Redis via Docker):

```bash
docker compose up -d db redis

# apps/api/.env
# DATABASE_URL=postgresql://postgres:postgres@localhost:5435/autosync?schema=public
# JWT_SECRET=<string com pelo menos 16 caracteres>
# REDIS_URL=redis://localhost:6379

pnpm --filter back exec prisma migrate deploy
pnpm --filter back seed
pnpm dev
```

A documentação da API (Swagger) fica em `/api-docs`. Detalhes de build e deploy com Docker em [DOCKER.md](./DOCKER.md).

### Variáveis de ambiente da API

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `DATABASE_URL` | sim | — | Connection string do PostgreSQL |
| `JWT_SECRET` | sim | — | Segredo de assinatura do JWT (mín. 16 caracteres) |
| `PORT` | não | `3333` | Porta HTTP |
| `REDIS_URL` | não | — | Connection string do Redis (tem prioridade sobre `REDIS_HOST`/`REDIS_PORT`) |
| `CORS_ORIGIN` | não | `*` | Origens permitidas — defina explicitamente em produção |
| `LOG_LEVEL` | não | `info` | Nível de log do Pino |

No front-end, `VITE_API_URL` aponta para a API.

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe todos os apps em modo desenvolvimento |
| `pnpm build` | Build de todos os pacotes |
| `pnpm lint` | Lint |
| `pnpm test` | Testes unitários e de integração |
| `pnpm test:api` / `pnpm test:web` | Testes só da API / só do front-end |
| `pnpm test:e2e` | Testes end-to-end com Playwright |
| `pnpm test:env:up` / `pnpm test:env:down` | Sobe/derruba o ambiente de testes em Docker |
| `pnpm docker:up` / `pnpm docker:down` | Sobe/derruba o ambiente de produção |

## Documentação

- Domínio: [bounded contexts](./docs/bounded-contexts.md), [agregados](./docs/aggregates-design.md), [event storming](./docs/EVENT_STORMING.md), [máquina de estados](./docs/STATE_MACHINE.md), [casos de uso](./docs/USE_CASES.md), [ERD](./docs/ERD_DIAGRAM.md)
- Permissões: [PERMISSIONS.md](./docs/PERMISSIONS.md)
- Contratos de eventos: [event-contracts.md](./docs/event-contracts.md)
- Operação: [resposta a incidentes](./docs/operations/incident-response.md)
- Testes manuais: [docs/manual-testing](./docs/manual-testing)
