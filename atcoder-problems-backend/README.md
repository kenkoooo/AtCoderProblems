# atcoder-problems-backend

`atcoder-problems-backend` is a set of backend applications written in Rust.

Since the web app, which is running on your local machine, connects to the
production backend server, you don't need to run the backend applications in most cases.

## Build

```bash
cd atcoder-problems-backend/
cargo build
```

## Run

```bash
export SQL_URL=... # URL of PostgreSQL
export CLIENT_ID=... # GitHub client_id, which is required to use the login function.
export CLIENT_SECRET=... # GitHub client_secret, which is required to use the login function.

# Run backend server
cargo run --bin run_server

# Run crawlers
cargo run --bin crawl_all_submissions
cargo run --bin crawl_for_virtual_contests
cargo run --bin crawl_from_new_contests
cargo run --bin crawl_problems
cargo run --bin crawl_recent_submissions
cargo run --bin crawl_whole_contest

# Run other tools
cargo run --bin batch_update
cargo run --bin delta_update
cargo run --bin dump_json
cargo run --bin fix_invalid_submissions
```
