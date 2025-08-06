# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `vue-tsc --noEmit` - Type check

## Project
Vue 3 + TypeScript UI for Curio API via WebSocket. Early development stage.

## Key Files
- `src/composables/useCurioQuery.ts` - Main API composable
- `src/services/curio-api.ts` - API service wrapper
- `src/lib/jsonrpc-client.ts` - WebSocket JSON-RPC client

## Config
- Endpoint: `VITE_CURIO_ENDPOINT` env var (default: `/api/webrpc/v0`)
- Path alias: `@/` → `src/`
- Uses TailwindCSS + shadcn-vue

## Documentation & Research
- **PRIORITY**: Use context7 MCP server for retrieving up-to-date documentation and code examples for any library
- Only use other documentation sources if context7 is unavailable

## Development Workflow
- **MANDATORY**: After any code modification, ALWAYS run `npm run build` to check for type errors and build issues
- Fix all compilation errors before considering the task complete
- Only proceed to next task after successful build

## UI Components Policy
- **DO NOT** modify shadcn-vue components directly.
- If customization is needed, use composition/extension (wrappers) instead of editing upstream files.
- Place custom wrappers in a separate namespace (e.g., `src/components/extensions/` or `src/components/composed/`) and import those in app code.