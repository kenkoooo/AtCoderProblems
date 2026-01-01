FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /dbt

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .

ENTRYPOINT ["uv", "run", "dbt"]
CMD ["build"]
