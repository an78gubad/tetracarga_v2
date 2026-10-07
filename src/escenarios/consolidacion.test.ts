import { describe, expect, test } from 'vitest'
import { acomodar } from '../acomodador/acomodar'
import { CONTENEDORES } from '../catalogo/contenedores'
import { validar } from '../validador/validar'
import { ESCENARIOS } from './escenarios'

const CORRIDAS = 20

describe.each(ESCENARIOS)('$id', (escenario) => {
  const contenedor = CONTENEDORES[escenario.contenedor]

  test('ninguna disposición dispara el validador (AC-10)', () => {
    expect(validar(acomodar(escenario.items, contenedor), escenario.items, contenedor)).toEqual([])
  })

  test(`se consolida en menos de 5 s, p95 de ${CORRIDAS} corridas (RNF-04)`, () => {
    const tiempos = Array.from({ length: CORRIDAS }, () => {
      const inicio = performance.now()
      acomodar(escenario.items, contenedor)
      return performance.now() - inicio
    }).sort((a, b) => a - b)
    const p95 = tiempos[Math.ceil(CORRIDAS * 0.95) - 1]!
    expect(p95).toBeLessThan(5000)
    // El límite es por corrida; el test entero corre las 20.
  }, CORRIDAS * 5000)
})
