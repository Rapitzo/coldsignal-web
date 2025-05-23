"""triagepack — audited Claude agent for SRE on-call.

Public entry points:
    triagepack.webhook:app             FastAPI ASGI app (POST /v1/incidents)
    triagepack.reasoning.triage(...)   pure function: Alert -> TriageResult
"""

__version__ = "0.1.0-dev"
