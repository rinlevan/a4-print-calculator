.PHONY: build up down restart logs ps clean local-install local-dev local-build

# Docker targets
build:
	docker compose build --no-cache

up:
	docker compose up

up-d:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down
	docker compose up -d

logs:
	docker compose logs -f

ps:
	docker compose ps

clean:
	docker compose down --rmi all --volumes --remove-orphans

# Local development targets
local-install:
	npm install

local-dev:
	npm run dev

local-build:
	npm run build
