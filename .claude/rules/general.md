# Padrões Gerais

## Nomenclatura

### Arquivos e Pastas

**Pastas**: minúsculas com hífen

```
src/
├── usecases/
├── errors/
├── routes/
└── schemas/
```

**Arquivos de classe**: PascalCase

```
CreateWorkoutPlan.ts
StartWorkoutSession.ts
```

**Arquivos de índice**: sempre `index.ts`

```
src/errors/index.ts
src/schemas/index.ts
```

**Arquivos de rota**: kebab-case

```
workout-plan.ts       # rotas de workout plan
user-auth.ts          # rotas de autenticação
```

### Variáveis e Constantes

**Variáveis**: camelCase

```typescript
const userId = session.user.id;
const activeCount = plans.length;
const hasSomeActiveWorkoutPlan = !!activeWorkoutPlan;
```

**Constantes**: UPPER_SNAKE_CASE

```typescript
const MAX_RETRIES = 3;
const API_TIMEOUT_MS = 5000;
```

**Booleanas**: comecem com `is`, `has`, `should`

```typescript
const isActive = true;
const hasPermission = false;
const shouldValidate = plan !== null;
```

**Arrays**: plural

```typescript
const workoutDays = [];
const users = [];
```

### Funções e Métodos

**Classes**: PascalCase

```typescript
export class CreateWorkoutPlan {}
export class StartWorkoutSession {}
```

**Métodos públicos**: camelCase

```typescript
async execute(dto: InputDto) {}
```

**Métodos privados**: camelCase

```typescript
private validateInput() {}
```

**Handlers**: suffixo "handler"

```typescript
handler: async (req, reply) => {};
```

### Tipos e Interfaces

**Interfaces de DTO**: `{NomeOperacao}Dto`

```typescript
interface InputDto {}
export interface OutputDto {}
```

**Interfaces de negócio**: PascalCase sem prefixo

```typescript
interface User {}
interface WorkoutPlan {}
```

**Erros**: `{Descrição}Error`

```typescript
export class WorkoutPlanNotActiveError extends Error {}
export class NotFoundError extends Error {}
```

## Formatação

### Imports

Ordenados automaticamente por `eslint-plugin-simple-import-sort`:

1. **Built-in Node modules** (primeiro)

```typescript
import { randomUUID } from "crypto";
```

2. **npm packages** (segundo)

```typescript
import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import z from "zod";
```

3. **Local imports** (terceiro)

```typescript
import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";
```

### Espaçamento

- 2 espaços para indentação
- Linha em branco entre seções lógicas
- Máximo 2 linhas em branco consecutivas

```typescript
export class UseCase {
  async execute(dto: InputDto): Promise<OutputDto> {
    const plan = await prisma.workoutPlan.findUnique({...});

    if (!plan) {
      throw new NotFoundError("Not found");
    }

    const result = await prisma.workoutSession.create({...});

    return { userWorkoutSessionId: result.id };
  }
}
```

### Quebra de Linhas Longas

Máximo ~80-100 caracteres:

```typescript
// ✓ Bom
await prisma.workoutPlan.findUnique({
  where: { id: dto.planId },
  include: { workoutDays: { include: { exercises: true } } },
});

// ✗ Ruim
await prisma.workoutPlan.findUnique({
  where: { id: dto.planId },
  include: { workoutDays: { include: { exercises: true } } },
});
```

## Comentários

### Quando Comentar

Commente **por quê**, não **o quê**:

```typescript
// ✗ Ruim (óbvio)
// Verifica se plan é nulo
if (!workoutPlan) {

// ✓ Bom (explica razão)
// Verifica se o plano pertence ao usuário
if (workoutPlan.userId !== dto.userId) {
```

### Estilo

- Use `//` para comentários de linha única
- Português
- Primeira letra maiúscula, sem ponto final

## Estrutura de Use Case

```typescript
import { randomUUID } from "crypto";

import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  planId: string;
}

export interface OutputDto {
  userWorkoutSessionId: string;
}

export class StartWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    // 1. Consultar dados necessários
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.planId },
    });

    // 2. Validar cada condição
    if (!workoutPlan) {
      throw new NotFoundError("Workout plan not found");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new Error("Unauthorized: Plan does not belong to user");
    }

    // 3. Executar lógica principal
    const session = await prisma.workoutSession.create({
      data: {
        id: randomUUID(),
        workoutDayId: dto.workoutDayId,
        startedAt: new Date(),
      },
    });

    // 4. Retornar resultado tipado
    return { userWorkoutSessionId: session.id };
  }
}
```

## Estrutura de Rota

```typescript
app.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/:workoutPlanId/days/:workoutDayId/sessions",

  schema: {
    tags: ["Workout Plan"],
    summary: "Start a workout session",
    params: z.object({
      workoutPlanId: z.uuid(),
      workoutDayId: z.uuid(),
    }),
    response: {
      201: z.object({ userWorkoutSessionId: z.uuid() }),
      400: ErrorSchema,
      401: ErrorSchema,
      409: ErrorSchema,
      500: ErrorSchema,
    },
  },

  handler: async (req, reply) => {
    try {
      // 1. Autenticar
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        return reply.status(401).send({
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      // 2. Extrair inputs
      const { workoutPlanId, workoutDayId } = req.params;

      // 3. Executar Use Case
      const useCase = new StartWorkoutSession();
      const result = await useCase.execute({
        userId: session.user.id,
        workoutPlanId,
        workoutDayId,
      });

      // 4. Retornar sucesso
      return reply.status(201).send(result);
    } catch (err) {
      // 5. Tratar erros conhecidos
      if (err instanceof NotFoundError) {
        return reply.status(400).send({
          message: err.message,
          code: "NOT_FOUND",
        });
      }

      if (err instanceof WorkoutPlanNotActiveError) {
        return reply.status(400).send({
          message: err.message,
          code: "WORKOUT_PLAN_NOT_ACTIVE",
        });
      }

      // 6. Fallback para erros desconhecidos
      app.log.error(err);
      return reply.status(500).send({
        message: "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  },
});
```

## Tratamento de Erros

### Onde Lançar

**Em Use Cases** (lógica de negócio):

```typescript
export class StartWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    if (!workoutPlan.isActive) {
      throw new WorkoutPlanNotActiveError("Plan is not active");
    }
  }
}
```

### Onde Capturar

**Em Rotas** (HTTP handling):

```typescript
catch (err) {
  if (err instanceof WorkoutPlanNotActiveError) {
    return reply.status(400).send({...});
  }
}
```

### Padrão try-catch

```typescript
try {
  const result = await useCase.execute(dto);
  return reply.status(201).send(result);
} catch (err) {
  if (err instanceof CustomError) {
    return reply.status(400).send({...});
  }

  app.log.error(err);
  return reply.status(500).send({...});
}
```

## Autenticação e Autorização

### Extrair Sessão

```typescript
const session = await auth.api.getSession({
  headers: fromNodeHeaders(req.headers),
});

if (!session) {
  return reply.status(401).send({
    message: "Unauthorized",
    code: "UNAUTHORIZED",
  });
}
```

### Usar Dados do Usuário

```typescript
// ✓ Sempre de session.user
const userId = session.user.id;

// ✗ Nunca confiar no req.body
// const userId = req.body.userId;
```

### Verificar Autorização

```typescript
// ✓ Em use case, validar posse
if (workoutPlan.userId !== dto.userId) {
  throw new Error("Unauthorized: Plan does not belong to user");
}
```

## Performance

### Evitar N+1 Queries

```typescript
// ✗ Ruim (N+1)
const plans = await prisma.workoutPlan.findMany({});
for (const plan of plans) {
  plan.days = await prisma.workoutDay.findMany({
    where: { workoutPlanId: plan.id },
  });
}

// ✓ Bom (1 query)
const plans = await prisma.workoutPlan.findMany({
  include: { workoutDays: true },
});
```

### Filtrar Antes de Consultar

```typescript
// ✗ Ruim (carrega tudo)
const plans = await prisma.workoutPlan.findMany({});
const userPlans = plans.filter((p) => p.userId === userId);

// ✓ Bom (filtra no banco)
const userPlans = await prisma.workoutPlan.findMany({
  where: { userId },
});
```

### Selecionar Apenas Necessário

```typescript
// ✗ Carrega tudo
const plan = await prisma.workoutPlan.findUnique({
  where: { id },
  include: { workoutDays: { include: { exercises: true } } },
});

// ✓ Apenas necessário
const plan = await prisma.workoutPlan.findUnique({
  where: { id },
  select: { id: true, name: true, isActive: true },
});
```

## Boas Práticas Gerais

### ✓ Fazer

1. **Tipar explicitamente**

   ```typescript
   const user: User = await prisma.user.findUnique({...});
   ```

2. **Validar entrada com Zod**

   ```typescript
   schema: {
     body: WorkoutPlanSchema;
   }
   ```

3. **Lançar erros específicos**

   ```typescript
   throw new WorkoutPlanNotActiveError("Not active");
   ```

4. **Usar transações para múltiplas operações**

   ```typescript
   await prisma.$transaction(async (tx) => {...});
   ```

5. **Fazer log de erros inesperados**

   ```typescript
   app.log.error(err);
   ```

6. **Documentar rotas com tags e summary**
   ```typescript
   schema: { tags: ["Workout"], summary: "..." }
   ```

### ✗ Não Fazer

1. **Não confiar em dados do cliente**
   - Sempre de `session.user.id`

2. **Não ignorar erros**

   ```typescript
   try { ... } catch (e) {}  // Nunca fazer
   ```

3. **Não misturar camadas**
   - Use cases ≠ HTTP
   - Rotas ≠ lógica de negócio

4. **Não deixar console.log**
   - Usar `app.log` do Fastify

5. **Não fazer hard deletes**
   - Usar soft delete com flags

6. **Não queries sem filtro**
   - Sempre filtrar por `userId` no mínimo

## Pre-commit Checklist

- [ ] Código passa sem erros?
- [ ] ESLint passa (imports ordenados)?
- [ ] Tipos corretos (sem `any`)?
- [ ] InputDto e OutputDto definidos?
- [ ] Autenticação verificada em rotas?
- [ ] Erros customizados lançados?
- [ ] Status codes apropriados?
- [ ] Include/select apropriado no Prisma?
- [ ] Sem console.log?
- [ ] Sem código comentado?
- [ ] Commit message segue Conventional Commits?
- [ ] Sem secrets em código?
