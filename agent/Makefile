# triagepack release helpers.
.PHONY: sbom audit build sandbox-up sandbox-down evals evals-baseline release

VERSION ?= $(shell grep -E '^version' pyproject.toml | head -1 | cut -d'"' -f2)

sbom:
	bash scripts/build-sbom.sh

audit:
	pip-audit --strict --requirement <(pip-compile --quiet pyproject.toml --output-file -)

build:
	docker compose -f docker/docker-compose.yml build

sandbox-up:
	docker compose -f docker/docker-compose.yml up -d

sandbox-down:
	docker compose -f docker/docker-compose.yml down -v

evals:
	python -m evals.run

evals-baseline:
	python -m evals.run --write-baseline

release:
	bash scripts/release.sh
