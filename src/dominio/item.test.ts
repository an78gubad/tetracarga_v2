import { describe, expect, test } from 'vitest'
import { aListo, desdeListo, editar, faltantes, itemNuevo, limitarPesoEncima, marcar, renombrar, vaciar } from './item'
import type { Item } from './tipos'

const tambor: Item = {
  id: 'tambor',
  nombre: 'tambores de 200 litros',
  cantidad: { origen: 'declarado', valor: 15 },
  largo: { origen: 'estimado', valor: 585, entrada: 'entrada-de-prueba' },
  ancho: { origen: 'estimado', valor: 585, entrada: 'entrada-de-prueba' },
  alto: { origen: 'estimado', valor: 880, entrada: 'entrada-de-prueba' },
  peso: { origen: 'faltante', motivo: 'entrada-sin-dato' },
  noApilable: { origen: 'declarado', valor: false },
  orientacionObligatoria: { origen: 'estimado', valor: true, entrada: 'entrada-de-prueba' },
  pesoMaximoEncima: null,
}

describe('faltantes', () => {
  test('lista cada campo faltante con su motivo', () => {
    const sinCantidad = { ...tambor, cantidad: { origen: 'faltante', motivo: 'no-declarado' } } as const
    expect(faltantes(sinCantidad)).toEqual([
      { campo: 'cantidad', motivo: 'no-declarado' },
      { campo: 'peso', motivo: 'entrada-sin-dato' },
    ])
  })

  test('un ítem completo no tiene faltantes', () => {
    expect(faltantes(editar(tambor, 'peso', 18.5))).toEqual([])
  })
})

describe('aListo', () => {
  test('bloquea un ítem con algo faltante', () => {
    expect(aListo(tambor)).toBeNull()
  })

  test('suelta los valores de un ítem completo, con el peso en kilos decimales', () => {
    expect(aListo(editar(tambor, 'peso', 18.5))).toEqual({
      id: 'tambor',
      nombre: 'tambores de 200 litros',
      cantidad: 15,
      largo: 585,
      ancho: 585,
      alto: 880,
      peso: 18.5,
      noApilable: false,
      orientacionObligatoria: true,
      pesoMaximoEncima: null,
    })
  })
})

describe('editar (RF-04)', () => {
  test('un campo estimado editado pierde la marca y queda declarado (AC-12)', () => {
    expect(editar(tambor, 'alto', 900).alto).toEqual({ origen: 'declarado', valor: 900 })
  })

  test('no toca los demás campos ni el ítem original', () => {
    const editado = editar(tambor, 'alto', 900)
    expect(editado.largo).toBe(tambor.largo)
    expect(tambor.alto.origen).toBe('estimado')
  })

  test('una marca del catálogo editada queda declarada', () => {
    expect(marcar(tambor, 'orientacionObligatoria', false).orientacionObligatoria).toEqual({
      origen: 'declarado',
      valor: false,
    })
  })
})

describe('alta, baja de datos y conversión', () => {
  test('un ítem nuevo tiene todo por preguntar', () => {
    expect(faltantes(itemNuevo('nuevo')).map((faltante) => faltante.campo)).toEqual([
      'cantidad',
      'largo',
      'ancho',
      'alto',
      'peso',
    ])
  })

  test('un campo borrado vuelve a faltar', () => {
    expect(vaciar(tambor, 'largo').largo).toEqual({ origen: 'faltante', motivo: 'no-declarado' })
  })

  test('el peso máximo encima se declara o se quita', () => {
    expect(limitarPesoEncima(tambor, 50).pesoMaximoEncima).toBe(50)
    expect(limitarPesoEncima(limitarPesoEncima(tambor, 50), null).pesoMaximoEncima).toBeNull()
  })

  test('desdeListo y aListo son inversas', () => {
    const listo = aListo(renombrar(editar(tambor, 'peso', 18.5), 'tambores'))!
    expect(aListo(desdeListo(listo))).toEqual(listo)
  })
})
