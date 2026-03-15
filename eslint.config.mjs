import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["frontend/**", "backend/**", "node_modules/**", "*.config.*", "jest.setup.ts"],
  },
  {
    files: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["error"] }],
    },
  },
  {
    files: ["src/**/__tests__/**/*.{ts,tsx}", "app/**/__tests__/**/*.{ts,tsx}"],
    rules: {
      // Test files need flexibility for mocks and type assertions
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  prettier,
];
