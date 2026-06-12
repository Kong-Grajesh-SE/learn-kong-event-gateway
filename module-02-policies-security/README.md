# Module 02 - Policies & Security

> **Scenario.** Kong Event Gateway is deployed and proxying Kafka traffic, but traffic is wide open — any client can produce to or consume from any topic. You need ACLs for topic-level access control, authentication to verify client identity, schema validation for data quality, and encryption for sensitive messages.

## Module outcomes

By the end of this module, you will be able to:

- Apply ACL policies for topic-level access control
- Configure OAuth authentication with Kong Identity
- Set up mTLS for backend and client authentication
- Enforce schema validation at produce and consume phases
- Apply encryption and decryption policies for message-level security
- Configure hostname mapping with port mapping and SNI routing

## Prerequisites

You have completed Module 01 with Event Gateway deployed and producing/consuming through it.

```bash
# Verify Event Gateway is running
docker ps | grep event-gateway

# Verify Kafka connectivity through the gateway
kcat -b localhost:9192 -L
```

## What you need

| Tool | Purpose | Minimum |
|---|---|---|
| Kong Konnect | Control plane for Event Gateway | — |
| Docker Desktop | Run Event Gateway and Kafka | latest |
| kcat | Kafka CLI | latest |
| jq | JSON inspection | 1.6+ |

## Labs

| Lab | Focus | Time |
|---|---|---|
| [01 - Kafka Policies](/module-02-policies-security/labs/01-kafka-policies) | ACLs, OAuth, mTLS, schema validation, encryption, hostname mapping | ~50 min |

## Suggested reading

- [Policies reference](https://developer.konghq.com/event-gateway/policies/)
- [Authentication](https://developer.konghq.com/event-gateway/authentication/)
- [Hostname mapping](https://developer.konghq.com/event-gateway/hostname-mapping/)

## Exit ticket

1. How do ACL policies and OAuth authentication work together to provide topic-level access control?

## Common pitfalls

| Symptom | Likely cause | Mitigation |
|---|---|---|
| ACL denying expected access | Policy order or scope mismatch | Check policy priority and topic pattern matching |
| Schema validation rejecting valid messages | Schema version mismatch or wrong schema registry URL | Verify schema registry connectivity and schema compatibility |
| mTLS handshake failures | Certificate chain incomplete or wrong CA | Verify full certificate chain and CA trust store |

---

*[← Home](/) · [Lab 01 →](/module-02-policies-security/labs/01-kafka-policies)*
