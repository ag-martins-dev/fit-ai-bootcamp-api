# Essential Development Commands

## Server
- `pnpm dev` - Start dev server with auto-reload (watches src/index.ts)

## Database
- `pnpm prisma migrate dev` - Create and apply migrations
- `pnpm prisma studio` - Open Prisma Studio UI for database inspection
- `pnpm prisma generate` - Regenerate Prisma client (auto-generated code in src/generated/prisma/)

## Code Quality
- `pnpm lint` or `eslint .` - Lint code
- `pnpm format` or `prettier . --write` - Format code
- Note: eslint and prettier are configured via `eslint.config.js` and `.prettierrc`

## Git Workflow
- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- **Critical rule**: Before committing, run `git status` and analyze UNTRACKED files to ensure proper chronological commit order
- Pattern: chore (docs files) → docs (standards) → feat/fix (implementation)

## Testing & Deployment
- No test framework currently configured
- Build: TypeScript compilation only (no explicit build step defined yet)
