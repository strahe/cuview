# Copilot review instructions for cuview

Use this file as review guidance for pull requests in this repository. Keep this file focused on stable review standards; implementation workflow, tool preferences, and agent-specific operating rules belong in `AGENTS.md`.

## Review priorities
- Prioritize correctness, regressions, data-flow consistency, and accessibility over stylistic nits.
- Prefer findings that identify user-visible bugs, broken state transitions, missing invalidation, API misuse, or architectural drift.
- Treat changes to generated files and baseline UI primitives as high-risk and require explicit justification.

## Project invariants
- Do not manually edit `src/routeTree.gen.ts`.
- Preserve the existing layering: routes/components -> hooks -> services -> Curio backend.
- Route components should not introduce ad-hoc API access or hand-built TanStack Query keys when existing shared hooks cover the case.
- New routes should follow existing TanStack file-route conventions and preserve established redirect/tab-wrapper patterns where relevant.
- Endpoint and layout state should continue to use the existing context boundaries unless a migration is intentional and well covered.

## UI and accessibility
- Reuse existing shared UI building blocks before introducing page-local primitives or modifying `src/components/ui/*`.
- Changes to `src/components/ui/*` should be treated as intentional UI-foundation work, not incidental feature edits.
- This repository's shared primitive layer is based on `@base-ui/react`; introducing a parallel primitive stack requires explicit migration intent.
- Interactive and form controls in routes and layouts should align with existing shared `@/components/ui/*` primitives when equivalents exist.
- Icon-only controls must expose an accessible name (`aria-label` or equivalent).
- Prefer semantic Tailwind token classes over hardcoded colors unless there is a clear design-system reason not to.

## React and validation expectations
- Avoid `useEffect` for derived state synchronization; prefer direct render-time computation or render-phase state updates when necessary.
- `console.error` should log structured error details (`error.stack` or `error.message` after narrowing), not raw unknown error objects.
- Behavior-changing pull requests should include or update tests.
- Before handoff, `pnpm run check` is the default validation gate; run `pnpm run test` when behavior changes.
