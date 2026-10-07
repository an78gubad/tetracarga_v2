import { describe, expect, test } from 'vitest'
import type { Contenedor, ItemListo } from '../dominio/tipos'
import { consolidar } from './consolidar'

const contenedor: Contenedor = { id: '20', nombre: 'prueba', largo: 1000, ancho: 1000, alto: 1000, cargaUtil: 90 }

const caja: ItemListo = {
  id: 'caja',
  nombre: 'cajas',
  cantidad: 10,
  largo: 500,
  ancho: 500,
  alto: 500,
  peso: 12.5,
  noApilable: false,
  orientacionObligatoria: false,
  pesoMaximoEncima: null,
}

describe('consolidar', () => {
  test('informa aprovechamiento de volumen y de peso, colocados y afuera con su motivo (RF-09)', () => {
    const resultado = consolidar([caja, { ...caja, id: 'pesada', cantidad: 1, peso: 30 }], contenedor)
    expect(resultado.valida).toBe(true)
    if (!resultado.valida) return
    const { informe } = resultado
    // Entran 8 cajas por volumen, pero la carga útil de 90 kg corta en la séptima.
    expect(informe.bultosColocados).toBe(7)
    expect(informe.pesoColocado).toBe(87.5)
    expect(informe.aprovechamientoDePeso).toBe(87.5 / 90)
    expect(informe.aprovechamientoDeVolumen).toBe(7 / 8)
    expect(informe.porItem).toEqual([
      { item: 'caja', colocados: 7, afueraPorPeso: 3, afueraPorVolumen: 0 },
      { item: 'pesada', colocados: 0, afueraPorPeso: 1, afueraPorVolumen: 0 },
    ])
    expect(informe.afuera).toHaveLength(4)
  })

  test('una disposición que no pasa el validador no se devuelve (RNF-03)', () => {
    const superpuestas = consolidar([{ ...caja, cantidad: 2 }], contenedor, () => ({
      contenedor: '20',
      colocados: [
        { item: 'caja', indice: 0, x: 0, y: 0, z: 0, orientacion: ['largo', 'ancho', 'alto'] },
        { item: 'caja', indice: 1, x: 0, y: 0, z: 0, orientacion: ['largo', 'ancho', 'alto'] },
      ],
      afuera: [],
    }))
    expect(superpuestas).toEqual({ valida: false, violaciones: [{ tipo: 'superposicion', posicion: 1, otra: 0 }] })
    expect('disposicion' in superpuestas).toBe(false)
  })
})
