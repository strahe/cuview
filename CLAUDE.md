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