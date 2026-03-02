# Cuview

A modern, responsive dashboard UI for [Curio](https://github.com/filecoin-project/curio) nodes.

## Features

- **Comprehensive Node Overview**: Monitor chain connectivity, storage stats, and task counts at a glance.
- **Pipeline Monitoring**: Real-time status for PoRep and Snap pipelines with detailed task history.
- **Sector Management**: Full visibility into sector lifecycle, expiration, and scheduler status.
- **Market Operations**: Manage storage asks, balance escrow, and monitor deals (MK12/MK20).
- **Advanced Diagnostics**: In-app sector diagnostics, CommR checks, and WdPost testing.
- **System Control**: Manage Harmony tasks, machines, and configuration layers.

## Usage

- Hosted build (GitHub Pages): [cuview.strahe.com](http://cuview.strahe.com)
- Match protocols to avoid mixed-content issues: use `http://` RPC endpoints with `http://` pages, and `https://` RPC endpoints with `https://` pages.
- Self-hosting is supported by deploying the static build output (`dist/`) to any static host with access to Curio RPC.

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

## License

MIT
