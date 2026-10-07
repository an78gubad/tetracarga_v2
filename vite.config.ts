import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['stack.test.ts', 'src/**/*.test.ts'],
  },
})
