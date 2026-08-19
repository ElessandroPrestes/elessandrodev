.DEFAULT_GOAL := help

# Variáveis
DOCKER_COMPOSE ?= docker compose
NPM ?= npm

.PHONY: help setup install install-clean dev build preview clean \
        up down restart logs build-docker shell ps

##@ Ajuda
help: ## Exibe esta mensagem de ajuda
	@echo ""
	@echo "Uso: make [alvo]"
	@echo ""
	@echo "Alvos disponíveis:"
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ Configuração & Instalação
setup: ## Configura o ambiente inicial (.env a partir do .env.example) e instala dependências
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo "Arquivo .env criado a partir de .env.example"; \
		else \
			touch .env; \
			echo "Arquivo .env criado"; \
		fi \
	fi
	@$(MAKE) install

install: ## Instala dependências do projeto via npm
	$(NPM) install

install-clean: ## Reinstala dependências do zero
	rm -rf node_modules package-lock.json
	$(NPM) install

##@ Desenvolvimento Local
dev: ## Inicia o servidor de desenvolvimento Vite localmente
	$(NPM) run dev

build: ## Gera o build estático de produção (dist/)
	$(NPM) run build

preview: ## Visualiza localmente o build de produção
	$(NPM) run preview

clean: ## Limpa a pasta de build gerada (dist/)
	rm -rf dist

##@ Docker & Containers
up: ## Inicia os containers Docker em segundo plano
	$(DOCKER_COMPOSE) up -d

down: ## Para e remove os containers Docker
	$(DOCKER_COMPOSE) down

restart: ## Reinicia os containers Docker
	$(DOCKER_COMPOSE) restart

logs: ## Exibe os logs dos containers em tempo real
	$(DOCKER_COMPOSE) logs -f

build-docker: ## Reconstrói as imagens Docker sem cache
	$(DOCKER_COMPOSE) build --no-cache

shell: ## Abre um terminal interativo dentro do container da aplicação
	$(DOCKER_COMPOSE) exec app sh

ps: ## Lista o status dos containers Docker do projeto
	$(DOCKER_COMPOSE) ps
