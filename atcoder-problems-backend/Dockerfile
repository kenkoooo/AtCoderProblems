FROM docker.io/lukemathwalker/cargo-chef:latest-rust-1.86 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
RUN cargo build --workspace --release

FROM gcr.io/distroless/cc-debian12 AS production
COPY --from=builder /app/target/release/crawl-contests /usr/bin
COPY --from=builder /app/target/release/crawl-submissions /usr/bin
COPY --from=builder /app/target/release/crawl-standings /usr/bin
COPY --from=builder /app/target/release/crawl-problems /usr/bin
COPY --from=builder /app/target/release/dump-json /usr/bin
COPY --from=builder /app/target/release/run-server /usr/bin
