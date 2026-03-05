# Template de Prompt para Criar uma Rota de API

Crie a rota `POST /workout-plans/{id(uuid)}/days/{id(uuid)}/sessions`

## Descrição

Inicia uma sessão de treino para um dia específico de um plano de treino.

## Requisitos Técnicos

- Uma sessão iniciada representa uma `WorkoutSession` criada no banco de dados.
- Use case deve se chamar "StartWorkoutSession".
- Caso o WorkoutPlan não esteja ativo (isActive=true), o use case deve lançar um erro customizado `WorkoutPlanNotActiveError`

## Autenticação

- Rota protegida.
- O usuário precisa ser dono do plano de treino recebido.

## Request

```ts
interface Body {}
```

```ts
interface Params {}
```

```ts
interface Query {}
```

## Response

```ts
interface StatusCode201 {
  userWorkoutSessionId: string;
}
```

## Regras de Negócio

- Apenas o dono do plano de treino pode iniciar uma sessão.
- Caso o dia recebido já esteja iniciado (startedAt presente), retorne 409.
- Deve ser possível iniciar uma sessão para um dia de descanso.
