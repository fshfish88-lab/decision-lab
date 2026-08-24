import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Exclude git worktree copies (e.g. .worktrees/v1.5) so Vitest only runs
    // the current project's tests instead of stale branch snapshots.
    exclude: [...configDefaults.exclude, '.worktrees/**'],
  },
})
