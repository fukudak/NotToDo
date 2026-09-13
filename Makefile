SHELL := /bin/bash

.PHONY: env dev test build

env:
	@echo "Flutter: use fvm"
	@echo "Node: 22 via mise"
	@echo "Docker: available via docker compose"

dev:
	npm run dev

test:
	npm test

build:
	npm run build
