# AutoSync - Domain Blueprint

## Missão

O AutoSync é um ERP de gestão de manutenção automotiva especializado em:

* Oficinas privadas
* Empresas com frota própria
* Frotas públicas
* Contratos de manutenção
* Licitações públicas

O sistema deve garantir rastreabilidade operacional, técnica, fiscal e financeira durante todo o ciclo de vida da manutenção.

---

# Fluxo Principal

Cliente
→ Contrato (Opcional)
→ Veículo
→ Solicitação
→ Agendamento
→ Recepção
→ Check-in
→ Diagnóstico
→ Orçamento
→ Aprovação
→ Execução Técnica
→ Evidências
→ Relatório Técnico
→ Medição
→ Faturamento
→ Encerramento

---

# Agregado Principal

Atendimento de Manutenção

O Atendimento é a entidade central do sistema.

Todo o restante gira ao redor dele.

Atendimento
├─ Diagnóstico
├─ Aprovações
├─ Serviços
├─ Evidências
├─ Equipe Técnica
├─ Relatórios
└─ Medições

---

# Especialidades Técnicas

* Mecânico
* Eletricista
* Pintor
* Funileiro
* Acabamentista
* Soldador
* Borracheiro
* Técnico de Ar Condicionado
* Supervisor Técnico

---

# Evidências

As evidências são entidades do domínio.

Não devem ser tratadas apenas como anexos.

Tipos:

* CHECKIN
* ANTES
* DURANTE
* DEPOIS
* VIDEO
* DOCUMENTO
* PDF

Toda evidência deve possuir:

* Autor
* Data
* Serviço
* Atendimento
* Descrição
* Arquivo

---

# Medição

Obrigatória para contratos públicos.

Uma medição pode agrupar diversos atendimentos.

Estados:

* PENDENTE
* EM_ANALISE
* APROVADA
* FATURADA
* PAGA
