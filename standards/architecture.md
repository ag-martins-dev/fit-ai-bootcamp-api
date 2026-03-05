# Padrões de Arquitetura

## Estrutura de Pastas

```
bootcamp-fit-api/
├── src/
│   ├── index.ts                 # Ponto de entrada da aplicação
│   ├── errors/                  # Erros customizados centralizados
│   │   └── index.ts
│   ├── generated/               # Código auto-gerado pelo Prisma
│   │   └── prisma/
│   ├── lib/                     # Bibliotecas e utilitários
│   │   ├── auth.ts             # Configuração de autenticação (Better Auth)
│   │   └── db.ts               # Instância singleton do Prisma Client
│   ├── routes/                  # Definição de rotas da API
│   │   └── workout-plan.ts     # Um arquivo por coleção de recursos
│   ├── schemas/                 # Schemas de validação (Zod)
│   │   └── index.ts
│   └── usecases/               # Lógica de negócio (Use Cases)
│       ├── CreateWorkoutPlan.ts
│       └── StartWorkoutSession.ts
├── prisma/
│   └── schema.prisma           # Schema do banco de dados PostgreSQL
├── standards/                   # Documentação de padrões
├── package.json
├── tsconfig.json
├── eslint.config.js
└── .env                        # Variáveis de ambiente (git-ignored)
```

## Camadas da Aplicação

### 1. **HTTP Layer** (`routes/`)

- Responsável por receber/responder requisições HTTP
- Valida entrada com Zod (automático via type provider)
- Autentica usuário via `better-auth`
- Extrai parâmetros, body e query da requisição
- Chama o use case apropriado
- Trata erros customizados e converte para respostas HTTP
- Retorna resposta com status code apropriado
- **NÃO** contém lógica de negócio

### 2. **Business Logic Layer** (`usecases/`)

- Contém toda lógica de negócio
- Recebe dados tipados via `InputDto`
- Retorna dados tipados via `OutputDto`
- Valida regras de negócio
- Lança erros customizados (não conhece HTTP)
- Interage com banco de dados via Prisma
- Pode usar transações para operações complexas
- **NÃO** responsável por formatação HTTP

### 3. **Database Layer** (`prisma/schema.prisma` + `lib/db.ts`)

- Define estrutura relacional do banco
- `db.ts` exporta instância única (singleton) do Prisma Client
- Usar `@prisma/adapter-pg` para PostgreSQL
- Geração automática de tipos em `src/generated/prisma`
- **NÃO** fazer queries fora de usar cases (separação)

### 4. **Validation Layer** (`schemas/`)

- Define schemas Zod para validação de entrada
- Reutilizável em múltiplas rotas
- Mensagens de erro em português
- Pode ser usado para tipagem de response também
- Integrado automaticamente via `fastify-type-provider-zod`

### 5. **Error Layer** (`errors/index.ts`)

- Erros customizados da aplicação
- Estendem classe `Error` nativa
- Possuem `readonly message` para flexibilidade
- Nomeação: `{Descrição}Error`
- Lançados em use cases, capturados em routes

### 6. **Authentication Layer** (`lib/auth.ts`)

- Centraliza configuração do `better-auth`
- Intégra com user/account/session models do Prisma
- Sessão extraída via `auth.api.getSession({headers: ...})`
- Suporte a email/password e provedores OAuth

## Fluxo de Dados (Request-Response)

```
Client HTTP Request
         ↓
┌─ routes/workout-plan.ts
├─ 1. Validação Zod automática (schemas/)
├─ 2. Autenticação via better-auth
├─ 3. Autorização (verificar propriedade)
├─ 4. Extração de params/body
│         ↓
├─ 5. Chamada do Use Case (usecases/)
│    ├─ Validação de regra de negócio
│    ├─ Queries/mutations Prisma (lib/db.ts)
│    ├─ Transações se necessário
│    └─ Retorna OutputDto ou lança erro
│         ↓
├─ 6. Captura de erros customizados
├─ 7. Conversão para HTTP response
└─ 8. Retorno com status code apropriado
         ↓
Client HTTP Response (JSON)
```

## Tech Stack Principal

| Camada            | Tecnologia                | Versão  | Propósito          |
| ----------------- | ------------------------- | ------- | ------------------ |
| **Runtime**       | Node.js                   | 24.x    | Execução           |
| **Linguagem**     | TypeScript                | ^5.9.3  | Tipagem estática   |
| **Web Framework** | Fastify                   | ^5.7.4  | HTTP server        |
| **Type Provider** | fastify-type-provider-zod | ^6.1.0  | Validação + tipos  |
| **Validação**     | Zod                       | ^4.3.6  | Schemas            |
| **ORM**           | Prisma                    | ^7.4.2  | Database access    |
| **Database**      | PostgreSQL                | 13+     | Data storage       |
| **Auth**          | better-auth               | ^1.5.0  | Authentication     |
| **Dev Runtime**   | tsx                       | ^4.21.0 | Executar TS direto |

## Princípios Arquiteturais

1. **Separação de Responsabilidades (SoC)** - Cada camada tem função específica
2. **Reutilização** - Schemas, erros e use cases reutilizáveis
3. **Tipagem Forte** - InputDto e OutputDto em todo use case
4. **Transações** - Múltiplas operações de banco em transação atômica
5. **UUID para IDs** - Todos os IDs primários são UUIDs
6. **Soft Deletes** - Não deletar registros, usar flags como `isActive`
7. **Cascata de Deleção** - `onDelete: Cascade` em todo relacionamento

## Padrões de Banco de Dados

### Nomenclatura Prisma

**Model**: PascalCase

```prisma
model WorkoutPlan { }
```

**Campo**: camelCase com `@map()` para snake_case

```prisma
model WorkoutPlan {
  userId String @map("user_id")
}
```

**Enum**: PascalCase com valores UPPERCASE

```prisma
enum WeekDay {
  MONDAY
  TUESDAY
}
```

**Tabela**: snake_case com `@@map()`

```prisma
model WorkoutPlan {
  @@map("workout_plans")
}
```

### Padrões de Modelo

Toda entidade deve ter:

```prisma
model Entity {
  id String @id @default(uuid())

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  name String
  isActive Boolean @default(true) @map("is_active")

  userId String @map("user_id")
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("entities")
}
```

### Queries Padrão

```typescript
// Encontrar único
const record = await prisma.entity.findUnique({ where: { id } });

// Encontrar primeiro com condição
const active = await prisma.entity.findFirst({ where: { isActive: true } });

// Criar com relacionamentos
const created = await prisma.entity.create({
  data: { /* ... */ },
  include: { related: true }
});

// Atualizar
await prisma.entity.update({
  where: { id },
  data: { field: value }
});

// Transação
await prisma.$transaction(async (tx) => {
  await tx.entity1.update({...});
  await tx.entity2.create({...});
});
```

### Include vs Select

- **Include**: Carrega todo relacionamento especificado
- **Select**: Especifica apenas campos exatos necessários

```typescript
// Include: carrega todo relacionamento
const plan = await prisma.workoutPlan.findUnique({
  where: { id },
  include: { workoutDays: true },
});

// Select: especifica dados exatos
const plan = await prisma.workoutPlan.findUnique({
  where: { id },
  select: { id: true, name: true },
});
```

## Padrões de API REST

### URL Structure

```
/workout-plans                                    # Lista/criar
/workout-plans/{planId}                          # Detalhe/atualizar
/workout-plans/{planId}/days/{dayId}/sessions   # Nested resource
```

**Padrão de nomeação:**

- IDs em snake_case descriptivo: `{workoutPlanId}`, não `{id}`
- Sem verbos na URL
- Nesting máximo 3 níveis

### HTTP Status Codes

| Código | Significado  | Quando Usar                        |
| ------ | ------------ | ---------------------------------- |
| 201    | Created      | Recurso criado com sucesso         |
| 400    | Bad Request  | Validação falhou ou regra violada  |
| 401    | Unauthorized | Usuário não autenticado/autorizado |
| 409    | Conflict     | Estado conflitante (ex: duplicado) |
| 500    | Server Error | Erro inesperado na aplicação       |

### Response HTTP

**Sucesso (201 Created):**

```json
{
  "id": "uuid",
  "name": "Plan name",
  "workoutDays": [
    /*...*/
  ]
}
```

**Erro:**

```json
{
  "message": "Descritivo do erro",
  "code": "CODIGO_DO_ERRO"
}
```

### Documentação de Rotas

Sempre incluir tags e summary para OpenAPI:

```typescript
schema: {
  tags: ["Workout Plan"],
  summary: "Create a workout plan",
  body: ZodSchema,
  response: {
    201: ResponseSchema,
    400: ErrorSchema,
    401: ErrorSchema,
  }
}
```

### Tratamento de Erros em Routes

```typescript
catch (err) {
  if (err instanceof WorkoutPlanNotActiveError) {
    return reply.status(400).send({
      message: err.message,
      code: "WORKOUT_PLAN_NOT_ACTIVE"
    });
  }
  if (err instanceof NotFoundError) {
    return reply.status(400).send({
      message: err.message,
      code: "NOT_FOUND"
    });
  }
  if (err instanceof SessionAlreadyStartedError) {
    return reply.status(409).send({
      message: err.message,
      code: "SESSION_ALREADY_STARTED"
    });
  }
  if (err instanceof Error && err.message.includes("Unauthorized")) {
    return reply.status(401).send({
      message: err.message,
      code: "UNAUTHORIZED"
    });
  }

  app.log.error(err);
  return reply.status(500).send({
    message: "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR"
  });
}
```

## Conventional Commits

Todo commit deve seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

### Regra Obrigatória: Análise de Ordem Antes de Commitar

**SEMPRE** analize a ordem dos arquivos não rastreados (`Untracked files`) ANTES de fazer commits:

```bash
$ git status
```

**Por que?** Para garantir que os commits estejam em ordem cronológica lógica:

1. **Identifique files não rastreados** que foram criados antes das modificações
2. **Organize commits** na sequência em que foram criados:
   - Documentação de tarefas/specs (chore, docs)
   - Padrões e standards (docs)
   - Implementação de features (feat, fix)
3. **Evite commits fora de ordem** que prejudicam o histórico do projeto

**Processo:**

```bash
# ✓ Certo
1. git add docs/ tasks/ && git commit -m "chore: add specs and docs"
2. git add standards/ && git commit -m "docs: add architecture"
3. git add src/ && git commit -m "feat: implement feature"

# ✗ Errado
1. git add src/ && git commit -m "feat: implement feature"
2. git add docs/ && git commit -m "chore: add specs"  # Fora de ordem!
```

### Princípio Fundamental: Minimalismo

**Commits devem ser SEMPRE o mais enxuto possível.** Isso significa:

- **SEMPRE** insira uma feature ou fix por commit (atomic commits)
- **SEMPRE** insira apenas alterações relacionadas em um único commit
- **SEMPRE** insira a mensagem com subject linha curta (máx 50 caracteres)
- **NUNCA** inira um corpo explicando o "por quê"
- **NUNCA** inira múltiplas features não relacionadas no mesmo commit
- **NUNCA** insira refatoração + feature no mesmo commit
- **NUNCA** inira code style + lógica no mesmo commit
- Apenas insira mais de uma feature ou fix no mesmo commit caso elas tenham relação entre si (abrangem o mesmo escopo)

**Filosofia:** Cada commit contém uma unidade de trabalho mínima e completa que pode ser entendida isoladamente.

### Tipos Permitidos

| Tipo       | Descrição                      | Bumpa Semver |
| ---------- | ------------------------------ | ------------ |
| `feat`     | Nova feature                   | Minor        |
| `fix`      | Correção de bug                | Patch        |
| `docs`     | Mudanças em documentação       | -            |
| `style`    | Formatação, sem mudança lógica | -            |
| `refactor` | Refatoração sem feature/fix    | -            |
| `perf`     | Melhoria de performance        | Patch        |
| `test`     | Adicionar ou atualizar testes  | -            |
| `chore`    | Updates de deps, config        | -            |

### Exemplos

```bash
# Feature
$ git commit -m "feat(workout-plan): add cover image url to workout days"

# Fix
$ git commit -m "fix(auth): prevent unauthorized access to private plans"

# Documentation
$ git commit -m "docs: update architecture standards"

# Refactor
$ git commit -m "refactor(errors): consolidate error handling in routes"

# Com corpo (para mudanças maiores)
$ git commit -m "feat(session): implement workout session tracking

- Add startedAt and completedAt timestamps
- Validate workout plan is active before starting
- Prevent duplicate session starts with 409 status

Closes #123"
```

### Breaking Changes

```bash
feat(api)!: change workout plan response format

BREAKING CHANGE: WorkoutSessionId renamed to userWorkoutSessionId
Migrate by changing client code from sessionId to userWorkoutSessionId
```

## Arquitetura em Diagrama

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Web/Mobile)                   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 Fastify (routes/)                        │
│  • Valida input com Zod (schemas/)                       │
│  • Autentica com better-auth                            │
│  • Chama Use Case apropriado                            │
│  • Trata erros customizados (errors/)                   │
│  • Retorna HTTP response                                 │
└────────────────────────┬────────────────────────────────┘
                         │ Tipado & validado
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Use Cases (usecases/)                       │
│  • Lógica de negócio                                     │
│  • Valida regras                                         │
│  • Lança erros customizados                             │
│  • Interage com Prisma                                   │
└────────────────────────┬────────────────────────────────┘
                         │ Queries/Mutations
                         ↓
┌─────────────────────────────────────────────────────────┐
│         Prisma ORM (lib/db.ts)                           │
│  • Singleton instance                                    │
│  • Type-safe database access                            │
│  • Transações para atomicidade                          │
└────────────────────────┬────────────────────────────────┘
                         │ SQL
                         ↓
┌─────────────────────────────────────────────────────────┐
│            PostgreSQL (prisma/schema.prisma)            │
│  • Dados persistidos                                     │
│  • Relacionamentos com cascata de deleção               │
│  • Timestamps para auditoria                            │
└─────────────────────────────────────────────────────────┘
```
