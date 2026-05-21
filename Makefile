SHELL := /bin/bash

.PHONY: env dev test build start

env:
	@echo "Flutter: use fvm"
	@echo "Node: 22 via mise"
	@echo "Docker: available via docker compose"

dev:
	bun run dev

test:
	bun run test

build:
	bun run build

start:
	bun run start
