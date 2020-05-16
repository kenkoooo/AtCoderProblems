module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
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
    "prettier",
    "prettier/@typescript-eslint",
    "prettier/react"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    sourceType: "module",
    tsconfigRootDir: __dirname
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  rules: {
    "react/prop-types": 0, // We will not employ 'prop-types'.
    "@typescript-eslint/camelcase": 0, // API responses contain snake_case variables.
    // TODO: Remove following temporary rules.
    "react/display-name": 0,
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/no-explicit-any": 0
  },
  settings: {
    react: { version: "detect" }
  }
};
