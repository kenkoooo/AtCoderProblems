FROM rust:1.57.0 AS development
RUN rustup component add rustfmt
RUN rustup component add clippy

# Using the official cargo-chef image
FROM lukemathwalker/cargo-chef:latest-rust-1.61.0 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
RUN cargo build --release

# プロダクション用の Docker イメージをビルドする
FROM rust:1.61.0 AS production
COPY --from=builder /app/target/release/batch_update                /usr/bin/batch_update
COPY --from=builder /app/target/release/crawl_all_submissions       /usr/bin/crawl_all_submissions
COPY --from=builder /app/target/release/crawl_for_virtual_contests  /usr/bin/crawl_for_virtual_contests
COPY --from=builder /app/target/release/crawl_from_new_contests     /usr/bin/crawl_from_new_contests
COPY --from=builder /app/target/release/crawl_problems              /usr/bin/crawl_problems
COPY --from=builder /app/target/release/crawl_recent_submissions    /usr/bin/crawl_recent_submissions
COPY --from=builder /app/target/release/crawl_whole_contest         /usr/bin/crawl_whole_contest
COPY --from=builder /app/target/release/delta_update                /usr/bin/delta_update
COPY --from=builder /app/target/release/dump_json                   /usr/bin/dump_json
COPY --from=builder /app/target/release/fix_invalid_submissions     /usr/bin/fix_invalid_submissions
COPY --from=builder /app/target/release/run_server                  /usr/bin/run_server

RUN apt-get update && apt-get install -y awscli postgresql-client
ADD ./scripts/sql-backup.sh /usr/bin/sql-backup.sh
