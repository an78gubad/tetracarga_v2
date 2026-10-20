import { expect, test } from 'vitest'
import { desdeListo, editar, itemNuevo } from '../dominio/item'
import { resumen } from './aviso'

const completo = desdeListo({
  id: 'cajas',
  nombre: 'cajas',
  cantidad: 40,
  largo: 600,
  ancho: 400,
  alto: 300,
  peso: 12,
  noApilable: false,
  orientacionObligatoria: false,
  pesoMaximoEncima: null,
})
const incompleto = { ...itemNuevo('tambores'), nombre: 'tambores' }

test('el aviso cuenta los agregados a los que todavía les faltan datos', () => {
  expect(resumen(['cajas', 'tambores'], [completo, incompleto])).toBe(
    'Agregué 2 ítems a la carga. A uno le faltan datos: están marcados en rojo.',
  )
})

test('al completar lo que faltaba, el aviso deja de pedirlo', () => {
  let tambores = incompleto
  for (const campo of ['cantidad', 'largo', 'ancho', 'alto', 'peso'] as const) tambores = editar(tambores, campo, 1)
  expect(resumen(['cajas', 'tambores'], [completo, tambores])).toBe('Agregué 2 ítems a la carga.')
})

test('un agregado que se eliminó deja de contar como pendiente', () => {
  expect(resumen(['cajas', 'tambores'], [completo])).toBe('Agregué 2 ítems a la carga.')
})

test('los ítems que no agregó la descripción no cuentan', () => {
  expect(resumen(['cajas'], [completo, incompleto])).toBe('Agregué 1 ítem a la carga.')
})
