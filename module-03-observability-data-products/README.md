# Module 03 - Observability & Data Products

> **Scenario.** Kong Event Gateway is deployed with ACLs, OAuth, schema validation, and encryption. Kafka traffic flows through the gateway with security and governance applied, but you have no visibility into traffic patterns, no way to package topics as self-service data products, and no protocol mediation for non-Kafka clients.

## Module outcomes

By the end of this module, you will be able to:

- Set up OpenTelemetry observability for Kafka traffic
- Create namespace policies for data product packaging
- Implement record filtering for selective consumption
- Configure multi-tenant isolation via virtual clusters
- Enable protocol mediation (REST to Kafka)
- Set up monitoring dashboards in Konnect

## Prerequisites

You have completed Module 02 with policies and security configured.

```bash
# Verify Event Gateway with policies
docker ps | grep event-gateway

# Verify ACLs are working
kcat -b localhost:9192 -L
```

## What you need

| Tool | Purpose | Minimum |
|---|---|---|
| Kong Konnect | Control plane for Event Gateway | - |
| Docker Desktop | Run Event Gateway and Kafka | latest |
| kcat | Kafka CLI | latest |
| jq | JSON inspection | 1.6+ |

## Labs

| Lab | Focus | Time |
|---|---|---|
| [01 - OTel & Namespaces](/module-03-observability-data-products/labs/01-otel-namespaces) | OTel, namespaces, record filtering, multi-tenant, protocol mediation | ~40 min |

## Suggested reading

- [Entities (clusters, listeners, policies)](https://developer.konghq.com/event-gateway/entities/)
- [Event Gateway overview](https://developer.konghq.com/event-gateway/)

## Exit ticket

1. What are namespaces and how do they enable data product packaging without duplicating Kafka topics?

## Common pitfalls

| Symptom | Likely cause | Mitigation |
|---|---|---|
| OTel traces not appearing | Collector endpoint not reachable or wrong port | Verify OTel collector connectivity and endpoint config |

---

*[← Home](/) · [Lab 01 →](/module-03-observability-data-products/labs/01-otel-namespaces)*
