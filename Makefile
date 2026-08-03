PYTHON ?= python3
PNPM ?= pnpm
BACKEND_PYTHON := backend/.venv/bin/python

.PHONY: setup dev build run test test-backend test-frontend test-integration test-e2e verify

setup:
	$(PYTHON) -m venv backend/.venv
	$(BACKEND_PYTHON) -m pip install -e 'backend[test]'
	$(PNPM) --dir frontend install --frozen-lockfile
	frontend/node_modules/.bin/playwright install chromium

dev:
	$(PYTHON) scripts/dev.py

build:
	@test -x frontend/node_modules/.bin/vite || (echo "Missing frontend dependencies. Run 'make setup' first." >&2; exit 1)
	cd frontend && ./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build

run: build
	@test -x $(BACKEND_PYTHON) || (echo "Missing backend environment. Run 'make setup' first." >&2; exit 1)
	@echo "Starting Feuerwehr Tools at http://127.0.0.1:8000"
	$(BACKEND_PYTHON) -m firefighter_tools_backend --frontend-dist frontend/dist

test-backend:
	$(BACKEND_PYTHON) -m pytest backend/tests

test-frontend:
	cd frontend && ./node_modules/.bin/vitest run

test-integration: build
	$(BACKEND_PYTHON) -m pytest backend/tests/test_production_frontend.py backend/tests/test_sample_schedule.py -vv

test-e2e: build
	cd frontend && ./node_modules/.bin/playwright test

verify: build
	$(BACKEND_PYTHON) -m pip check
	$(BACKEND_PYTHON) scripts/verify.py

test:
	$(MAKE) test-backend
	$(MAKE) test-frontend
	$(MAKE) test-integration
	$(MAKE) test-e2e
	$(MAKE) verify
