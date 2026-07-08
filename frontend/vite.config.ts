/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from "@vitejs/plugin-react"
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Tests unitaires / composants (Vitest). Les tests E2E Playwright vivent
  // dans tests/ et sont exclus ici pour ne pas être ramassés par Vitest.
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "tests/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "src/App.tsx",
        "src/vite-env.d.ts",
        // Vues « coquilles » et primitives UI : couvertes par les tests E2E
        // Playwright (tests/), pas par Vitest. Les inclure fausserait la
        // mesure de la logique réellement testable en unitaire.
        "src/pages/**",
        "src/components/ui/**",
        "src/components/Header.tsx",
        "src/components/Footer.tsx",
        "src/components/AuthLayout.tsx",
        "src/components/InterestsCard.tsx",
        "src/components/Hello.tsx",
        "src/components/Logo.tsx",
        "src/services/hello.service.ts",
        "src/i18n/**",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          "react-query": ["@tanstack/react-query"],
          i18n: ["i18next", "i18next-browser-languagedetector", "react-i18next"],
        },
      },
    },
  },
})
