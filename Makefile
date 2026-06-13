.PHONY: build build-backend build-estimator build-dbt deploy-frontend

build: build-backend build-estimator build-dbt

build-backend:
	docker build -t atcoder-problems-2025-backend:latest ./atcoder-problems-backend

build-estimator:
	docker build -t atcoder-problems-2025-estimator:latest ./estimator

build-dbt:
	docker build -t atcoder-problems-2025-dbt:latest ./dbt

FRONTEND_DIR := atcoder-problems-frontend
S3_BUCKET ?= kenkoooo.com

# Build the frontend locally and sync the artifacts to S3.
# Note: --delete is intentionally NOT used because the destination bucket also
# hosts backend-generated data (e.g. resources/) that is not part of the build.
deploy-frontend:
	cd $(FRONTEND_DIR) && pnpm install --frozen-lockfile && pnpm run build
	aws s3 sync $(FRONTEND_DIR)/build/ s3://$(S3_BUCKET)/
