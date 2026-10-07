import { describe, expect, test } from 'vitest'
import { CONTENEDORES } from '../catalogo/contenedores'
import { desdeListo, editar, itemNuevo } from '../dominio/item'
import type { Item } from '../dominio/tipos'
import { preparar } from './preparar'

const caja: Item = desdeListo({
  id: 'caja',
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

describe('preparar', () => {
  test('sin ítems no hay nada que consolidar', () => {
    expect(preparar([], CONTENEDORES['20'])).toEqual({ estado: 'vacia' })
  })

  test('con un dato faltante la consolidación queda bloqueada y dice qué falta (AC-03, AC-22)', () => {
    const sinCantidad: Item = { ...caja, id: 'otra', cantidad: { origen: 'faltante', motivo: 'no-declarado' } }
    expect(preparar([caja, sinCantidad], CONTENEDORES['20'])).toEqual({
      estado: 'faltan',
      faltantes: [{ item: 'otra', campo: 'cantidad', motivo: 'no-declarado' }],
    })
  })

  test('completo, consolida con el contenedor elegido y recalcula al cambiarlo (AC-13)', () => {
    const en20 = preparar([caja], CONTENEDORES['20'])
    const en40 = preparar([caja], CONTENEDORES['40'])
    expect(en20.estado === 'lista' && en20.consolidacion.valida && en20.consolidacion.disposicion.contenedor).toBe('20')
    expect(en40.estado === 'lista' && en40.consolidacion.valida && en40.consolidacion.disposicion.contenedor).toBe('40')
  })

  test('al completar el último dato, consolida', () => {
    let nuevo = itemNuevo('nuevo')
    for (const [campo, valor] of [['cantidad', 2], ['largo', 500], ['ancho', 500], ['alto', 500], ['peso', 10]] as const) {
      expect(preparar([nuevo], CONTENEDORES['20']).estado).toBe('faltan')
      nuevo = editar(nuevo, campo, valor)
    }
    expect(preparar([nuevo], CONTENEDORES['20']).estado).toBe('lista')
  })
})
