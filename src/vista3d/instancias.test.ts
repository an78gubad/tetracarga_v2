import { expect, test } from 'vitest'
import { consolidar } from '../consolidacion/consolidar'
import { CONTENEDORES } from '../catalogo/contenedores'
import type { Disposicion, ItemListo } from '../dominio/tipos'
import { ESCENARIOS } from '../escenarios/escenarios'
import { agrupar, aristasDeBultos, cantidadesVisibles, VALORES_POR_BULTO } from './instancias'

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

test('las aristas van en orden de carga, 12 por bulto, sobre el contorno de cada uno', () => {
  const valores = aristasDeBultos(agrupar(disposicion, [caja, tambor]))
  expect(valores).toHaveLength(3 * VALORES_POR_BULTO)
  // El segundo bulto cargado es el tambor: sus aristas arrancan en x = 0,6.
  const delTambor = valores.slice(VALORES_POR_BULTO, 2 * VALORES_POR_BULTO)
  const xs = delTambor.filter((_, i) => i % 3 === 0)
  expect(Math.min(...xs)).toBeCloseTo(0.6)
  expect(Math.max(...xs)).toBeCloseTo(1.185)
  // Las 24 puntas tocan las 8 esquinas, 3 veces cada una.
  const puntas = new Map<string, number>()
  for (let i = 0; i < delTambor.length; i += 3) {
    const clave = [...delTambor.slice(i, i + 3)].map((v) => v.toFixed(4)).join()
    puntas.set(clave, (puntas.get(clave) ?? 0) + 1)
  }
  expect([...puntas.values()]).toEqual(Array(8).fill(3))
})

test('AC-08: en la posición k se ven exactamente los primeros k bultos de la secuencia', () => {
  const escenario = ESCENARIOS.find((candidato) => candidato.id === '10-todo-junto')!
  const consolidacion = consolidar(escenario.items, CONTENEDORES[escenario.contenedor])
  if (!consolidacion.valida) throw new Error('el escenario no pasa el validador')
  const grupos = agrupar(consolidacion.disposicion, escenario.items)
  const total = consolidacion.disposicion.colocados.length
  for (let k = 0; k <= total; k++) {
    const cantidades = cantidadesVisibles(grupos, k)
    const ordenes = grupos.flatMap((grupo, i) => grupo.instancias.slice(0, cantidades[i]).map((instancia) => instancia.orden))
    expect(ordenes.sort((a, b) => a - b)).toEqual([...Array(k).keys()])
  }
})
