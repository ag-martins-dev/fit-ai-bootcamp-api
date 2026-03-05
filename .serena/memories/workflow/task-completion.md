# Task Completion Workflow

## Implementation Checklist
1. Read task specification (tasks/{N}.md)
2. Check existing patterns in similar features
3. Create/update components in order:
   - Error classes (src/errors/index.ts) if needed
   - Zod schemas (src/schemas/index.ts)
   - Use case (src/usecases/UseCase.ts)
   - Route handler (src/routes/*)
4. Verify no TypeScript errors
5. Commit changes

## Commit Strategy
**CRITICAL RULES**:
1. **NEVER attempt to commit without explicit user permission** - Always ask/wait for user approval before running any git commit command
2. Before `git add .`, analyze UNTRACKED files to ensure logical commit order

Pattern for feature implementation:
1. `chore: add task specification file` (tasks/X.md)
2. `docs: update standards if needed` (standards/)
3. `feat: implement feature` (src/ changes)

Example:
```bash
git add tasks/03.md
git commit -m "chore: add task spec for home endpoint"
git add src/errors/index.ts src/schemas/index.ts src/usecases/GetHome.ts src/routes/...
git commit -m "feat(home): implement home endpoint with consistency tracking"
```

## Minimalist Commits
- One logical unit per commit
- Avoid mixing unrelated changes
- Each commit should be independently understandable
