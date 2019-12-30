FROM rustlang/rust:nightly AS builder

RUN USER=root cargo new app
WORKDIR /app
ADD ./Cargo.toml /app
RUN cargo build --release
ADD ./src /app/src
RUN cargo build --release

FROM rustlang/rust:nightly
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
