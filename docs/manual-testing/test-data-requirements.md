# Requisitos de Dados de Teste & Seed Corporativo

## 1. Visão Geral

Este documento descreve os conjuntos de dados mínimos necessários para a execução completa dos testes manuais e integrados dos módulos de **Financeiro**, **Filiais** e **Usuários/RBAC** no AutoSync.

---

## 2. Filiais (Branches)

| Campo | Filial Matriz (Sede) | Filial Secundária |
| :--- | :--- | :--- |
| **ID** | `b1` (ou UUID gerado) | `b2` (ou UUID gerado) |
| **Nome** | `Matriz Centro` | `Filial Sul` |
| **CNPJ** | `12.345.678/0001-01` | `12.345.678/0001-02` |
| **Endereço** | `Av. Paulista, 1000 - São Paulo/SP` | `Av. das Nações, 500 - Curitiba/PR` |
| **Telefone** | `(11) 3333-1111` | `(41) 3333-2222` |
| **E-mail** | `matriz@autosync.com.br` | `sul@autosync.com.br` |
| **Status** | `active: true` | `active: true` |

---

## 3. Matriz de Usuários de Teste por Papel RBAC

| E-mail | Senha | Nome | Papel Prisma (`Role`) | Filial Alocada |
| :--- | :--- | :--- | :--- | :--- |
| `admin@autosync.com` | `admin123` | `Administrador Geral` | `ADMIN` | Global (Todas) |
| `gestor@autosync.com` | `gestor123` | `Fernanda Gerente` | `MANAGER` | Matriz Centro |
| `financeiro@autosync.com` | `fin123` | `Ana Silva` | `FINANCIAL` | Matriz Centro |
| `estoque@autosync.com` | `est123` | `Pedro Estoquista` | `STOCKIST` | Matriz Centro |
| `mecanico@autosync.com` | `mec123` | `Carlos Mecânico` | `MECHANIC` | Filial Sul |
| `atendente@autosync.com` | `atend123` | `Juliana Atendante` | `ATTENDANT` | Filial Sul |

---

## 4. Lançamentos Financeiros Iniciais

| Tipo | Categoria | Descrição | Valor | Vencimento | Status | Filial |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RECEIVABLE` | `Serviços` | `OS #1001 - Manutenção Preventiva` | `R$ 450,00` | `2026-08-15` | `PENDING` | `b1` |
| `RECEIVABLE` | `Venda Peças` | `OS #1002 - Troca Amortecedores` | `R$ 1.850,00` | `2026-08-20` | `PENDING` | `b1` |
| `PAYABLE` | `Aluguel` | `Aluguel Galpão Matriz` | `R$ 3.500,00` | `2026-08-05` | `PAID` | `b1` |
| `PAYABLE` | `Fornecedores` | `Compra Filtros Lote #45` | `R$ 820,00` | `2026-08-10` | `PENDING` | `b2` |

---

## 5. Instruções para Restauração / Seed do Banco

Em ambiente Docker local:
```bash
docker exec -it autosync_api npx prisma db seed
```
Isso garante a reposição instantânea dos dados de teste mantendo o isolamento multi-tenant.
