import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // tsconfig の "@/*" → プロジェクトルート。domain 層の import を解決するため。
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    // domain 層の純関数テスト（Reactなし）。環境は node で十分。
    environment: "node",
    include: ["lib/**/*.test.ts", "content/**/*.test.ts", "state/**/*.test.ts"],
  },
});
