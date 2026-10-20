import { expect, test } from 'vitest'
import type { ItemDelModelo } from './esquema.js'
import { numerosEscritos, soloLoEscrito } from './escrito.js'

test('lee los números como están escritos: con coma o punto decimal, con punto de miles y en AxBxC', () => {
  expect(numerosEscritos('60x40x30')).toEqual(expect.arrayContaining([60, 40, 30]))
  expect(numerosEscritos('1,5 m')).toContain(1.5)
  expect(numerosEscritos('1.5 m')).toContain(1.5)
  expect(numerosEscritos('1.200 kg')).toContain(1200)
  expect(numerosEscritos('sin números')).toEqual([])
})

const item: ItemDelModelo = {
  nombre: 'cajas',
  cantidad: 40,
  largo: { valor: 60, unidad: 'cm' },
  ancho: { valor: 40, unidad: 'cm' },
  alto: { valor: 30, unidad: 'cm' },
  peso: { valor: 12, unidad: 'kg', alcance: 'unitario' },
  entrada: null,
}

test('lo que está escrito queda igual', () => {
  expect(soloLoEscrito(item, '40 cajas de 60x40x30 de 12 kilos')).toEqual(item)
})

test('lo que no está escrito se descarta, campo por campo', () => {
  expect(soloLoEscrito(item, '40 cajas de 60x40 de 12 kilos')).toEqual({ ...item, alto: null })
  expect(soloLoEscrito(item, 'cajas de 60x45x30')).toEqual({ ...item, cantidad: null, ancho: null, peso: null })
})

test('límite: mira que el número esté escrito, no a qué campo corresponde', () => {
  // El 40 del ancho deja pasar una cantidad 40 inventada. Lo que se escapa así es un número que el
  // usuario sí escribió, nunca uno sacado de fuera de la descripción.
  expect(soloLoEscrito(item, 'cajas de 60x40x30').cantidad).toBe(40)
})

test('"un" o "una" sueltos valen cantidad 1, pero no dentro de otra palabra ni en "unos", "unas" o "cada uno"', () => {
  const uno = { ...item, cantidad: 1 }
  expect(soloLoEscrito(uno, 'Un tablero de 60x40x30 de 12 kg').cantidad).toBe(1)
  expect(soloLoEscrito(uno, 'una caja de 60x40x30 de 12 kg').cantidad).toBe(1)
  expect(soloLoEscrito(uno, 'unas cajas de 60x40x30 de 12 kg').cantidad).toBeNull()
  expect(soloLoEscrito(uno, 'cajas de 60x40x30, 12 kg cada uno').cantidad).toBeNull()
  expect(soloLoEscrito(uno, 'fusibles de 60x40x30 de 12 kg').cantidad).toBeNull()
})
