import { describe, expect, test } from 'vitest'
import { ESCENARIOS } from './escenarios'
import { calcularLineaBase } from './linea-base'
import congelada from './linea-base.json'

// RNF-05: si esto falla, el error está en el código, no en la disposición congelada.
describe('línea base congelada (AC-14)', () => {
  const recalculada = calcularLineaBase()

  test('tiene los 10 escenarios', () => {
    expect(Object.keys(congelada).sort()).toEqual(ESCENARIOS.map((escenario) => escenario.id).sort())
  })

  test.each(ESCENARIOS)('$id coincide bulto por bulto: posición, orientación y orden', (escenario) => {
    expect(recalculada[escenario.id]).toEqual(congelada[escenario.id as keyof typeof congelada])
  })
})
