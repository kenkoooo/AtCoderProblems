const { createProxyMiddleware } = require("http-proxy-middleware"); // eslint-disable-line @typescript-eslint/no-var-requires

module.exports = function (app) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  app.use(
    createProxyMiddleware("/atcoder-api", {
      target: "https://kenkoooo.com",
      changeOrigin: true,
      pathRewrite: {
        "^/atcoder-api": "/atcoder/atcoder-api",
      },
    })
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  app.use(
    createProxyMiddleware("/internal-api", {
      target: "https://kenkoooo.com",
      changeOrigin: true,
      pathRewrite: {
        "^/internal-api": "/atcoder/internal-api",
      },
    })
  );
};
