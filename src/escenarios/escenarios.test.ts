import { describe, expect, test } from 'vitest'
import { acomodar } from '../acomodador/acomodar'
import { CONTENEDORES } from '../catalogo/contenedores'
import type { ItemListo } from '../dominio/tipos'
import { ESCENARIOS } from './escenarios'

const volumen = (largo: number, ancho: number, alto: number) => largo * ancho * alto
const volumenDe = (item: ItemListo) => volumen(item.largo, item.ancho, item.alto) * item.cantidad
const pesoDe = (item: ItemListo) => item.peso * item.cantidad
const suma = (valores: number[]) => valores.reduce((total, valor) => total + valor, 0)

describe('los 10 escenarios de la línea base', () => {
  test('son 10, con ids únicos', () => {
    expect(ESCENARIOS).toHaveLength(10)
    expect(new Set(ESCENARIOS.map((escenario) => escenario.id)).size).toBe(10)
  })

  describe.each(ESCENARIOS)('$id', (escenario) => {
    const contenedor = CONTENEDORES[escenario.contenedor]
    const volumenContenedor = volumen(contenedor.largo, contenedor.ancho, contenedor.alto)
    const volumenTotal = suma(escenario.items.map(volumenDe))
    const pesoTotal = suma(escenario.items.map(pesoDe))

    test('no pasa de 200 bultos (RNF-04)', () => {
      expect(suma(escenario.items.map((item) => item.cantidad))).toBeLessThanOrEqual(200)
    })

    test('ids de ítem únicos', () => {
      expect(new Set(escenario.items.map((item) => item.id)).size).toBe(escenario.items.length)
    })

    test('medidas en milímetros enteros positivos, cantidades enteras y pesos positivos', () => {
      for (const item of escenario.items) {
        for (const medida of [item.largo, item.ancho, item.alto]) {
          expect(Number.isInteger(medida) && medida > 0).toBe(true)
        }
        expect(Number.isInteger(item.cantidad) && item.cantidad > 0).toBe(true)
        expect(item.peso).toBeGreaterThan(0)
      }
    })

    test('cada bulto entra solo en el contenedor en alguna orientación permitida', () => {
      for (const item of escenario.items) {
        const base = [item.largo, item.ancho].sort((a, b) => a - b)
        const planta = [contenedor.largo, contenedor.ancho].sort((a, b) => a - b)
        const parado = item.alto <= contenedor.alto && base[0]! <= planta[0]! && base[1]! <= planta[1]!
        if (item.orientacionObligatoria) {
          expect(parado).toBe(true)
        } else {
          const medidas = [item.largo, item.ancho, item.alto].sort((a, b) => a - b)
          const interior = [contenedor.largo, contenedor.ancho, contenedor.alto].sort((a, b) => a - b)
          expect(medidas.every((medida, i) => medida <= interior[i]!)).toBe(true)
        }
      }
    })

    test('ningún tipo alcanza solo para llenar el contenedor', () => {
      for (const item of escenario.items) {
        expect(volumenDe(item)).toBeLessThan(volumenContenedor)
        expect(pesoDe(item)).toBeLessThan(contenedor.cargaUtil)
      }
    })

    if (escenario.sobrecargaDePeso) {
      test('el peso total ronda el 115% de la carga útil', () => {
        const proporcion = pesoTotal / contenedor.cargaUtil
        expect(proporcion).toBeGreaterThanOrEqual(1.1)
        expect(proporcion).toBeLessThanOrEqual(1.2)
      })
    } else {
      test('el volumen ronda el 115% de lo que entra', () => {
        const disposicion = acomodar(escenario.items, contenedor)
        const porId = new Map(escenario.items.map((item) => [item.id, item]))
        const colocado = suma(disposicion.colocados.map((bulto) => volumenDe({ ...porId.get(bulto.item)!, cantidad: 1 })))
        const proporcion = volumenTotal / colocado
        expect(proporcion).toBeGreaterThanOrEqual(1.1)
        expect(proporcion).toBeLessThanOrEqual(1.2)
      })

      test('el peso total no supera la carga útil: lo que sobra es volumen', () => {
        expect(pesoTotal).toBeLessThan(contenedor.cargaUtil)
      })
    }

    test('ningún tipo queda entero afuera', () => {
      const disposicion = acomodar(escenario.items, contenedor)
      for (const item of escenario.items) {
        expect(disposicion.colocados.some((bulto) => bulto.item === item.id)).toBe(true)
      }
    })
  })
})
