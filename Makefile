PYTHON ?= python3
PNPM ?= pnpm
BACKEND_PYTHON := backend/.venv/bin/python

.PHONY: setup dev test

setup:
	$(PYTHON) -m venv backend/.venv
	$(BACKEND_PYTHON) -m pip install -e 'backend[test]'
	$(PNPM) --dir frontend install --frozen-lockfile

dev:
	$(PYTHON) scripts/dev.py

test:
	$(BACKEND_PYTHON) -m pytest backend/tests
	cd frontend && ./node_modules/.bin/vitest run
