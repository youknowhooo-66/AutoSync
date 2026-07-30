
# Implementation Roadmap for AutoSync ERP Modules

This document outlines the detailed plan for generating the base modules of the AutoSync ERP backend, following a scalable enterprise architecture.

## Objective
Generate the complete backend modules following a layered architecture (Controller, Service, Repository, DTO) with Dependency Injection, multi-tenancy support, and clean code principles.

## Stack
- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Monorepo (apps/api, apps/web, apps/desktop)

## Modules to be Generated
1. clients
2. vehicles
3. serviceOrders
4. stock
5. financial
6. users
7. companies
8. auth

## Architecture Overview
Each module will reside in `apps/api/src/modules/{module}/` and adhere to the following structure:

```
apps/api/src/modules/{module}/
├── controllers/
│   ├── Create{Module}Controller.ts
│   ├── Update{Module}Controller.ts
│   ├── Delete{Module}Controller.ts
│   └── List{Module}Controller.ts
├── services/
│   ├── Create{Module}Service.ts
│   ├── Update{Module}Service.ts
│   ├── Delete{Module}Service.ts
│   └── List{Module}Service.ts
├── repositories/
│   ├── I{Module}Repository.ts
│   └── Prisma{Module}Repository.ts
├── dtos/
│   ├── Create{Module}DTO.ts
│   └── Update{Module}DTO.ts
├── routes/
│   └── {module}.routes.ts
└── index.ts (Dependency Injection Factory)
```

## Mandatory Rules & Guidelines

### 1. CONTROLLER:
- Only `handle(req, res)` method.
- No business logic.
- Calls service via factory.

### 2. SERVICE (CORE BUSINESS LOGIC):
- All business logic here.
- Duplication validation.
- `companyId` validation (mandatory multi-tenant).
- Uses repository via interface.
- `execute()` method.
- Throws `AppError` on errors.

### 3. REPOSITORY:
- Only Prisma access.
- No business logic.
- Standard methods: `create`, `findById`, `findManyByCompany`, `update`, `delete`, `findByName` (when applicable).

### 4. DTO:
- TypeScript typed.
- `companyId` mandatory.
- No `any`.

### 5. MULTI-TENANT:
- ALL entities must have `companyId`.
- ALL queries must filter by `companyId`.

### 6. CLEAN CODE:
- Small functions.
- Clear names.
- No duplication.
- No logic in the controller.

### 7. DEPENDENCY INJECTION:
- Services receive repository via constructor.
- Instantiated via `index.ts` factory.

## Pattern Flow
`Controller` → `Service` → `Repository` → `Prisma` → `PostgreSQL`

## Modules Status

This section tracks the progress of each module generation.

### Completed Modules:
*   [x] `clients`
*   [x] `vehicles`
*   [x] `serviceOrders`
*   [x] `stock`
*   [x] `financial`
*   [x] `users`
*   [x] `companies`
*   [x] `auth`

## Next Steps for Integration and Further Development

### 1. Main Application Integration

*   **Route Registration:** Ensure all module routes (`clientsRoutes`, `vehiclesRoutes`, etc.) are properly registered in the main Express application setup (e.g., `apps/api/src/app.ts` or `apps/api/src/server.ts`).
*   **Global Error Handling:** Confirm that a global error handling middleware is correctly set up to catch and format `AppError` exceptions gracefully.

### 2. Configuration and Environment

*   **Environment Variables (`.env`):** Define and manage critical configurations such as:
    *   `DATABASE_URL` (PostgreSQL connection string)
    *   `AUTH_JWT_SECRET` (Secret key for JWT signing)
    *   `AUTH_JWT_EXPIRES_IN` (Token expiration time)
*   **Prisma Client:** Verify `prismaClient` is correctly configured to read from environment variables for database connection.
*   **Auth Configuration:** Implement the `authConfig` object (e.g., `apps/api/src/shared/config/auth.ts`) to hold JWT-related settings.

### 3. Security Enhancements

*   **Authentication Middleware:** Implement middleware to protect routes by verifying JWTs and attaching user information to the request object.
*   **Authorization Middleware:** Develop middleware for role-based access control to authorize actions on specific routes.
*   **Password Hashing Library:** Install `bcryptjs` if not already present (`pnpm add bcryptjs` or `npm install bcryptjs`).
*   **Input Validation:** Enhance input validation beyond basic checks, potentially using libraries like `zod` or `class-validator` within DTOs or services.

### 4. Testing

*   **Unit Tests:** Create comprehensive unit tests for all services, controllers, and repository methods.
*   **Integration Tests:** Develop integration tests to verify the end-to-end flow of requests and responses across modules.

### 5. Further ERP Features

*   **Advanced Business Logic:** Implement complex ERP-specific functionalities (e.g., stock level checks for orders, financial reporting, advanced inventory management, user permission logic).
*   **Frontend Integration:** Establish communication between the backend APIs and the frontend (`apps/api/src/web`).
*   **Module-Specific Refinements:** Add specific validations and business logic where needed (e.g., ensuring `clientId` and `vehicleId` are valid and belong to the same company in `CreateServiceOrderService`).

This roadmap provides a clear path forward for integrating the generated modules, enhancing security, and building out the full functionality of the AutoSync ERP system.
