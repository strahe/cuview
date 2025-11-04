# Cuview

[![CI](https://github.com/strahe/cuview/actions/workflows/ci.yml/badge.svg)](https://github.com/strahe/cuview/actions/workflows/ci.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/strahe/cuview/badge/main)](https://www.codefactor.io/repository/github/strahe/cuview/overview/main)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/strahe/cuview)](https://github.com/strahe/cuview/releases)

A modern, responsive UI theme for Curio.

## Overview
Cuview provides a modern, lightweight alternative to the built-in Curio UI, giving a concise view of cluster health, machine availability, sealing throughput, storage allocation, and market signals.
It’s a static frontend that connects directly to Curio RPC, so you can host it anywhere—such as GitHub Pages, S3, or any static host with RPC access.

## Usage

- Visit [cuview.strahe.com](http://cuview.strahe.com) for the latest build.
- Make sure protocols match: use `http://` with an `http://` Curio RPC endpoint, and `https://` with `https://` to avoid mixed-content warnings.
- To self-host, deploy the static bundle to any host that can reach your Curio RPC.

https://github.com/user-attachments/assets/ec47bbf1-96d1-4dab-ab4b-04b2ebc9115f

## Local Development

```bash
npm install    # Install dependencies
npm run dev    # Start local preview
npm run check  # Run type, lint, and formatting checks
npm run build  # Create production build
```

## Feedback
Have ideas or issues? [Open an issue](https://github.com/strahe/cuview/issues/new) to share your feedback.

## License
MIT License
