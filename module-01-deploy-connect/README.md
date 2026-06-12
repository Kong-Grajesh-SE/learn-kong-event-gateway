# Module 01 - Deploy & Connect

> **Scenario.** Your organization uses Apache Kafka for event-driven communication. Client applications connect directly to Kafka brokers with no centralized access control, no traffic visibility, and no governance layer. Direct Kafka access means any client with broker credentials can produce to or consume from any topic.

## Module outcomes

By the end of this module, you will be able to:

- Deploy Kong Event Gateway via Konnect
- Understand the Event Gateway architecture (CP, DP, backend clusters)
- Create backend clusters pointing to Kafka and virtual clusters for client isolation
- Configure listeners for Kafka client connections
- Verify end-to-end Kafka produce/consume through the Event Gateway

## Prerequisites

You have a Kong Konnect account and a running Kafka cluster.

```bash
# Verify Docker
docker --version
# Docker version 24+

# Verify kcat
kcat -V

# Verify Kafka connectivity
kcat -b localhost:9092 -L

# jq
jq --version
# jq-1.6+
```

## What you need

| Tool | Purpose | Minimum |
|---|---|---|
| Kong Konnect | Control plane for Event Gateway | - |
| Docker Desktop | Run Event Gateway and Kafka | latest |
| Kafka cluster | Event streaming backend | 3.x+ |
| kcat | Kafka CLI | latest |
| jq | JSON inspection | 1.6+ |

## Labs

| Lab | Focus | Time |
|---|---|---|
| [01 - Gateway Setup](/module-01-deploy-connect/labs/01-gateway-setup) | Architecture, backend/virtual clusters, listeners, produce/consume | ~45 min |

## Suggested reading

- [Event Gateway overview](https://developer.konghq.com/event-gateway/)
- [Architecture](https://developer.konghq.com/event-gateway/architecture/)
- [Getting started](https://developer.konghq.com/event-gateway/getting-started/)

## Exit ticket

1. What is the relationship between backend clusters, virtual clusters, and listeners in Event Gateway?

## Common pitfalls

| Symptom | Likely cause | Mitigation |
|---|---|---|
| Client can't connect through Event Gateway | Listener not configured or wrong port | Verify listener port and hostname mapping |
| Virtual cluster isolation not working | Missing or incorrect virtual cluster configuration | Check virtual cluster-to-backend cluster mapping |

---

*[← Home](/) · [Lab 01 →](/module-01-deploy-connect/labs/01-gateway-setup)*
