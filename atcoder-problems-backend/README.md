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

- `atcoder-problems-backend/src/server/auth.rs`: change `redirect_url` to `http://localhost:3000/atcoder/#/login/user`
  for your backend to redirect to your frontend web app after logging in.
- `atcoder-problems-frontend/src/setupProxy.js`: change `target` to `http://localhost:8080`
  **and** remove the `pathRewrite` section for your frontend web app to use your
  backend server.
- `atcoder-problems-frontend/src/utils/Url.tsx`: change `GITHUB_LOGIN_LINK` to `https://github.com/login/oauth/authorize?client_id=<YOUR_CLIENT_ID>`,
  where `<YOUR_CLIENT_ID>` is the client ID of your GitHub app.
- (For running backend tests) `atcoder-problems-backend/tests/utils.rs`: change `SQL_URL`
  to the correct connection URL. **Note that** it should be different from the database
  you intend to develop on.

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
cargo run --bin crawl_whole_contest

# Run other tools
cargo run --bin batch_update
cargo run --bin delta_update
cargo run --bin dump_json
cargo run --bin fix_invalid_submissions
```
