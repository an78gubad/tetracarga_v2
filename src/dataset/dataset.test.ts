import { describe, expect, test } from 'vitest'
import { OBJETOS } from '../catalogo/objetos'
import { DATASET } from './dataset'

const idsDelCatalogo = new Set(OBJETOS.map((entrada) => entrada.id))
const items = DATASET.flatMap((descripcion) => descripcion.items)

describe('dataset de RNF-02', () => {
  test('son 50 descripciones con ids únicos', () => {
    expect(DATASET).toHaveLength(50)
    expect(new Set(DATASET.map((descripcion) => descripcion.id)).size).toBe(50)
  })

  test('incluye la descripción de AC-01', () => {
    expect(DATASET.map((descripcion) => descripcion.texto)).toContain(
      '40 cajas de 60x40x30 de 12 kilos y 15 tambores de 200 litros',
    )
  })

  test('mide las tres métricas: hay ítems con y sin entrada, y campos ausentes', () => {
    expect(items.some((item) => item.entrada !== null)).toBe(true)
    expect(items.some((item) => item.entrada === null)).toBe(true)
    expect(items.some((item) => item.cantidad === null)).toBe(true)
    expect(items.some((item) => item.entrada === null && Object.keys(item.declarados).length === 0)).toBe(true)
  })

  describe.each(DATASET)('$id', (descripcion) => {
    test('tiene texto dentro del límite del proxy (RNF-09) y al menos un ítem', () => {
      expect(descripcion.texto.trim()).not.toBe('')
      expect(descripcion.texto.length).toBeLessThanOrEqual(2000)
      expect(descripcion.items.length).toBeGreaterThan(0)
    })

    test('cada entrada existe en el catálogo', () => {
      for (const item of descripcion.items) {
        if (item.entrada !== null) expect(idsDelCatalogo.has(item.entrada)).toBe(true)
      }
    })

    test('cantidades enteras positivas, medidas en milímetros enteros y pesos positivos', () => {
      for (const item of descripcion.items) {
        if (item.cantidad !== null) expect(Number.isInteger(item.cantidad) && item.cantidad > 0).toBe(true)
        const { largo, ancho, alto, peso } = item.declarados
        for (const medida of [largo, ancho, alto]) {
          if (medida !== undefined) expect(Number.isInteger(medida) && medida > 0).toBe(true)
        }
        if (peso !== undefined) expect(peso).toBeGreaterThan(0)
      }
    })
  })
})
