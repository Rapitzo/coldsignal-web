"""OpenTelemetry setup. One-line config — point OTEL_EXPORTER_OTLP_ENDPOINT at Grafana, Datadog, Phoenix, or Braintrust."""

from __future__ import annotations

import os

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


_initialised = False


def setup_otel() -> None:
    """Idempotent. Falls back to a no-op exporter if OTEL_EXPORTER_OTLP_ENDPOINT is unset."""
    global _initialised
    if _initialised:
        return

    resource = Resource.create({SERVICE_NAME: os.environ.get("OTEL_SERVICE_NAME", "triagepack")})
    provider = TracerProvider(resource=resource)

    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if endpoint:
        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint)))
    # Else: no exporter attached → spans drop on the floor. The buyer sees no overhead and no leak.

    trace.set_tracer_provider(provider)
    _initialised = True


tracer = trace.get_tracer("triagepack")
