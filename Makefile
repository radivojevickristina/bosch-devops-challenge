.PHONY: build up test down
build:
	docker compose build
up:
	docker compose up -d
test:
	npm test
down:
	docker compose down

