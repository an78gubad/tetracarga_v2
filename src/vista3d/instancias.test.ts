import { expect, test } from 'vitest'
import type { Disposicion, ItemListo } from '../dominio/tipos'
import { agrupar } from './instancias'

const caja: ItemListo = {
  id: 'caja',
  nombre: 'cajas',
  cantidad: 2,
  largo: 600,
  ancho: 400,
  alto: 300,
  peso: 10,
  noApilable: false,
  orientacionObligatoria: false,
  pesoMaximoEncima: null,
}
const tambor: ItemListo = { ...caja, id: 'tambor', cantidad: 1, largo: 585, ancho: 585, alto: 877 }

const disposicion: Disposicion = {
  contenedor: '20',
  colocados: [
    { item: 'caja', indice: 0, x: 0, y: 0, z: 0, orientacion: ['largo', 'ancho', 'alto'] },
    { item: 'tambor', indice: 0, x: 600, y: 0, z: 0, orientacion: ['largo', 'ancho', 'alto'] },
    { item: 'caja', indice: 1, x: 0, y: 0, z: 300, orientacion: ['ancho', 'alto', 'largo'] },
  ],
  afuera: [],
}

test('agrupa por tipo, en orden de carga, en metros, con el alto en y y el ancho hacia -z', () => {
  const [cajas, tambores] = agrupar(disposicion, [caja, tambor])
  expect(cajas!.instancias).toEqual([
    { centro: [0.3, 0.15, -0.2], tamano: [0.6, 0.3, 0.4], orden: 0 },
    // Parada sobre el lado: 400 en x, 300 en y (ancho del contenedor), 600 de alto.
    { centro: [0.2, 0.6, -0.15], tamano: [0.4, 0.6, 0.3], orden: 2 },
  ])
  expect(tambores!.instancias.map((instancia) => instancia.orden)).toEqual([1])
})

test('un tipo sin bultos colocados queda con su grupo vacío', () => {
  const [, tambores] = agrupar({ ...disposicion, colocados: disposicion.colocados.slice(0, 1) }, [caja, tambor])
  expect(tambores!.instancias).toEqual([])
})
