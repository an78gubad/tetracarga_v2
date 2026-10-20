import { expect, test } from 'vitest'
import { ALTURA_DE_CAIDA_M, alturaDeCaida, DURACION_DE_CAIDA_MS } from './caida'

test('arranca arriba y termina en su lugar', () => {
  expect(alturaDeCaida(0)).toBe(ALTURA_DE_CAIDA_M)
  expect(alturaDeCaida(DURACION_DE_CAIDA_MS)).toBe(0)
  expect(alturaDeCaida(DURACION_DE_CAIDA_MS * 3)).toBe(0)
})

test('acelera: en la segunda mitad recorre más que en la primera', () => {
  const mitad = alturaDeCaida(DURACION_DE_CAIDA_MS / 2)
  expect(ALTURA_DE_CAIDA_M - mitad).toBeLessThan(mitad)
})
