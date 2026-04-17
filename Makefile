.PHONY: help env install dev dev-backend dev-frontend \
        up up-d down logs up-prod down-prod \
        lint test build clean

BACKEND  := backend
FRONTEND := frontend

# ── Help ──────────────────────────────────────────────────────────────
help: ## Show this help
	@printf "\n\033[1mResumeAI\033[0m — available commands:\n\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n",$$1,$$2}'
	@printf "\n"

# ── First-time setup ──────────────────────────────────────────────────
env: ## Copy .env.example → .env (run once, then set ANTHROPIC_API_KEY)
	@if [ ! -f $(BACKEND)/.env ]; then \
		cp $(BACKEND)/.env.example $(BACKEND)/.env; \
		echo "✓ Created backend/.env — open it and set ANTHROPIC_API_KEY"; \
	else echo "  backend/.env already exists"; fi
	@if [ ! -f $(FRONTEND)/.env ]; then \
		cp $(FRONTEND)/.env.example $(FRONTEND)/.env; \
		echo "✓ Created frontend/.env"; \
	else echo "  frontend/.env already exists"; fi

install: ## Install all dependencies (Python + Node)
	@echo "→ Backend dependencies…"
	cd $(BACKEND) && pip install -e ".[dev]"
	@echo "→ Frontend dependencies…"
	cd $(FRONTEND) && npm install
	@echo "✓ All dependencies installed"

# ── Local dev (no Docker) ─────────────────────────────────────────────
dev: ## Start backend + frontend in background (logs to dev-*.log)
	@echo "→ Starting backend  → http://localhost:8000"
	@echo "→ Starting frontend → http://localhost:5173"
	@cd $(BACKEND)  && uvicorn app.main:app --reload --port 8000 > ../dev-backend.log  2>&1 &
	@cd $(FRONTEND) && npm run dev                               > ../dev-frontend.log 2>&1 &
	@echo "✓ Both servers running in background."
	@echo "  Logs: tail -f dev-backend.log  |  tail -f dev-frontend.log"
	@echo "  Stop: make stop"

stop: ## Kill background dev servers
	@pkill -f "uvicorn app.main:app" 2>/dev/null && echo "✓ Backend stopped"  || echo "  Backend not running"
	@pkill -f "vite"                 2>/dev/null && echo "✓ Frontend stopped" || echo "  Frontend not running"

dev-backend: ## Start backend only (blocking, with reload)
	cd $(BACKEND) && uvicorn app.main:app --reload --port 8000

dev-frontend: ## Start frontend only (blocking)
	cd $(FRONTEND) && npm run dev

# ── Docker dev ────────────────────────────────────────────────────────
up: ## Build and start dev containers (hot-reload)
	docker compose up --build

up-d: ## Start dev containers in background
	docker compose up -d --build

down: ## Stop dev containers
	docker compose down

logs: ## Tail container logs
	docker compose logs -f

# ── Docker production ─────────────────────────────────────────────────
up-prod: ## Build and start production containers (nginx + 2 workers)
	docker compose -f docker-compose.prod.yml up --build -d
	@echo "✓ Production stack running on http://localhost"

down-prod: ## Stop production containers
	docker compose -f docker-compose.prod.yml down

logs-prod: ## Tail production logs
	docker compose -f docker-compose.prod.yml logs -f

# ── Quality ───────────────────────────────────────────────────────────
lint: ## Lint Python (ruff) and TypeScript (tsc --noEmit)
	@echo "→ Python (ruff)…"
	cd $(BACKEND) && python -m ruff check app/ tests/
	@echo "→ TypeScript…"
	cd $(FRONTEND) && npx tsc --noEmit
	@echo "✓ Lint passed"

test: ## Run backend tests
	cd $(BACKEND) && python -m pytest tests/ -v

test-cov: ## Run backend tests with coverage report
	cd $(BACKEND) && python -m pytest tests/ -v --tb=short \
		--cov=app --cov-report=term-missing

# ── Build ─────────────────────────────────────────────────────────────
build: ## Build frontend for production
	cd $(FRONTEND) && npm run build
	@echo "✓ Built to frontend/dist/"

# ── Clean ─────────────────────────────────────────────────────────────
clean: ## Remove build artefacts, caches, and log files
	rm -rf $(FRONTEND)/dist
	rm -f dev-backend.log dev-frontend.log
	find . -type d -name "__pycache__"   -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache"   -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "✓ Cleaned"
