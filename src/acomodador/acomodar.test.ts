import { describe, expect, test } from 'vitest'
import type { Contenedor, Disposicion, ItemListo } from '../dominio/tipos'
import { validar } from '../validador/validar'
import { acomodar } from './acomodar'

// Un contenedor chico de prueba.
const contenedor: Contenedor = { id: '20', nombre: 'prueba', largo: 2000, ancho: 1000, alto: 1000, cargaUtil: 1000 }

function item(id: string, cantidad: number, medidas: [number, number, number], peso: number, extra: Partial<ItemListo> = {}): ItemListo {
  const [largo, ancho, alto] = medidas
  return {
    id,
    nombre: id,
    cantidad,
    largo,
    ancho,
    alto,
    peso,
    noApilable: false,
    orientacionObligatoria: false,
    pesoMaximoEncima: null,
    ...extra,
  }
}

/** Acomoda y exige que el validador no encuentre nada. */
function acomodarValido(items: ItemListo[], c: Contenedor = contenedor): Disposicion {
  const disposicion = acomodar(items, c)
  expect(validar(disposicion, items, c)).toEqual([])
  return disposicion
}

const de = (d: Disposicion, itemId: string) => d.colocados.filter((bulto) => bulto.item === itemId)

describe('acomodar (RF-07)', () => {
  test('coloca todo lo que entra, desde el fondo, abajo y a la izquierda', () => {
    const d = acomodarValido([item('caja', 2, [500, 500, 500], 10)])
    expect(d.colocados).toEqual([
      { item: 'caja', indice: 0, x: 0, y: 0, z: 0, orientacion: ['largo', 'ancho', 'alto'] },
      { item: 'caja', indice: 1, x: 0, y: 500, z: 0, orientacion: ['largo', 'ancho', 'alto'] },
    ])
    expect(d.afuera).toEqual([])
  })

  test('la misma entrada da la misma disposición, sin tolerancia (AC-21)', () => {
    const items = [
      item('a', 7, [600, 400, 300], 12),
      item('b', 5, [500, 500, 450], 20, { pesoMaximoEncima: 30 }),
      item('c', 3, [700, 300, 300], 8, { orientacionObligatoria: true }),
    ]
    expect(acomodar(items, contenedor)).toEqual(acomodar(items, contenedor))
  })

  test('orden de colocación: no apilables al final, volumen decreciente y, a igual volumen, el que aguanta más encima', () => {
    const items = [
      item('no-apilable', 1, [900, 900, 900], 10, { noApilable: true }),
      item('chica', 1, [300, 300, 300], 10),
      item('fragil', 1, [500, 500, 500], 10, { pesoMaximoEncima: 5 }),
      item('fuerte', 1, [500, 500, 500], 10, { pesoMaximoEncima: 100 }),
      item('sin-limite', 1, [500, 500, 500], 10),
    ]
    expect(acomodarValido(items).colocados.map((bulto) => bulto.item)).toEqual([
      'sin-limite',
      'fuerte',
      'fragil',
      'chica',
      'no-apilable',
    ])
  })

  test('nada queda apoyado sobre un no apilable (AC-04)', () => {
    const ibc = item('ibc', 2, [1000, 1000, 500], 10, { noApilable: true })
    const caja = item('caja', 8, [500, 500, 500], 10)
    const d = acomodarValido([ibc, caja])
    for (const abajo of de(d, 'ibc')) {
      expect(d.colocados.some((otro) => otro.z === abajo.z + 500 && otro.x < abajo.x + 1000 && abajo.x < otro.x + 500)).toBe(false)
    }
  })

  test('con orientación obligatoria, la altura final es la declarada (AC-05)', () => {
    // Acostada entraría mejor: 900 de alto no cabe dos veces en 1000.
    const heladera = item('heladera', 4, [400, 400, 900], 10, { orientacionObligatoria: true })
    const d = acomodarValido([heladera])
    expect(de(d, 'heladera').length).toBeGreaterThan(0)
    for (const bulto of de(d, 'heladera')) expect(bulto.orientacion[2]).toBe('alto')
  })

  test('respeta el peso máximo encima contando toda la pila (AC-06)', () => {
    // Sobre el frágil caben dos cajas de 30 kg en altura, pero solo admite 50 kg encima.
    const fragil = item('fragil', 1, [1000, 1000, 310], 10, { pesoMaximoEncima: 50 })
    const caja = item('caja', 2, [1000, 1000, 300], 30)
    const angosto: Contenedor = { ...contenedor, largo: 1000 }
    const d = acomodarValido([fragil, caja], angosto)
    expect(d.colocados.map((bulto) => [bulto.item, bulto.z])).toEqual([
      ['fragil', 0],
      ['caja', 310],
    ])
  })

  test('si sobra volumen, coloca lo que entra y lista el resto con motivo "volumen" (AC-07)', () => {
    const caja = item('caja', 20, [500, 500, 500], 10)
    const d = acomodarValido([caja])
    expect(d.colocados).toHaveLength(16)
    expect(d.afuera).toHaveLength(4)
    expect(d.afuera.every((bulto) => bulto.motivo === 'volumen')).toBe(true)
  })

  test('si sobra peso, no supera la carga máxima y lista el resto con motivo "peso" (AC-15)', () => {
    const caja = item('caja', 10, [500, 500, 500], 150)
    const d = acomodarValido([caja])
    expect(d.colocados).toHaveLength(6)
    expect(d.afuera).toHaveLength(4)
    expect(d.afuera.every((bulto) => bulto.motivo === 'peso')).toBe(true)
  })

  test('un bulto que no entra por volumen y además superaría la carga máxima queda afuera por peso (AC-23)', () => {
    const gigante = item('gigante', 1, [3000, 3000, 3000], 1001)
    const d = acomodarValido([gigante, item('caja', 1, [500, 500, 500], 10)])
    expect(d.afuera).toEqual([{ item: 'gigante', indice: 0, motivo: 'peso' }])
  })

  test('un bulto más grande que el contenedor queda afuera por volumen', () => {
    const d = acomodarValido([item('gigante', 1, [3000, 3000, 3000], 10)])
    expect(d.afuera).toEqual([{ item: 'gigante', indice: 0, motivo: 'volumen' }])
  })
})
