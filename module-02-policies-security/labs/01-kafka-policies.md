# Lab 02 - Policies & Security

> **Story so far.** Kong Event Gateway is deployed and proxying Kafka traffic. Messages flow from clients through the gateway to Kafka brokers. But traffic is wide open - any client can produce to or consume from any topic.
>
> **Problem.** Without policies, the Event Gateway is just a pass-through proxy. You need ACLs for topic-level access control, authentication to verify client identity, schema validation for data quality, and encryption for sensitive messages.
>
> **This lab.** You'll configure ACL policies, OAuth authentication with Kong Identity, mTLS for backend and client auth, schema validation at produce and consume phases, encryption/decryption policies for message-level security, and hostname mapping.

---

## Before you start

```bash
# Verify Event Gateway from Lab 01
docker ps | grep kong-event-gateway
# Container running

# Verify Kafka connectivity through the gateway
kcat -b localhost:9192 -L
# Should list brokers via the proxy

# Verify environment variables
echo $EG_CP_ID
echo $BACKEND_CLUSTER_ID
```

---

## Step 1 - ACL policies for topic-level access control (15 min)

**What it does:** ACL (Access Control List) policies define which clients or groups can produce to or consume from specific topics. This is the foundation of Event Gateway security.

### Create an ACL policy

```bash
export VIRTUAL_CLUSTER_ID=$(curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/virtual-clusters" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq -r '.data[0].id')

# Allow team-a to produce to 'orders' topic
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "team-a-orders-produce",
    "type": "acl",
    "virtual_cluster": {
      "id": "'$VIRTUAL_CLUSTER_ID'"
    },
    "config": {
      "rules": [
        {
          "resource_type": "topic",
          "resource_name": "orders",
          "operation": "write",
          "effect": "allow",
          "principal": "team-a"
        }
      ]
    }
  }' | jq '.'
```

### Create a consume ACL

```bash
# Allow team-b to consume from 'orders' topic
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "team-b-orders-consume",
    "type": "acl",
    "virtual_cluster": {
      "id": "'$VIRTUAL_CLUSTER_ID'"
    },
    "config": {
      "rules": [
        {
          "resource_type": "topic",
          "resource_name": "orders",
          "operation": "read",
          "effect": "allow",
          "principal": "team-b"
        }
      ]
    }
  }' | jq '.'
```

### Verify ACL policies

```bash
curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies?type=acl" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq '.data[] | {name, type}'
```

::: tip ACL policy patterns
- Use `resource_name: "*"` for wildcard topic matching
- Use `effect: "deny"` with `principal: "*"` for default-deny, then add specific allows
- ACL policies are evaluated in priority order - more specific rules override broader ones
:::

**✅ Checkpoint.** ACL policies control who can produce to and consume from specific topics.

---

## Step 2 - OAuth authentication (10 min)

**What it does:** Adds OAuth authentication to the Event Gateway. Clients must present a valid OAuth token to connect, and the token's claims are used for ACL principal matching.

### Configure OAuth authentication policy

```bash
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "oauth-auth",
    "type": "authentication",
    "virtual_cluster": {
      "id": "'$VIRTUAL_CLUSTER_ID'"
    },
    "config": {
      "method": "oauth",
      "oauth": {
        "token_endpoint": "https://your-idp.example.com/oauth/token",
        "jwks_uri": "https://your-idp.example.com/.well-known/jwks.json",
        "principal_claim": "sub",
        "audience": "kafka-event-gateway"
      }
    }
  }' | jq '.'
```

### How OAuth + ACLs work together

1. Client connects to Event Gateway with an OAuth token
2. Event Gateway validates the token against the JWKS endpoint
3. The `principal_claim` (e.g., `sub`) is extracted from the token
4. ACL policies match against this principal to authorize topic access

**✅ Checkpoint.** OAuth authentication is configured. Clients must authenticate before ACL policies are evaluated.

---

## Step 3 - mTLS configuration (10 min)

**What it does:** Configures mutual TLS for encrypted, authenticated connections - both between the gateway and Kafka brokers (backend mTLS) and between clients and the gateway (client mTLS).

### Backend cluster mTLS

```bash
# Update backend cluster with TLS settings
curl -s -X PATCH "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/backend-clusters/$BACKEND_CLUSTER_ID" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tls": {
      "enabled": true,
      "ca_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
      "client_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
      "client_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
    }
  }' | jq '.'
```

### Client-facing mTLS on listener

```bash
# Update listener for TLS
curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/listeners" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq '.data[] | {id, name, protocol}'
```

::: tip mTLS layers
Event Gateway supports mTLS at two layers:
- **Backend mTLS:** Gateway ↔ Kafka brokers (encrypts internal traffic)
- **Client mTLS:** Kafka clients ↔ Gateway (authenticates and encrypts client connections)
Both can be enabled independently.
:::

**✅ Checkpoint.** You understand how to configure mTLS for both backend and client-facing connections.

---

## Step 4 - Schema validation (10 min)

**What it does:** Enforces schema compliance on messages at both produce and consume phases. Producers must send valid data, and consumers receive only schema-compliant messages.

### Create a schema validation policy (produce phase)

```bash
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "orders-schema-produce",
    "type": "schema_validation",
    "virtual_cluster": {
      "id": "'$VIRTUAL_CLUSTER_ID'"
    },
    "config": {
      "phase": "produce",
      "topic": "orders",
      "schema_type": "json",
      "schema": {
        "type": "object",
        "required": ["order_id", "customer_id", "amount"],
        "properties": {
          "order_id": {"type": "string"},
          "customer_id": {"type": "string"},
          "amount": {"type": "number", "minimum": 0},
          "currency": {"type": "string", "enum": ["USD", "EUR", "GBP"]}
        }
      }
    }
  }' | jq '.'
```

### Test schema validation

```bash
# Valid message - should succeed
echo '{"order_id": "ORD-001", "customer_id": "CUST-001", "amount": 99.99, "currency": "USD"}' | \
  kcat -b localhost:9192 -t orders -P

# Invalid message (missing required field) - should be rejected
echo '{"order_id": "ORD-002", "amount": "not-a-number"}' | \
  kcat -b localhost:9192 -t orders -P
# Should return an error
```

**✅ Checkpoint.** Schema validation rejects malformed messages at produce time, ensuring data quality.

---

## Step 5 - Encryption and decryption policies (5 min)

**What it does:** Encrypts sensitive message fields before they reach Kafka and decrypts them on consume. This provides message-level security beyond TLS transport encryption.

### Create an encryption policy

```bash
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/policies" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "orders-encrypt",
    "type": "encryption",
    "virtual_cluster": {
      "id": "'$VIRTUAL_CLUSTER_ID'"
    },
    "config": {
      "phase": "produce",
      "topic": "orders",
      "fields": ["customer_id", "amount"],
      "key_id": "encryption-key-001"
    }
  }' | jq '.'
```

::: tip Encryption vs TLS
- **TLS:** Encrypts the connection (data in transit between client and gateway, or gateway and Kafka)
- **Encryption policies:** Encrypt specific message fields (data at rest in Kafka). Even Kafka operators can't read encrypted fields.
:::

**✅ Checkpoint.** Sensitive fields are encrypted before reaching Kafka storage.

---

## Step 6 - Hostname mapping (5 min)

**What it does:** Maps client-facing hostnames to virtual clusters. Supports port-based mapping and SNI-based routing for multiple virtual clusters on a single listener.

### Port-based mapping

Each virtual cluster gets a unique port:
- `localhost:9192` → `team-a-cluster`
- `localhost:9193` → `team-b-cluster`

### SNI-based routing

Multiple virtual clusters share a port, differentiated by TLS SNI:
- `team-a.kafka.example.com:9192` → `team-a-cluster`
- `team-b.kafka.example.com:9192` → `team-b-cluster`

```bash
# View current hostname mapping
curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/hostname-mappings" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq '.'
```

**✅ Checkpoint.** You understand port-based and SNI-based hostname mapping for multi-tenant deployments.

---

## Summary

| Command / Concept | Purpose |
|---|---|
| ACL policy | Topic-level produce/consume access control |
| OAuth authentication | Token-based client identity verification |
| Backend mTLS | Encrypted connection to Kafka brokers |
| Client mTLS | Authenticated, encrypted client connections |
| Schema validation (produce) | Reject malformed messages before they reach Kafka |
| Schema validation (consume) | Filter non-compliant messages on read |
| Encryption policy | Field-level message encryption at rest |
| Hostname mapping | Route clients to virtual clusters by port or SNI |

---

*[← Lab 01: Deploy & Connect](/module-01-deploy-connect/labs/01-gateway-setup) · [Next → Lab 03: Observability & Data Products](/module-03-observability-data-products/labs/01-otel-namespaces)*
