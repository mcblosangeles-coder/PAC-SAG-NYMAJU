import js from "@eslint/js";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**"]
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module"
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsEslintPlugin.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      // TypeScript already resolves symbols through tsserver; keep lint noise low in monorepo.
      "no-undef": "off"
    }
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        URLSearchParams: "readonly",
        HTMLElement: "readonly",
        Event: "readonly"
      }
    }
  },
  {
    files: ["apps/api/src/**/*.ts", "packages/**/*.ts"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly"
      }
    }
  }
];
