# Casos de Teste Manuais — Módulo de Usuários & RBAC

## CT-USR-01: Listagem e Filtro por Cargo RBAC

- **Pré-condição**: Usuário autenticado.
- **Passos**:
  1. Acessar a rota `/usuarios`.
  2. Verificar a tabela com listagem de colaboradores e badges de papel (`Administrador`, `Gestor`, `Estoquista`, `Mecânico`, `Financeiro`, `Atendente`).
  3. No filtro de cargos, selecionar "Financeiro".
- **Resultado Esperado**:
  - A tabela filtra e apresenta exclusivamente os usuários com o papel `FINANCIAL`.
  - A contagem e paginação da tabela se ajustam ao conjunto filtrado.

---

## CT-USR-02: Cadastro de Novo Usuário com Senha Inicial

- **Pré-condição**: Usuário com permissão `user.manage` (`ADMIN`).
- **Passos**:
  1. Clicar no botão "+ Novo Usuário".
  2. Preencher os dados no modal:
     - Nome: `Marcos Silva`
     - E-mail: `marcos.financeiro@autosync.com.br`
     - Senha Inicial: `senhaSegura123`
     - Cargo / Papel: `FINANCIAL`
     - Filial Alocada: `Matriz Centro`
  3. Clicar em "Salvar Usuário".
- **Resultado Esperado**:
  - Endpoint `POST /users` é chamado com o payload completo.
  - Notificação de sucesso é exibida e a tabela atualiza com o novo registro.

---

## CT-USR-03: Edição de Usuário (Omissão de Senha)

- **Pré-condição**: Usuário existente na tabela.
- **Passos**:
  1. Clicar no botão "Editar" de um usuário da tabela.
  2. Verificar os campos pré-preenchidos no modal.
  3. Alterar o cargo de `ATTENDANT` para `STOCKIST`.
  4. Clicar em "Salvar Usuário".
- **Resultado Esperado**:
  - O campo de senha NÃO é exibido nem exigido durante a edição de cadastro.
  - A requisição `PUT /users/:id` atualiza o cargo sem sobrescrever a credencial de acesso com valor nulo ou vazio.

---

## CT-USR-04: Inspeção Visual de Capacidades & Permissões Efetivas

- **Pré-condição**: Tabela de usuários visível.
- **Passos**:
  1. Na linha de qualquer usuário, clicar no botão "Permissões".
  2. Observar o modal de inspeção que se abre.
- **Resultado Esperado**:
  - O modal apresenta o cabeçalho com foto/iniciais, nome, e-mail e cargo do usuário.
  - Exibe a contagem total de permissões ativas concedidas àquele papel.
  - Lista todas as chaves de permissão em formato de tags de código (ex: `invoice.receive_payment`, `financial.view`, `user.manage`).

---

## CT-USR-05: Restrição de Ações por Perfil Sem Permissão (Guard RBAC)

- **Pré-condição**: Realizar login com usuário de perfil operacional (ex: `carlos@autosync.com.br` - `MECHANIC`).
- **Passos**:
  1. Navegar até a rota `/usuarios` ou `/filiais`.
- **Resultado Esperado**:
  - O botão "+ Novo Usuário" / "+ Nova Filial" permanece desabilitado com indicação visual de opacidade (`opacity-50 cursor-not-allowed`).
  - As ações de edição e alteração de status na tabela ficam inativas.
