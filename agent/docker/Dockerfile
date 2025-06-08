FROM python:3.12-slim AS build
WORKDIR /build
COPY pyproject.toml ./
COPY triagepack ./triagepack
RUN pip install --no-cache-dir --upgrade pip && pip wheel --no-deps --wheel-dir /wheels .

FROM python:3.12-slim
LABEL org.opencontainers.image.source="https://github.com/coldsignal/triagepack"
LABEL org.opencontainers.image.licenses="Proprietary"

# Non-root user. Read-only root FS at runtime is enforced by docker-compose.
RUN useradd --create-home --uid 10001 triage
WORKDIR /app
COPY --from=build /wheels /wheels
RUN pip install --no-cache-dir /wheels/*.whl && rm -rf /wheels

USER triage
EXPOSE 8081

# No host network, no extra capabilities, no privileged. See docker-compose.yml for the full posture.
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
CMD ["uvicorn", "triagepack.webhook:app", "--host", "0.0.0.0", "--port", "8081"]
