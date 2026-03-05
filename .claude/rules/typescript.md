# Padrões TypeScript

## Tipagem Geral

### Nunca Use `any`

```typescript
// ✗ Ruim
let data: any = {};
function handle(param: any) {}

// ✓ Bom
let data: Record<string, unknown> = {};
function handle(param: unknown) {}

// ✓ Ainda melhor (com tipo específico)
interface Data {
  name: string;
  age: number;
}
let data: Data = { name: "John", age: 30 };
```

### Tipos Explícitos

```typescript
// ✗ Ruim (tipo implícito)
const user = getUserData();

// ✓ Bom
const user: User = getUserData();
const count: number = 0;
const active: boolean = true;
```

## DTOs (Data Transfer Objects)

### InputDto

Define dados que entram no use case:

```typescript
interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}
```

### OutputDto

Define dados que saem do use case:

```typescript
export interface OutputDto {
  userWorkoutSessionId: string;
}
```

### Exemplo Completo

```typescript
interface InputDto {
  userId: string;
  workoutPlanId: string;
}

export interface OutputDto {
  userWorkoutSessionId: string;
}

export class StartWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    // Implementação...
    return { userWorkoutSessionId: "uuid" };
  }
}
```

## Classes Use Case

### Padrão Base

```typescript
export class NomeDoUseCase {
  async execute(dto: InputDto): Promise<OutputDto> {
    // Implementação
    return result;
  }
}
```

**Características:**

- Sempre `export`
- Método público `execute` (assíncrono)
- Toda lógica em `execute`

### Validação de Negócio

```typescript
export class StartWorkoutSession {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({...});

    // Validação 1: Recurso existe?
    if (!workoutPlan) {
      throw new NotFoundError("Workout plan not found");
    }

    // Validação 2: Autorização
    if (workoutPlan.userId !== dto.userId) {
      throw new Error("Unauthorized: Plan does not belong to user");
    }

    // Validação 3: Estado válido?
    if (!workoutPlan.isActive) {
      throw new WorkoutPlanNotActiveError("Plan not active");
    }

    // Validação 4: Conflito de estado?
    const existing = await prisma.workoutSession.findFirst({...});
    if (existing) {
      throw new SessionAlreadyStartedError("Session already started");
    }

    // Lógica principal
    const session = await prisma.workoutSession.create({
      data: { workoutDayId: dto.workoutDayId, startedAt: new Date() }
    });

    return { userWorkoutSessionId: session.id };
  }
}
```

## Classes de Erro

### Padrão

```typescript
export class DescricaoError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.name = "DescricaoError";
  }
}
```

### Exemplos

```typescript
export class WorkoutPlanNotFoundError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.name = "WorkoutPlanNotFoundError";
  }
}

export class WorkoutPlanNotActiveError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.name = "WorkoutPlanNotActiveError";
  }
}

export class SessionAlreadyStartedError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.name = "SessionAlreadyStartedError";
  }
}
```

### Uso

```typescript
// Lançar
if (!workoutPlan) {
  throw new NotFoundError("Workout plan not found");
}

// Catar
if (err instanceof NotFoundError) {
  return reply.status(400).send({
    message: err.message,
    code: "NOT_FOUND",
  });
}
```

## Tipos Gerados pelo Prisma

### Importar Enums

```typescript
import { WeekDay } from "../generated/prisma/enums.js";

interface WorkoutDay {
  weekDay: WeekDay; // MONDAY | TUESDAY | ... | SUNDAY
}
```

### Tipos de Modelo

```typescript
import { User, WorkoutPlan } from "../generated/prisma";

const plan: WorkoutPlan = await prisma.workoutPlan.findUnique({...});
```

## Type Guards

### instanceof para Erros

```typescript
catch (err) {
  if (err instanceof WorkoutPlanNotActiveError) {
    return reply.status(400).send({...});
  }

  if (err instanceof Error && err.message.includes("Unauthorized")) {
    return reply.status(401).send({...});
  }

  return reply.status(500).send({...});
}
```

### Type Checking Prisma

```typescript
const result = await prisma.workoutPlan.findUnique({...});

if (!result) {
  throw new NotFoundError("Plan not found");
}

// Agora result é WorkoutPlan (narrow type)
const active = result.isActive;
```

## Tipos de Função e Callback

### Handlers de Rota

```typescript
handler: async (req, reply) => {
  const { planId, dayId } = req.params; // Tipado automaticamente
  const { name } = req.body; // Tipado pelo schema Zod

  return reply.status(201).send(result);
};
```

## Tipos Complexos

### Arrays de Objetos

```typescript
interface WorkoutDay {
  name: string;
  weekDay: WeekDay;
  exercises: Array<{
    order: number;
    name: string;
    sets: number;
  }>;
}
```

### Union Types

```typescript
type Status = "active" | "inactive" | "pending";

type DateOrString = Date | string;

function handle(date: DateOrString) {
  if (date instanceof Date) {
    // date é Date aqui
  } else {
    // date é string aqui
  }
}
```

## Readonly para Imutabilidade

### Em Dados

```typescript
interface ImmutableUser {
  readonly id: string;
  readonly name: string;
}

// ✗ Erro: Property 'name' cannot be assigned
user.name = "New Name";
```

### Em Arrays

```typescript
const ids: readonly string[] = ["1", "2"];

// ✗ Erro
ids.push("3");
```

### Em Erros

```typescript
export class CustomError extends Error {
  constructor(readonly message: string) {
    super(message);
  }
}
```

## null vs undefined

### No Prisma

- Usar `null` para valores opcionais no banco
- Evitar `undefined` em tipos de dados persistidos

```prisma
model User {
  image String?    // null quando não existe
}
```

```typescript
const image: string | null = user.image; // ✓ Bom
const image: string | undefined = user.image; // ✗ Evitar
```

### Em DTOs

```typescript
interface InputDto {
  coverImageUrl: string | null; // null se não fornecido
}
```

## Tipagem com Zod

### Schemas Tipados

```typescript
const UserSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;
```

### Validação em Runtime

```typescript
try {
  const validated = WorkoutPlanSchema.parse(input);
  // validated está tipado como WorkoutPlan
} catch (err) {
  if (err instanceof z.ZodError) {
    // Erro de validação
  }
}
```

## Strict Mode TypeScript

Projeto usa `"strict": true` em tsconfig.json:

- `strictNullChecks`: null/undefined devem ser explícitos
- `strictFunctionTypes`: Tipos de função são coercitivos
- `noImplicitAny`: Nenhum `any` implícito
- `noImplicitThis`: `this` tem tipo explícito

**Resultado:** Código mais robusto com menos bugs em runtime.

## Checklist de Tipagem

- [ ] Nenhum `any` implícito ou explícito?
- [ ] InputDto e OutputDto definidos?
- [ ] Funções têm tipos de parâmetro e retorno?
- [ ] Erros lançados são customizados e tipados?
- [ ] Types capturados com `instanceof`?
- [ ] null/undefined explícitos nos tipos?
- [ ] Imutabilidade com `readonly` quando apropriado?
- [ ] Zod para validação de schema?
