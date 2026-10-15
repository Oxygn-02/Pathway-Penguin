import globals from "globals";

// Deliberately small: catches real bugs (undefined variables, duplicate keys,
// unreachable code) without restyling the codebase.
export default [
  { ignores: ["dist/**", "node_modules/**", "src/components/ui/**"] },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    rules: {
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-redeclare": "error",
      "no-self-assign": "error",
      "no-unsafe-finally": "error",
    },
  },
];
