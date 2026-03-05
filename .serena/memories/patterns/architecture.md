# Architecture Patterns

## Layered Architecture
1. **HTTP Layer** (routes/): Request/Response handling, auth, error mapping
2. **Business Logic** (usecases/): Pure business logic, InputDto → OutputDto
3. **Data Layer** (Prisma): Database operations via singleton in lib/db.ts

## Use Case Pattern
Every business operation follows this interface:
```typescript
interface InputDto { /* required params */ }
export interface OutputDto { /* return data */ }
export class MyUseCase {
  async execute(dto: InputDto): Promise<OutputDto> { }
}
```

## Error Handling
- Custom error classes in src/errors/index.ts extend Error with readonly message
- Use cases return descriptive errors, routes map to HTTP status codes
- Pattern: NotFoundError → 404, SessionAlreadyCompletedError → 409, etc.

## Route Registration
- All routes in src/routes/ as `async (app: FastifyInstance) => void`
- Import in src/index.ts and register with `app.register()`
- Use `app.withTypeProvider<ZodTypeProvider>().route()` for type-safe routes

## Response DTOs
- Define Zod schemas in src/schemas/index.ts
- Use for both validation and type generation
- Pattern: data flows through layers with explicit DTO interfaces

## ISO Datetime Handling
- All datetime fields in schemas must use `z.iso.datetime()` (not `z.string().datetime()`)
- Prisma returns Date objects, convert to ISO with `.toISOString()` when returning in responses

## Prisma Enums
- All Prisma enums imported from `../generated/prisma/enums.js`
- **WeekDay enum**: Always use `WeekDay` type for weekday fields (never raw strings)
- Pattern when converting strings: `weekDay: stringValue as WeekDay`
- Example in queries: `where: { weekDay: targetWeekDay as WeekDay }`
