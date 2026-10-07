import { describe, expect, test } from 'vitest'
import type { BultoColocado, Contenedor, Disposicion, ItemListo, Orientacion } from '../dominio/tipos'
import { validar, type TipoViolacion } from './validar'

// Un contenedor chico de prueba, para armar disposiciones a mano.
const contenedor: Contenedor = { id: '20', nombre: 'prueba', largo: 1000, ancho: 1000, alto: 1000, cargaUtil: 1000 }

const PARADO: Orientacion = ['largo', 'ancho', 'alto']

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

function en(itemId: string, indice: number, x: number, y: number, z: number, orientacion: Orientacion = PARADO): BultoColocado {
  return { item: itemId, indice, x, y, z, orientacion }
}

function disposicion(colocados: BultoColocado[], afuera: Disposicion['afuera'] = []): Disposicion {
  return { contenedor: '20', colocados, afuera }
}

const tipos = (d: Disposicion, items: ItemListo[], c: Contenedor = contenedor): TipoViolacion[] =>
  validar(d, items, c).map((violacion) => violacion.tipo)

describe('validar (RF-08)', () => {
  test('una pila bien apoyada es válida', () => {
    const caja = item('caja', 3, [500, 500, 500], 10)
    const d = disposicion([en('caja', 0, 0, 0, 0), en('caja', 1, 500, 0, 0), en('caja', 2, 250, 0, 500)])
    expect(validar(d, [caja], contenedor)).toEqual([])
  })

  test('rechaza una disposición calculada para otro contenedor', () => {
    const caja = item('caja', 1, [500, 500, 500], 10)
    expect(tipos({ ...disposicion([en('caja', 0, 0, 0, 0)]), contenedor: '40' }, [caja])).toEqual(['contenedor-distinto'])
  })

  describe('bultos', () => {
    const caja = item('caja', 2, [500, 500, 500], 10)

    test('cada bulto queda colocado o afuera, una sola vez', () => {
      expect(tipos(disposicion([en('caja', 0, 0, 0, 0)], [{ item: 'caja', indice: 1, motivo: 'volumen' }]), [caja])).toEqual([])
      expect(tipos(disposicion([en('caja', 0, 0, 0, 0)]), [caja])).toEqual(['bulto-sin-destino'])
      expect(
        tipos(disposicion([en('caja', 0, 0, 0, 0), en('caja', 1, 500, 0, 0)], [{ item: 'caja', indice: 1, motivo: 'volumen' }]), [caja]),
      ).toEqual(['bulto-repetido'])
    })

    test('rechaza bultos de ítems que no existen o fuera de la cantidad', () => {
      const d = disposicion([en('caja', 0, 0, 0, 0), en('caja', 1, 500, 0, 0), en('caja', 2, 0, 500, 0), en('otro', 0, 500, 500, 0)])
      expect(tipos(d, [caja])).toEqual(['bulto-desconocido', 'bulto-desconocido'])
    })
  })

  describe('geometría', () => {
    const caja = item('caja', 2, [500, 400, 300], 10)

    test('las posiciones son milímetros enteros (RF-07)', () => {
      expect(tipos(disposicion([en('caja', 0, 0.5, 0, 0)], [{ item: 'caja', indice: 1, motivo: 'volumen' }]), [caja])).toEqual([
        'posicion-no-entera',
      ])
    })

    test('rechaza lo que sale del contenedor por cualquier lado', () => {
      const afuera = [{ item: 'caja', indice: 1, motivo: 'volumen' as const }]
      expect(tipos(disposicion([en('caja', 0, 501, 0, 0)], afuera), [caja])).toEqual(['fuera-del-contenedor'])
      expect(tipos(disposicion([en('caja', 0, -1, 0, 0)], afuera), [caja])).toEqual(['fuera-del-contenedor'])
      expect(tipos(disposicion([en('caja', 0, 0, 0, 0, ['alto', 'largo', 'ancho'])], afuera), [caja])).toEqual([])
      expect(tipos(disposicion([en('caja', 0, 0, 601, 0)], afuera), [caja])).toEqual(['fuera-del-contenedor'])
    })

    test('la orientación decide qué medida queda en cada eje', () => {
      // Con el largo en y, 500 mm desde y = 600 se pasa del ancho de 1000.
      expect(
        tipos(disposicion([en('caja', 0, 0, 600, 0, ['ancho', 'largo', 'alto'])], [{ item: 'caja', indice: 1, motivo: 'volumen' }]), [caja]),
      ).toEqual(['fuera-del-contenedor'])
    })

    test('rechaza superposiciones y acepta caras que se tocan', () => {
      expect(tipos(disposicion([en('caja', 0, 0, 0, 0), en('caja', 1, 499, 0, 0)]), [caja])).toEqual(['superposicion'])
      expect(tipos(disposicion([en('caja', 0, 0, 0, 0), en('caja', 1, 500, 0, 0)]), [caja])).toEqual([])
    })
  })

  describe('apoyo', () => {
    const base = item('base', 1, [1000, 1000, 100], 10)
    const caja = item('caja', 1, [500, 500, 100], 10)

    test('acepta el 80% de la base apoyada y rechaza menos', () => {
      // Una tabla de 500 mm de largo sobre un soporte de 400: apoya 400 de 500, justo el 80%.
      const soporte = item('soporte', 1, [400, 1000, 100], 10)
      const tabla = item('tabla', 1, [500, 100, 100], 10)
      const conTablaEn = (x: number) =>
        tipos(disposicion([en('soporte', 0, 0, 0, 0), en('tabla', 0, x, 0, 100)]), [soporte, tabla])
      expect(conTablaEn(0)).toEqual([])
      expect(conTablaEn(1)).toEqual(['sin-apoyo'])
    })

    test('rechaza un bulto flotando', () => {
      expect(tipos(disposicion([en('caja', 0, 0, 0, 1)]), [caja])).toEqual(['sin-apoyo'])
    })

    test('solo cuenta el apoyo de lo cargado antes: cada prefijo es estable (AC-24)', () => {
      expect(tipos(disposicion([en('base', 0, 0, 0, 0), en('caja', 0, 0, 0, 100)]), [base, caja])).toEqual([])
      expect(tipos(disposicion([en('caja', 0, 0, 0, 100), en('base', 0, 0, 0, 0)]), [base, caja])).toEqual(['sin-apoyo'])
    })

    test('el apoyo puede repartirse entre varios bultos', () => {
      const ladrillo = item('ladrillo', 2, [250, 500, 100], 10)
      const d = disposicion([en('ladrillo', 0, 0, 0, 0), en('ladrillo', 1, 250, 0, 0), en('caja', 0, 0, 0, 100)])
      expect(tipos(d, [ladrillo, caja])).toEqual([])
    })
  })

  describe('marcas de RF-06', () => {
    test('la orientación obligatoria deja el alto en z y permite girar en planta (AC-05)', () => {
      const heladera = item('heladera', 1, [700, 600, 900], 50, { orientacionObligatoria: true })
      expect(tipos(disposicion([en('heladera', 0, 0, 0, 0, ['ancho', 'largo', 'alto'])]), [heladera])).toEqual([])
      expect(tipos(disposicion([en('heladera', 0, 0, 0, 0, ['alto', 'ancho', 'largo'])]), [heladera])).toEqual([
        'orientacion-obligatoria',
      ])
    })

    test('nada se apoya sobre un no apilable (AC-04)', () => {
      const ibc = item('ibc', 1, [500, 500, 500], 10, { noApilable: true })
      const caja = item('caja', 1, [500, 500, 100], 10)
      expect(tipos(disposicion([en('ibc', 0, 0, 0, 0), en('caja', 0, 0, 0, 500)]), [ibc, caja])).toEqual([
        'apilado-sobre-no-apilable',
      ])
      expect(tipos(disposicion([en('ibc', 0, 0, 0, 0), en('caja', 0, 500, 0, 0)]), [ibc, caja])).toEqual([])
    })

    describe('peso máximo encima (AC-06)', () => {
      const fragil = item('fragil', 1, [500, 500, 100], 10, { pesoMaximoEncima: 50 })

      test('admite justo el máximo y rechaza más', () => {
        const de = (peso: number) => item('caja', 1, [500, 500, 100], peso)
        expect(tipos(disposicion([en('fragil', 0, 0, 0, 0), en('caja', 0, 0, 0, 100)]), [fragil, de(50)])).toEqual([])
        expect(tipos(disposicion([en('fragil', 0, 0, 0, 0), en('caja', 0, 0, 0, 100)]), [fragil, de(50.001)])).toEqual([
          'peso-encima',
        ])
      })

      test('cuenta lo que se propaga hacia abajo por toda la pila', () => {
        const caja = item('caja', 2, [500, 500, 100], 30)
        const d = disposicion([en('fragil', 0, 0, 0, 0), en('caja', 0, 0, 0, 100), en('caja', 1, 0, 0, 200)])
        expect(tipos(d, [fragil, caja])).toEqual(['peso-encima'])
      })

      test('reparte el peso en proporción al área de contacto', () => {
        // Una caja de 100 kg apoyada mitad sobre el frágil y mitad sobre otro: le tocan 50.
        const otro = item('otro', 1, [500, 500, 100], 10)
        const de = (peso: number) => item('tapa', 1, [1000, 500, 100], peso)
        const d = disposicion([en('fragil', 0, 0, 0, 0), en('otro', 0, 500, 0, 0), en('tapa', 0, 0, 0, 100)])
        expect(tipos(d, [fragil, otro, de(100)])).toEqual([])
        expect(tipos(d, [fragil, otro, de(100.004)])).toEqual(['peso-encima'])

        // Con el 70% de la base sobre el frágil, 70 kg × 70% = 49 kg.
        const corrida = disposicion([en('fragil', 0, 0, 0, 0), en('otro', 0, 500, 0, 0), en('tapa', 0, 150, 0, 100)])
        expect(tipos(corrida, [fragil, otro, item('tapa', 1, [500, 500, 100], 70)])).toEqual([])
      })

      test('lo cargado después no cuenta como apoyo pero sí recibe su parte del peso', () => {
        const otro = item('otro', 1, [500, 500, 100], 10)
        const tapa = item('tapa', 1, [1000, 500, 100], 100)
        // El otro llega después de la tapa: no la apoya, pero carga su mitad. Si no, al frágil
        // le tocarían los 100 kg y además habría peso encima.
        const d = disposicion([en('fragil', 0, 0, 0, 0), en('tapa', 0, 0, 0, 100), en('otro', 0, 500, 0, 0)])
        expect(tipos(d, [fragil, otro, tapa])).toEqual(['sin-apoyo'])
      })

      test('suma kilos con decimales sin errores de redondeo', () => {
        // 0,1 + 0,2 da 0,30000000000000004 en punto flotante.
        const limite = item('limite', 1, [500, 500, 100], 1, { pesoMaximoEncima: 0.3 })
        const liviana = item('liviana', 1, [500, 500, 100], 0.1)
        const otra = item('otra', 1, [500, 500, 100], 0.2)
        const d = disposicion([en('limite', 0, 0, 0, 0), en('otra', 0, 0, 0, 100), en('liviana', 0, 0, 0, 200)])
        expect(tipos(d, [limite, liviana, otra])).toEqual([])
      })
    })
  })

  describe('carga máxima', () => {
    test('admite justo la carga útil y rechaza apenas más', () => {
      const de = (peso: number) => item('caja', 2, [500, 500, 500], peso)
      const d = disposicion([en('caja', 0, 0, 0, 0), en('caja', 1, 500, 0, 0)])
      expect(tipos(d, [de(500)])).toEqual([])
      expect(tipos(d, [de(500.001)])).toEqual(['carga-maxima'])
    })

    test('no cuenta lo que quedó afuera', () => {
      const caja = item('caja', 2, [500, 500, 500], 600)
      expect(tipos(disposicion([en('caja', 0, 0, 0, 0)], [{ item: 'caja', indice: 1, motivo: 'peso' }]), [caja])).toEqual([])
    })
  })
})
