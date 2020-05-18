module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint",
    "prettier/react",
  ],
  overrides: [
    {
      // enable the rule specifically for TypeScript files
      files: ["*.ts", "*.tsx"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": 2,
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "react/prop-types": 0, // we do not employ 'prop-types'
    "@typescript-eslint/camelcase": 0, // API responses contain snake_case properties
    "@typescript-eslint/explicit-function-return-type": 0, // enable the rule in "overrides"
    "import/order": 1, // sort import in files
    // TODO: enable the following rules in the future
    "require-atomic-updates": 0, // https://github.com/eslint/eslint/issues/11899
  },
  settings: {
    react: { version: "detect" },
  },
};
