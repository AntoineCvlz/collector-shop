import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from "@vitejs/plugin-react"
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
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
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
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
