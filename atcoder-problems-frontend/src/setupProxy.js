const proxy = require("http-proxy-middleware"); // eslint-disable-line @typescript-eslint/no-var-requires

module.exports = function (app) {
  app.use(
    proxy("/atcoder-api", {
      target: "https://kenkoooo.com",
      changeOrigin: true,
      pathRewrite: {
        "^/atcoder-api": "/atcoder/atcoder-api",
      },
    })
  );
  app.use(
    proxy("/internal-api", {
      target: "https://kenkoooo.com",
      changeOrigin: true,
      pathRewrite: {
        "^/internal-api": "/atcoder/internal-api",
      },
    })
  );
};
