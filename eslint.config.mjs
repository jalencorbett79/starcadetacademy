// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
export default tseslint.config(
  { ignores: ["dist", "server/dist", "node_modules"] },
  js.configs.recommended,
    ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
  plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
  },
    languageOptions: {
      globals: {
        ...globals.browser,
  },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);

