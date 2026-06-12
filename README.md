# Kong Event Gateway Bootcamp

![Kong Event Gateway](https://img.shields.io/badge/Kong%20Event%20Gateway-latest-CCFF00?style=for-the-badge&labelColor=001408)
![Platform: Konnect](https://img.shields.io/badge/Platform-Konnect-CCFF00?style=for-the-badge&labelColor=001408)
![Modules: 3](https://img.shields.io/badge/Modules-3-CCFF00?style=for-the-badge&labelColor=001408)

> 📡 **Govern, secure, and observe Kafka traffic at scale.**

A hands-on bootcamp for learning Kong Event Gateway - ACLs, OAuth, schema validation, encryption, and data product packaging through a central Kafka proxy.

## Overview

| | |
|---|---|
| **Kong Event Gateway** | **latest** |
| **Format** | 3 modules, 3 labs (~2.5 hours) |
| **Flow** | deploy & connect → policies & security → observability & data products |
| **Platform** | Kong Event Gateway + Konnect |

## Bootcamp Modules

| # | Module | Key Topics |
|---|---|---|
| 01 | **Deploy & Connect** | Backend clusters, virtual clusters, listeners, produce/consume |
| 02 | **Policies & Security** | ACLs, OAuth, mTLS, schema validation, encryption |
| 03 | **Observability & Data Products** | OTel, namespaces, record filtering, protocol mediation |

## Modules

| Module | Topic |
|---|---|
| [Module 01 - Deploy & Connect](./module-01-deploy-connect/) | Deploy Event Gateway and connect to Kafka |
| [Module 02 - Policies & Security](./module-02-policies-security/) | Apply ACLs, authentication, and schema validation |
| [Module 03 - Observability & Data Products](./module-03-observability-data-products/) | Add observability and package data products |

## Prerequisites

- [Kong Konnect](https://cloud.konghq.com) account
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- A running Kafka cluster (or use Docker Compose with Kafka)
- [kcat](https://github.com/edenhill/kcat) (kafkacat) CLI
- [jq](https://stedolan.github.io/jq/) 1.6+
- [Node.js](https://nodejs.org/) 20 LTS (for docs site)

## Getting Started

### Run the Docs Site Locally

```bash
npm install
npm run docs:dev
```

The docs site will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run docs:build
npm run docs:preview
```

## Project Structure

```
event-gateway-bootcamp/
├── docs/                                       # VitePress documentation source
│   └── .vitepress/                             # VitePress config & theme
├── module-01-deploy-connect/
│   ├── README.md                               # Module overview
│   └── labs/
│       └── 01-gateway-setup.md                 # Deploy & Connect
├── module-02-policies-security/
│   ├── README.md                               # Module overview
│   └── labs/
│       └── 01-kafka-policies.md                # Policies & Security
├── module-03-observability-data-products/
│   ├── README.md                               # Module overview
│   └── labs/
│       └── 01-otel-namespaces.md               # Observability & Data Products
├── index.md                                    # Home page
└── package.json
```

## Stack

| Tool | Purpose |
|---|---|
| [Kong Event Gateway](https://developer.konghq.com/event-gateway/) | Kafka proxy |
| [Kong Konnect](https://cloud.konghq.com) | Control plane |
| [Apache Kafka](https://kafka.apache.org/) | Event streaming |
| [VitePress](https://vitepress.dev) | Documentation site |

## License

[MIT](./LICENSE)
