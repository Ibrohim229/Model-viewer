import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

const JS_FILE_PATTERN = "**/*.{js,mjs,cjs}";

export default defineConfig([
  { files: [JS_FILE_PATTERN] },
  {
    files: [JS_FILE_PATTERN],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: [JS_FILE_PATTERN],
    plugins: { js },
    extends: ["js/recommended"],
  },
]);
