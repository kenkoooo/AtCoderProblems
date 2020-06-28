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

    // Since we can know return types of functions by type analysis of IDEs,
    // explicit return types are no longer required.
    "@typescript-eslint/explicit-function-return-type": "off",

    // Returning any is not allowed in this project.
    // Passing any to functions is allowed,
    // only when the function is a type checker or it's required to use JS function.
    "@typescript-eslint/no-explicit-any": "error",
    "import/order": 1, // sort import in files
    "@typescript-eslint/no-non-null-assertion": "error",
    // TODO: enable the following rules in the future
    "require-atomic-updates": 0, // https://github.com/eslint/eslint/issues/11899
  },
  settings: {
    react: { version: "detect" },
  },
};
