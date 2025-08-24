# Cuview

[![CI](https://github.com/strahe/cuview/actions/workflows/ci.yml/badge.svg)](https://github.com/strahe/cuview/actions/workflows/ci.yml)

A modern, responsive UI theme for [Curio](https://github.com/filecoin-project/curio).

Unlike the original [Curio Dashboard](https://github.com/web3tea/curio-dashboard) with its GraphQL backend, Cuview is a streamlined frontend-only solution that communicates directly with Curio via RPC, delivering a faster and more focused user experience.

## 🚧 Development Status

**This project is currently under active development and not yet ready for production use.**

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **UI**: Tailwind CSS + daisyUI + reka-ui
- **State Management**: Pinia

## Development

### Quick Start

```bash
# Install dependencies
npm install

# Set environment variable (optional)
export VITE_CURIO_ENDPOINT="ws://localhost:4701/api/webrpc/v0"

# Start development server
npm run dev
```

### Commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run check            # Type, linting, and formatting checks
npm run lint             # Fix code issues
npm run format           # Format code
```

## License

MIT License
