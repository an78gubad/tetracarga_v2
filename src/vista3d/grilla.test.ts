import { expect, test } from 'vitest'
import { lineasDeGrilla } from './grilla'

test('una línea por cada paso interior, en los dos sentidos, apenas sobre el piso', () => {
  const valores = lineasDeGrilla(2, 1.2, 0.5)
  // Largo 2: líneas en x = 0,5, 1 y 1,5. Ancho 1,2: en z = -0,5 y -1. Seis valores por línea.
  expect(valores).toHaveLength((3 + 2) * 6)
  expect([...valores.slice(0, 6)]).toEqual([0.5, 0.002, 0, 0.5, 0.002, -1.2].map(Math.fround))
  const alturas = valores.filter((_, i) => i % 3 === 1)
  expect(new Set(alturas)).toEqual(new Set([Math.fround(0.002)]))
})

test('no repite los bordes, que ya son aristas del contenedor', () => {
  const valores = lineasDeGrilla(1, 1, 0.5)
  expect(valores).toHaveLength(2 * 6)
})
