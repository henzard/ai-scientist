<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Branch & Deployment Rules

- `master` is protected — **never push directly to master**. All changes go through a Pull Request.
- PRs require CI to pass (unit tests, type check, lint, build, Playwright E2E) before merge.
- Vercel deploys are triggered by Vercel's GitHub integration on merge to `master`. CI passing is the gate via branch protection — broken code never reaches production.
