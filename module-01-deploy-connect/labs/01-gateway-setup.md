# Lab 01 - Deploy & Connect

> **Story so far.** Your organization uses Apache Kafka for event-driven communication. Client applications connect directly to Kafka brokers with no centralized access control, no traffic visibility, and no governance layer.
>
> **Problem.** Direct Kafka access means any client with broker credentials can produce to or consume from any topic. There's no audit trail, no schema enforcement, and no way to manage client access centrally.
>
> **This lab.** You'll deploy Kong Event Gateway via Konnect, understand the architecture (CP, DP, backend clusters), create a backend cluster pointing to Kafka, create virtual clusters for client isolation, configure listeners, and verify end-to-end Kafka produce/consume through the Event Gateway.

---

## Before you start

```bash
# Verify tools
docker --version
kcat -V
jq --version

# Verify Kafka is running
kcat -b localhost:9092 -L
# Should list brokers
```

You need a running Kafka cluster and a Kong Konnect account.

```bash
export KONNECT_TOKEN="kpat_your_token_here"
export KONNECT_API="https://us.api.konghq.com"
```

---

## Step 1 - Understand the architecture (5 min)

**What it does:** Before deploying, understand how Kong Event Gateway fits between your Kafka clients and Kafka brokers.

### Architecture overview

| Component | Description |
|---|---|
| **Control Plane (CP)** | Managed by Konnect — stores configuration, policies, and routing rules |
| **Data Plane (DP)** | The Event Gateway proxy — deployed near your Kafka cluster |
| **Backend Cluster** | Connection to your actual Kafka brokers |
| **Virtual Cluster** | Logical isolation layer for client groups |
| **Listener** | Network endpoint where Kafka clients connect |

### Traffic flow

```
Kafka Client → Listener → Virtual Cluster → Policies → Backend Cluster → Kafka Brokers
```

Clients connect to the Event Gateway listener instead of directly to Kafka. The gateway applies policies (ACLs, auth, schema validation) before forwarding traffic to the backend Kafka cluster.

::: tip Why a Kafka proxy?
Kong Event Gateway sits in front of Kafka like Kong API Gateway sits in front of REST APIs. It provides authentication, authorization, schema validation, encryption, and observability — without modifying your Kafka brokers or client applications.
:::

**✅ Checkpoint.** You understand the traffic flow: clients → listener → virtual cluster → policies → backend cluster → Kafka.

---

## Step 2 - Deploy Event Gateway via Konnect (10 min)

**What it does:** Creates an Event Gateway control plane in Konnect and deploys the data plane proxy.

### Create Event Gateway in Konnect

1. Log in to [cloud.konghq.com](https://cloud.konghq.com)
2. Navigate to **Event Gateway** in the left sidebar
3. Click **Create Event Gateway**
4. Name it `bootcamp-event-gateway`
5. Copy the data plane deployment script

### Deploy the data plane

Konnect provides a quickstart script. Run it to deploy the Event Gateway data plane:

```bash
# The Konnect UI provides a Docker run command like:
docker run -d --name kong-event-gateway \
  -p 9192:9192 \
  -e KONG_ROLE=data_plane \
  -e KONG_CLUSTER_CONTROL_PLANE="your-cp-endpoint:443" \
  -e KONG_CLUSTER_TELEMETRY_ENDPOINT="your-telemetry-endpoint:443" \
  -e KONG_CLUSTER_CERT="your-cert" \
  -e KONG_CLUSTER_CERT_KEY="your-cert-key" \
  kong/kong-event-gateway:latest
```

### Verify the data plane is connected

```bash
# Check the container is running
docker ps | grep kong-event-gateway

# Check logs for successful connection
docker logs kong-event-gateway 2>&1 | tail -20
# Look for "connected to control plane"
```

In Konnect, verify the data plane shows as **Connected** in the Event Gateway dashboard.

**✅ Checkpoint.** Event Gateway data plane is running and connected to the Konnect control plane.

---

## Step 3 - Create a backend cluster (10 min)

**What it does:** A backend cluster defines the connection to your actual Kafka brokers. The Event Gateway forwards traffic to this cluster after applying policies.

### Create the backend cluster

```bash
# Get the Event Gateway control plane ID
export EG_CP_ID=$(curl -s "$KONNECT_API/v2/control-planes" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq -r '.data[] | select(.config.control_plane_endpoint != null) | select(.name == "bootcamp-event-gateway") | .id')

echo "Event Gateway CP ID: $EG_CP_ID"

# Create a backend cluster pointing to your Kafka
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/backend-clusters" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "local-kafka",
    "bootstrap_servers": "host.docker.internal:9092"
  }' | jq '.'
```

### Verify the backend cluster

```bash
curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/backend-clusters" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq '.data[] | {name, bootstrap_servers}'
```

::: tip Docker networking
When Kafka runs on your host machine and Event Gateway runs in Docker, use `host.docker.internal` to reach the host's `localhost:9092`.
:::

**✅ Checkpoint.** Backend cluster `local-kafka` is created and points to your Kafka brokers.

---

## Step 4 - Create virtual clusters (10 min)

**What it does:** Virtual clusters provide logical isolation between client groups. Each virtual cluster has its own policies and connects to a backend cluster.

### Create a virtual cluster

```bash
export BACKEND_CLUSTER_ID=$(curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/backend-clusters" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq -r '.data[0].id')

curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/virtual-clusters" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "team-a-cluster",
    "backend_cluster": {
      "id": "'$BACKEND_CLUSTER_ID'"
    },
    "prefix": "team-a-"
  }' | jq '.'
```

### Verify virtual clusters

```bash
curl -s "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/virtual-clusters" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  | jq '.data[] | {name, prefix}'
```

**✅ Checkpoint.** Virtual cluster `team-a-cluster` is created with topic prefix isolation.

---

## Step 5 - Configure listeners (5 min)

**What it does:** Listeners define the network endpoints where Kafka clients connect to the Event Gateway.

### Create a listener

```bash
curl -s -X POST "$KONNECT_API/v2/control-planes/$EG_CP_ID/core-entities/listeners" \
  -H "Authorization: Bearer $KONNECT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "kafka-listener",
    "port": 9192,
    "protocol": "PLAINTEXT"
  }' | jq '.'
```

**✅ Checkpoint.** A listener is configured on port 9192 for Kafka client connections.

---

## Step 6 - Verify end-to-end produce/consume (5 min)

**What it does:** Tests the full flow: produce a message through the Event Gateway, consume it back through the Event Gateway.

### Create a test topic in Kafka

```bash
kcat -b localhost:9092 -t test-topic -P << 'EOF'
{"message": "Hello from direct Kafka"}
EOF
```

### Produce through Event Gateway

```bash
echo '{"message": "Hello through Event Gateway"}' | \
  kcat -b localhost:9192 -t test-topic -P
```

### Consume through Event Gateway

```bash
kcat -b localhost:9192 -t test-topic -C -e
# Should show both messages
```

::: tip Transparent proxying
Kafka clients connect to the Event Gateway listener (port 9192) using the standard Kafka protocol. No client-side code changes are needed — just change the bootstrap server address.
:::

**✅ Checkpoint.** Messages flow through the Event Gateway: produce → gateway → Kafka → gateway → consume. The proxy is transparent to Kafka clients.

---

## Summary

| Command / Concept | Purpose |
|---|---|
| Control Plane (Konnect) | Manages Event Gateway configuration and policies |
| Data Plane | The Event Gateway proxy container |
| Backend Cluster | Connection to actual Kafka brokers |
| Virtual Cluster | Logical isolation for client groups |
| Listener | Network endpoint for Kafka client connections |
| `kcat -b localhost:9192` | Connect to Kafka through Event Gateway |
| Traffic flow | Client → Listener → Virtual Cluster → Policies → Backend → Kafka |

---

*[← Module Overview](/module-01-deploy-connect/) · [Next → Lab 02: Policies & Security](/module-01-deploy-connect/labs/02-policies-security)*
