.PHONY: help
help:
	@awk -F ':|##' '/^[^\t].+?:.*?##/ { printf "\033[36m%-22s\033[0m %s\n", $$1, $$NF }' $(MAKEFILE_LIST)

.PHONY: up
up:
	docker compose up

.PHONY: down
down:
	docker compose down

.PHONY: test/backend
test/backend:
	docker compose exec backend-development cargo test --workspace --no-fail-fast -- --test-threads=1
