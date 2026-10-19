import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const emails = fileURLToPath(new URL("./emails", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@emails$/, replacement: `${emails}/index.ts` },
      { find: /^@emails\//, replacement: `${emails}/` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Modules that build the Prisma client read DATABASE_URL at import time; no test connects.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      AUTH_SECRET: "test-secret",
    },
    testTimeout: 60_000,
  },
});
