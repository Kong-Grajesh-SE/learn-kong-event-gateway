# Lab 03 - Observability & Data Products

> **Story so far.** Kong Event Gateway is deployed with ACLs, OAuth, schema validation, and encryption. Kafka traffic flows through the gateway with security and governance applied.
>
> **Problem.** You have security and policy enforcement, but no visibility into traffic patterns, no way to package topics as self-service data products, and no protocol mediation for non-Kafka clients.
>
> **This lab.** You'll set up OpenTelemetry observability, create namespace policies for data product packaging, implement record filtering, configure multi-tenant isolation via virtual clusters, enable protocol mediation (REST to Kafka), and set up monitoring in Konnect.

---

## Before you start

```bash
# Verify Event Gateway with policies from Lab 02
docker ps | grep kong-event-gateway

# Verify policies exist
curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq '.data[] | {name, type}'

# Verify environment variables
echo $EG_CP_ID
echo $VIRTUAL_CLUSTER_ID
```

---

## Step 1 - OpenTelemetry observability (10 min)

**What it does:** Enables telemetry collection from the Event Gateway data plane. Metrics, traces, and logs are sent to an OpenTelemetry collector for monitoring and alerting.

### Configure OpenTelemetry

```bash
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "otel-observability",
    "type": "observability",
    "config": {
      "opentelemetry": {
        "endpoint": "http://otel-collector:4317",
        "metrics": {
          "enabled": true,
          "interval_seconds": 30
        },
        "traces": {
          "enabled": true,
          "sample_rate": 0.1
        }
      }
    }
  }' | jq '.'
```

### Key metrics exported

| Metric | Description |
|---|---|
| `kafka.produce.requests` | Number of produce requests through the gateway |
| `kafka.consume.requests` | Number of consume requests through the gateway |
| `kafka.request.latency` | Latency of proxied Kafka requests |
| `kafka.policy.evaluations` | Policy evaluation counts (allow, deny, error) |
| `kafka.bytes.produced` | Bytes produced through the gateway |
| `kafka.bytes.consumed` | Bytes consumed through the gateway |

### Check Konnect analytics

1. Navigate to **Event Gateway** → **Analytics** in Konnect
2. View traffic patterns, latency, and policy evaluation results
3. Filter by virtual cluster, topic, or policy type

**✅ Checkpoint.** OpenTelemetry is configured. Metrics and traces flow to your collector and are visible in Konnect analytics.

---

## Step 2 - Namespace policies for data products (10 min)

**What it does:** Namespaces let you package a set of Kafka topics as a self-service data product. Consumers subscribe to a namespace (data product) rather than individual topics, simplifying access management.

### Create a namespace

```bash
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/namespaces" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "order-events",
    "display_name": "Order Events Data Product",
    "description": "All events related to the order lifecycle",
    "virtual_cluster": {
      "id": "'$VIRTUAL_CLUSTER_ID'"
    },
    "topics": [
      "orders",
      "order-updates",
      "order-completions"
    ]
  }' | jq '.'
```

### Why namespaces matter

Without namespaces:
- Consumer needs ACLs for each individual topic
- Topic names leak internal implementation details
- Renaming topics breaks all consumers

With namespaces:
- Consumer subscribes to the "Order Events" data product
- Topics can be added/removed/renamed without breaking consumers
- Access is managed at the namespace level

::: tip Data products vs topics
Think of namespaces as the API contract for event-driven systems. Just like a REST API hides database tables behind endpoints, a namespace hides Kafka topics behind a curated data product.
:::

**✅ Checkpoint.** A namespace packages three order-related topics into a single data product.

---

## Step 3 - Record filtering (10 min)

**What it does:** Filters individual records (messages) based on headers or content before delivering them to consumers. Useful for privacy compliance, data classification, and selective consumption.

### Create a record filtering policy

```bash
# Filter records by classification header
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "filter-pii-records",
    "type": "record_filter",
    "virtual_cluster": {
      "id": "'$VIRTUAL_CLUSTER_ID'"
    },
    "config": {
      "phase": "consume",
      "topic": "orders",
      "filter": {
        "header": "classification",
        "operation": "not_equals",
        "value": "pii"
      }
    }
  }' | jq '.'
```

### How it works with Modify Headers + Skip Records

1. **Modify Headers policy:** Adds classification headers to records at produce time
2. **Record Filter (Skip Records) policy:** Skips records with specific header values at consume time
3. Combined: Producers tag data, consumers only see records matching their clearance level

**✅ Checkpoint.** Record filtering hides PII-classified records from consumers without the appropriate clearance.

---

## Step 4 - Multi-tenant isolation (5 min)

**What it does:** Uses virtual clusters to completely isolate tenant traffic. Each tenant gets their own virtual cluster with independent policies, topic prefixes, and access controls.

### Create a second virtual cluster for tenant B

```bash
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/virtual-clusters" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "team-b-cluster",
    "backend_cluster": {
      "id": "'$BACKEND_CLUSTER_ID'"
    },
    "prefix": "team-b-"
  }' | jq '.'
```

### Isolation guarantees

| Isolation type | Mechanism |
|---|---|
| **Topic isolation** | Topic prefix mapping (`team-a-orders` → `orders` in team-a's view) |
| **Policy isolation** | Policies scoped to virtual clusters |
| **Network isolation** | Separate listeners or SNI-based routing |
| **Identity isolation** | Separate OAuth configurations per virtual cluster |

**✅ Checkpoint.** Two virtual clusters provide complete tenant isolation on a shared Kafka backend.

---

## Step 5 - Protocol mediation: REST to Kafka (5 min)

**What it does:** Enables REST clients to produce and consume Kafka messages via HTTP. Clients don't need a Kafka client library - they use standard HTTP requests.

### Configure REST proxy

```bash
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rest-proxy",
    "type": "protocol_mediation",
    "virtual_cluster": {
      "id": "'$VIRTUAL_CLUSTER_ID'"
    },
    "config": {
      "rest": {
        "enabled": true,
        "port": 8082,
        "content_type": "application/json"
      }
    }
  }' | jq '.'
```

### Test REST produce

```bash
# Produce via REST
curl -s -X POST http://localhost:8082/topics/orders \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"value": {"order_id": "ORD-REST-001", "customer_id": "CUST-001", "amount": 49.99, "currency": "USD"}}
    ]
  }' | jq '.'
```

### Test REST consume

```bash
# Consume via REST
curl -s http://localhost:8082/topics/orders/records \
  | jq '.'
```

::: tip When to use REST mediation
REST mediation is ideal for:
- Web applications that can't use the Kafka protocol
- Serverless functions without Kafka client libraries
- Quick integrations where Kafka client setup is overhead
- Testing and debugging without installing kcat
:::

**✅ Checkpoint.** REST clients can produce to and consume from Kafka topics via HTTP without Kafka client libraries.

---

## Step 6 - Monitoring in Konnect (5 min)

**What it does:** Reviews the Konnect dashboard for Event Gateway analytics, traffic patterns, and policy enforcement metrics.

### Explore Konnect analytics

1. Navigate to **Event Gateway** in Konnect
2. Check the **Overview** dashboard for:
   - Total messages proxied
   - Messages by virtual cluster
   - Policy enforcement results (allow/deny counts)
   - Latency percentiles

3. Drill into **Topics** to see per-topic metrics
4. Review **Policies** tab for policy evaluation statistics

```bash
# List all policies and their status
curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq '.data[] | {name, type, enabled}'
```

**✅ Checkpoint.** Konnect provides centralized visibility into Event Gateway traffic, policies, and performance.

---

## Summary

| Command / Concept | Purpose |
|---|---|
| OpenTelemetry | Metrics, traces, and logs from Event Gateway |
| Namespace | Package topics as a self-service data product |
| Record filtering | Skip records based on headers/content at consume time |
| Multi-tenant isolation | Virtual clusters with independent policies and topic prefixes |
| Protocol mediation | REST-to-Kafka proxy for HTTP clients |
| Konnect analytics | Centralized dashboard for traffic and policy metrics |
| Modify Headers + Skip Records | Tag and filter records by classification |

---

*[← Lab 02: Policies & Security](/module-02-policies-security/labs/01-kafka-policies) · [Module Overview →](/module-03-observability-data-products/)*
