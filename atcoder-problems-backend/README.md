# atcoder-problems-backend

`atcoder-problems-backend` is a set of backend applications written in Rust.

Since the web app, which is running on your local machine, connects to the
production backend server, you don't need to run the backend applications in most cases.

> Note that the following steps assume that your frontend application runs on <http://localhost:3000>
> and your backend application runs on <http://localhost:8080>, which are the default values.

## Prerequisites

1. [Create a GitHub app](https://docs.github.com/en/developers/apps/creating-a-github-app).
   Keep the **client ID** and the **client secret**.
   - Remember to set the "User authorization callback URL" to
     `http://localhost:8080/internal-api/authorize`.
1. A [**PostgreSQL**](https://www.postgresql.org/) database. The easiest way is to
   start the one defined in the repository's `compose.yaml`, which loads
   `postgres/schema.sql` automatically:

   ```bash
   docker compose up -d postgres
   ```

## Modifying Files

> To prevent accidentally committing the changes below, you may want to ignore
> these files locally before editing them by adding the paths of these files to
> the `$GIT_DIR/info/exclude` file, if you do not intend to commit changes in
> these files. (`$GIT_DIR` is usually the `.git` folder.)

Below are the list of files you need to modify:

- `atcoder-problems-backend/src/server/handlers/authorize.rs`: change `REDIRECT_URL` to `http://localhost:3000/atcoder/`
  for your backend to redirect to your frontend web app after logging in.
- `atcoder-problems-frontend/src/setupProxy.js`: change `target` to `http://localhost:8080`
  **and** remove the `pathRewrite` section for your frontend web app to use your
  backend server.
- `atcoder-problems-frontend/src/utils/Url.tsx`: change `CLIENT_ID` to the client ID of your GitHub app
  **and** change `AUTHORIZATION_CALLBACK_URL` to `http://localhost:8080/internal-api/authorize`.

**Be careful** not to commit these files to the Git repository.

## Build

The backend is built with Rust 1.96.0 (see the CI workflow). Build it locally with Cargo:

```bash
cargo build --workspace
```

## Run

Each application is a separate binary under `src/bin/`. Set the environment
variables it needs, then run it with `cargo run --bin <name>`.

```bash
export DATABASE_URL=...   # Connection URL of PostgreSQL (required by every binary)
export CLIENT_ID=...      # GitHub client_id, required by run-server for the login function
export CLIENT_SECRET=...  # GitHub client_secret, required by run-server for the login function
export PORT=8080          # Port for run-server
export REVEL_SESSION=...  # AtCoder `REVEL_SESSION` cookie, required by the crawlers
export S3_BUCKET_NAME=... # Destination bucket, required by dump-json

# Run the API server
cargo run --bin run-server

# Crawlers (require DATABASE_URL and REVEL_SESSION)
cargo run --bin crawl-contests
cargo run --bin crawl-problems
cargo run --bin crawl-standings
cargo run --bin crawl-submissions <mode>   # mode: all | recent | new | virtual-contests

# Dump datasets as JSON to S3 (requires DATABASE_URL and S3_BUCKET_NAME)
cargo run --bin dump-json
```

## Test

The tests use [testcontainers](https://github.com/testcontainers/testcontainers-rs),
so a running Docker daemon is required; each test spins up its own PostgreSQL
container. Limit the number of test threads to avoid starting too many containers
at once:

```bash
cargo test --workspace -- --test-threads=4
```

## Format & Lint

CI checks that the code base is formatted with `rustfmt` and passes `clippy`
with no warnings. Please make sure your change is clean before sending a pull request:

```bash
cargo fmt --all
cargo clippy --workspace --all-targets -- -D warnings
```
