FROM rust:1.39 AS builder

RUN USER=root cargo new app
WORKDIR /app
ADD ./Cargo.toml /app
RUN cargo build --release
ADD ./src /app/src
RUN cargo build --release

FROM rust:1.39
COPY --from=builder /app/target/release/crawl /usr/bin/crawl
COPY --from=builder /app/target/release/dump_json /usr/bin/dump_json
COPY --from=builder /app/target/release/delta_update /usr/bin/delta_update
COPY --from=builder /app/target/release/batch_update /usr/bin/batch_update
COPY --from=builder /app/target/release/run_server /usr/bin/run_server
COPY --from=builder /app/target/release/fix_invalid_submissions /usr/bin/fix_invalid_submissions
COPY --from=builder /app/target/release/crawl_whole_contest /usr/bin/crawl_whole_contest
