import { describe, expect, test } from 'vitest'
import { CONTENEDORES } from './contenedores'

describe('catálogo de contenedores (RF-05)', () => {
  test("trae exactamente 20', 40' y 40' high cube", () => {
    expect(Object.keys(CONTENEDORES).sort()).toEqual(['20', '40', '40hc'])
  })

  test.each(Object.values(CONTENEDORES))('$id: la clave coincide con el id de la entrada', (entrada) => {
    expect(CONTENEDORES[entrada.id]).toBe(entrada)
  })

  test.each(Object.values(CONTENEDORES))('$id: medidas internas en milímetros enteros positivos', (entrada) => {
    for (const medida of [entrada.largo, entrada.ancho, entrada.alto]) {
      expect(Number.isInteger(medida) && medida > 0).toBe(true)
    }
  })

  test.each(Object.values(CONTENEDORES))('$id: carga útil positiva', (entrada) => {
    expect(entrada.cargaUtil).toBeGreaterThan(0)
  })

  test.each(Object.values(CONTENEDORES))('$id: nombra la ficha de la que sale', (entrada) => {
    expect(entrada.fuente.ficha).not.toBe('')
    expect(entrada.fuente.url).toMatch(/^https:\/\//)
    expect(entrada.fuente.consultada).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
