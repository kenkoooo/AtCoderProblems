FROM rust:1.38 AS builder

RUN USER=root cargo new app
WORKDIR /app
ADD ./atcoder-problems-backend/Cargo.toml /app
RUN cargo build --release
ADD ./atcoder-problems-backend/src /app/src
RUN cargo build --release

FROM rust:1.38
COPY --from=builder /app/target/release/crawl /usr/bin/crawl
