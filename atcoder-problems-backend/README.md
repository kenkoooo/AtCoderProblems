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
1. Launch an instance of [**PostgreSQL**](https://www.postgresql.org/) database on your machine.

## Modifying Files

> To prevent accidentally committing the changes below, you may want to ignore
> these files locally before editing them by adding the paths of these files to
> the `$GIT_DIR/info/exclude` file, if you do not intend to commit changes in
> these files. (`$GIT_DIR` is usually the `.git` folder.)

Below are the list of files you need to modify:

- `atcoder-problems-backend/src/server/auth.rs`: change `REDIRECT_URL` to `http://localhost:3000/atcoder/`
  for your backend to redirect to your frontend web app after logging in.
- `atcoder-problems-frontend/src/setupProxy.js`: change `target` to `http://localhost:8080`
  **and** remove the `pathRewrite` section for your frontend web app to use your
  backend server.
- `atcoder-problems-frontend/src/utils/Url.tsx`: change `CLIENT_ID` to the client ID of your GitHub app
  **and** change `AUTHORIZATION_CALLBACK_URL` to `http://localhost:8080/internal-api/authorize`.

**Be careful** not to commit these files to the Git repository.

## Build

```bash
cd atcoder-problems-backend/
cargo build
```

## Run

```bash
export SQL_URL=... # Connection URL of PostgreSQL
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
cargo run --bin crawl_whole_contest <contest_id>

# Run other tools
cargo run --bin batch_update
cargo run --bin delta_update
cargo run --bin dump_json
cargo run --bin fix_invalid_submissions
```

## Test

```bash
# If you don't set up PostgreSQL in your local environment,
# you need to run the following lines to run a PostgreSQL Docker container for testing.
docker-compose up -d postgresql
export SQL_URL=postgres://kenkoooo:pass@localhost:5432/test

# Run all the tests
cargo test --workspace -- --test-threads=1
```
