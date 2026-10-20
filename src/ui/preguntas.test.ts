import { expect, test } from 'vitest'
import { preguntar } from './preguntas'

test('RF-03: la pregunta dice si el ítem no está en el catálogo o si la entrada no trae el dato', () => {
  expect(preguntar({ campo: 'largo', motivo: 'sin-entrada' })).toEqual({
    pregunta: '¿Cuánto mide de largo?',
    motivo: 'No está en el catálogo.',
  })
  expect(preguntar({ campo: 'peso', motivo: 'entrada-sin-dato' })).toEqual({
    pregunta: '¿Cuánto pesa cada uno?',
    motivo: 'El catálogo no trae este dato.',
  })
})

test('RF-03: la cantidad se pregunta, no se completa', () => {
  expect(preguntar({ campo: 'cantidad', motivo: 'no-declarado' }).pregunta).toBe('¿Cuántos son?')
})
