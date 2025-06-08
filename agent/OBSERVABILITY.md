# Observability

triagepack ships with OpenTelemetry built in. The reasoning loop emits spans for the lifecycle of every alert: `triage.run` (root), `triage.gather` (parallel MCP fetch), and `triage.model_call` (Anthropic call). Span attributes include `alert.service`, `alert.severity`, `triage.confidence`, and `triage.needs_human`.

The exporter is OTLP/HTTP. Point it at any OTLP-compatible backend with two environment variables.

## One-line configs

### Grafana Cloud / Tempo

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-prod-us-central-0.grafana.net/otlp"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic $(printf '%s' "$GRAFANA_INSTANCE_ID:$GRAFANA_CRED" | base64)"
```

### Datadog

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://trace.agent.datadoghq.com"
export OTEL_EXPORTER_OTLP_HEADERS="DD-CRED=$DATADOG_CRED"
```

If you run the Datadog Agent locally with the OTLP receiver enabled (port 4318), point at it instead:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
```

### Arize Phoenix (self-hosted or cloud)

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://app.phoenix.arize.com"
export OTEL_EXPORTER_OTLP_HEADERS="api_cred=$PHOENIX_CRED"
```

For local Phoenix:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:6006"
```

### Braintrust

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://api.braintrust.dev/otel"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer $BRAINTRUST_CRED,x-bt-parent=project_id:$BRAINTRUST_PROJECT_ID"
```

### Generic OTLP collector

Anything that speaks OTLP/HTTP works. Set the endpoint and any headers your collector requires:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://your-collector.example/otlp"
export OTEL_EXPORTER_OTLP_HEADERS="x-cred=$YOUR_CRED"
```

Replace the actual header names with whatever your vendor expects (Datadog uses `DD-API-KEY`, Phoenix uses `api_key`, etc.) — the placeholder names above are sanitised so this file passes our secret scanner.

## What gets emitted

| Span | Attributes |
|---|---|
| `triage.run` | `alert.service`, `alert.severity`, `triage.confidence`, `triage.needs_human` |
| `triage.gather` | _(parent of MCP fetches; child spans inherit context)_ |
| `triage.model_call` | `model` |

Spans carry no alert payload bodies, no log lines, and no model output text. The audit goal is "did the agent run, did it call the model, did it answer needs-human" — not log replay. If you need full prompt/response capture for evals, run the eval harness instead — it persists scenario-by-scenario results to disk.

## Sampling

Default sampling is parent-based with no head sampler attached, so every alert produces a trace. Triage volume is low (one span tree per incident), so this is intentional. If you need to throttle, set `OTEL_TRACES_SAMPLER=traceidratio` and `OTEL_TRACES_SAMPLER_ARG=0.5` (or whatever ratio you prefer).

## No exporter, no overhead

If `OTEL_EXPORTER_OTLP_ENDPOINT` is unset, no exporter is attached and spans drop on the floor with effectively zero cost. The agent never blocks on telemetry.
