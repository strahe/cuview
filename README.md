# Cuview

[![CI](https://github.com/strahe/cuview/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/strahe/cuview/actions/workflows/ci.yml)
[![Deploy](https://github.com/strahe/cuview/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/strahe/cuview/actions/workflows/deploy-pages.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/strahe/cuview/badge/main)](https://www.codefactor.io/repository/github/strahe/cuview/overview/main)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)

A modern, responsive dashboard UI for [Curio](https://github.com/filecoin-project/curio) nodes.

## Features

- **Comprehensive Node Overview**: Monitor chain connectivity, storage stats, and task counts at a glance.
- **Pipeline Monitoring**: Real-time status for PoRep and Snap pipelines with detailed task history.
- **Sector Management**: Full visibility into sector lifecycle, expiration, and scheduler status.
- **Market Operations**: Manage storage asks, balance escrow, and monitor deals (MK12/MK20).
- **Advanced Diagnostics**: In-app sector diagnostics, CommR checks, and WdPost testing.
- **System Control**: Manage Harmony tasks, machines, and configuration layers.

## Usage

- Online dashboard: [https://cuview.strahe.com](https://cuview.strahe.com) / [http://cuview.strahe.com](http://cuview.strahe.com)
- Match protocols to avoid mixed-content issues: use `http` endpoints with `http` pages, and `https` endpoints with `https` pages.
- Self-hosting: run `pnpm build` and serve `dist/` on any static host with Curio RPC access.

## Deployment

- GitHub Pages deployment is automated on pushes to `main`.

## Development

### Prerequisites

- Node.js 22+
- pnpm (recommended)

### Quick Start

```bash
pnpm install
pnpm dev
```

### Setup

Before running the dashboard, ensure you have a Curio node running with the WebRPC API enabled. Configure the connection on the initial setup page.

## Build

To build the production-ready static assets:

```bash
pnpm build
```

The output will be in the `dist/` directory.

## License

MIT
