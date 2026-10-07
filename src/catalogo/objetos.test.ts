import { describe, expect, test } from 'vitest'
import { OBJETOS } from './objetos'

describe('catálogo de objetos (RF-03)', () => {
  test('los ids no se repiten', () => {
    const ids = OBJETOS.map((entrada) => entrada.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test.each(OBJETOS)('$id: cada medida es null o milímetros enteros positivos', (entrada) => {
    for (const medida of [entrada.largo, entrada.ancho, entrada.alto]) {
      if (medida !== null) expect(Number.isInteger(medida) && medida > 0).toBe(true)
    }
  })

  test.each(OBJETOS)('$id: el peso es null o positivo', (entrada) => {
    if (entrada.peso !== null) expect(entrada.peso).toBeGreaterThan(0)
  })

  test.each(OBJETOS)('$id: trae al menos una medida', (entrada) => {
    expect([entrada.largo, entrada.ancho, entrada.alto].some((medida) => medida !== null)).toBe(true)
  })

  test.each(OBJETOS)('$id: nombra la ficha de la que sale', (entrada) => {
    expect(entrada.fuente.ficha).not.toBe('')
    expect(entrada.fuente.url).toMatch(/^https:\/\//)
    expect(entrada.fuente.consultada).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('hay una entrada con medidas y sin peso (AC-18)', () => {
    const conMedidasSinPeso = OBJETOS.filter(
      (entrada) => entrada.largo !== null && entrada.ancho !== null && entrada.alto !== null && entrada.peso === null,
    )
    expect(conMedidasSinPeso).not.toEqual([])
  })

  test('el tambor de 200 litros existe con sus medidas (AC-02)', () => {
    const tambor = OBJETOS.find((entrada) => entrada.id === 'tambor-200l')
    expect(tambor).toMatchObject({ largo: 585, ancho: 585, alto: 877 })
  })
})
