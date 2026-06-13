# atcoder-problems-frontend

`atcoder-problems-frontend` is a web application written in TypeScript.

## Start the web application on your local machine

```bash
docker-compose up -d
```

You can see it on <http://localhost:3000/>.

## Login on the local instance

To log in on your local instance for developing features related to logged in users:

1. Login at <https://kenkoooo.com/atcoder/> and open the developer tools (Press <kbd>F12</kbd>).
1. Go to "Storage" (Mozilla Firefox) / "Application" (Google Chrome) → "Cookies" and copy the cookie value with name `token`.
1. Open the local instance of AtCoder Problems in your browser (e.g. <http://localhost:3000>).
1. Open the "Cookies" section again and create a cookie named `token`. Paste the cookie value.

If you intend to use your own instance of backend, consult the [backend documentation](../atcoder-problems-backend/README.md).

This project uses [pnpm](https://pnpm.io/) as its package manager (Node.js 16).

```bash
pnpm install
```

## Create a production build

```bash
pnpm run build
```

## Run unit test

```bash
pnpm test
```

## Run end-to-end test

```bash
pnpm run cy:run
```

## Open Cypress Test Runner

```bash
pnpm run cy:open
```
