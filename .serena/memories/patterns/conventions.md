# Code Style & Conventions

## TypeScript
- Strict mode enabled in tsconfig.json
- Always use explicit type annotations for function parameters
- Use interfaces for InputDto/OutputDto instead of type aliases
- Export classes/constants, use default export for features

## Naming
- CamelCase for variables/functions, PascalCase for classes
- Error classes: `VerbAdjectiveError` (e.g., `SessionAlreadyCompletedError`)
- Use case files: `VerbNoun.ts` (e.g., `CreateWorkoutPlan.ts`)
- Route files: noun for resource (e.g., `workout-plan.ts`)

## Zod Schemas
- Schemas in src/schemas/index.ts as const exports
- Pattern: `z.object({ field: z.type() })`
- Datetime fields: **Always use `z.iso.datetime()`** (not `z.string().datetime()`)
- Use `.omit({ id: true })` for creation endpoints

## Comments & Documentation
- Use JSDoc for complex functions
- Avoid over-commenting obvious code
- Comment business rules, not implementation details

## Imports
- ESM modules with .js extensions in imports
- Organize: external → internal paths → index imports last
- Use absolute paths via tsconfig paths (none currently configured)

## WeekDay Enum
- Always import and use `WeekDay` enum from `../generated/prisma/enums.js`
- Never use string literal types for weekdays (MONDAY, TUESDAY, etc.)
- Pattern: `weekDay: WeekDay` in type definitions
- When filtering/querying: cast strings to WeekDay with `as WeekDay`
- Example: `weekDay: targetWeekDay as WeekDay`

## Date/Time Manipulation
- **ALWAYS use dayjs** for any date manipulation, parsing, formatting, or calculations
- Import: `import dayjs from "dayjs"`
- For UTC operations: extend with `import utc from "dayjs/plugin/utc.js"` and call `dayjs.extend(utc)` then use `dayjs.utc()`
- Convert Prisma Date objects to ISO strings: `date.toISOString()` when returning in DTOs
- Never use native JavaScript Date methods for calculations - use dayjs instead

## Error Messages
- Descriptive, include what failed and why
- Example: "Workout plan not found for user {userId}"
