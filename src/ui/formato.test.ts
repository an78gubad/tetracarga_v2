import { expect, test } from 'vitest'
import { formatoEditable, leerNumero } from './formato'

test('lee números con coma o punto decimal y rechaza lo demás', () => {
  expect(leerNumero('12')).toBe(12)
  expect(leerNumero(' 18,5 ')).toBe(18.5)
  expect(leerNumero('18.5')).toBe(18.5)
  expect(leerNumero('')).toBeNull()
  expect(leerNumero('-3')).toBeNull()
  expect(leerNumero('12 kg')).toBeNull()
})

test('lo que muestra un campo editable se vuelve a leer igual', () => {
  for (const valor of [1000, 12032, 18.5, 0.125]) expect(leerNumero(formatoEditable(valor))).toBe(valor)
})
