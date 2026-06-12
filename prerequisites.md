---
outline: deep
description: Everything you need installed before starting the Kong Event Gateway Bootcamp.
---

# Prerequisites

::: warning Kafka cluster required
This bootcamp proxies Kafka traffic through Kong Event Gateway. You need a running Kafka cluster (or Docker Compose to start one) before beginning.
:::

## Required tools

| Tool | Purpose | Min Version | Install |
|---|---|---|---|
| **Kong Konnect** | Control plane for Event Gateway | — | [cloud.konghq.com](https://cloud.konghq.com) |
| **Docker Desktop** | Run Event Gateway and Kafka | latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Kafka** | Event streaming backend | 3.x+ | Docker Compose or existing cluster |
| **kcat** | Kafka CLI (kafkacat) | latest | `brew install kcat` |
| **jq** | Parse JSON responses | 1.6+ | `brew install jq` |
| **Node.js** | Run the docs site locally | 20 LTS | `brew install node@20` |

## Konnect setup

1. Sign up at [cloud.konghq.com](https://cloud.konghq.com) (free tier works)
2. Create a Personal Access Token (PAT): **Account** → **Tokens** → **Generate Token**
3. Navigate to **Event Gateway** in the Konnect sidebar

```bash
export KONNECT_TOKEN="kpat_your_token_here"
```

## Kafka cluster

You need a running Kafka cluster. The easiest option is Docker Compose:

```bash
# Quick Kafka setup with Docker Compose
cat > docker-compose-kafka.yaml << 'EOF'
version: '3.8'
services:
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
EOF

docker compose -f docker-compose-kafka.yaml up -d
```

## Verify your setup

```bash
# Docker
docker --version
# Docker version 24+

# kcat
kcat -V
# Should show version info

# Kafka connectivity
kcat -b localhost:9092 -L
# Should list brokers and topics

# jq
jq --version
# jq-1.6+
```

---

*Ready? Start with [Lab 01 - Deploy & Connect →](/module-01-event-gateway-fundamentals/labs/01-deploy-connect)*
