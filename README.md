# cuview

A modern, high-performance web dashboard for [Curio](https://github.com/filecoin-project/curio) (Filecoin Storage Provider) nodes.

## Features

- **Comprehensive Node Overview**: Monitor chain connectivity, storage stats, and task counts at a glance.
- **Pipeline Monitoring**: Real-time status for PoRep and Snap pipelines with detailed task history.
- **Sector Management**: Full visibility into sector lifecycle, expiration, and scheduler status.
- **Market Operations**: Manage storage asks, balance escrow, and monitor deals (MK12/MK20).
- **Advanced Diagnostics**: In-app sector diagnostics, CommR checks, and WdPost testing.
- **System Control**: Manage Harmony tasks, machines, and configuration layers.

## Development

### Prerequisites

- Node.js 20+
- pnpm (recommended)

### Installation

```bash
pnpm install
```

### Setup

Before running the dashboard, ensure you have a Curio node running with the WebRPC API enabled. Configure the connection on the initial setup page.

### Start Development Server

```bash
pnpm dev
```

## Build

To build the production-ready static assets:

```bash
pnpm build
```

The output will be in the `dist/` directory.

## UI Layering & Theme Switching

- `src/components/ui/*` is the **base style layer** and should remain compatible
  with `shadcn add --overwrite`.
- Put business semantics in `src/components/composed/*` (for example custom
  status wrappers), not in `ui/*`.
- `src/style.css` is the single theme token source (`:root` + `.dark` + token
  mappings). Keep page styles using semantic classes/tokens.

## License

MIT
