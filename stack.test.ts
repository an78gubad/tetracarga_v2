import ts from 'typescript'
import { expect, test } from 'vitest'

// Vercel compila las funciones con la API JavaScript de `typescript`, que la 7 no trae.
test('el proyecto usa TypeScript 6', () => {
  expect(ts.versionMajorMinor).toMatch(/^6\./)
})
