.PHONY: build build-backend build-estimator build-dbt

build: build-backend build-estimator build-dbt

build-backend:
	docker build -t atcoder-problems-2025-backend:latest ./atcoder-problems-backend

build-estimator:
	docker build -t atcoder-problems-2025-estimator:latest ./estimator

build-dbt:
	docker build -t atcoder-problems-2025-dbt:latest ./dbt
