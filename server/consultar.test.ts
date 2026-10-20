import { describe, expect, test } from 'vitest'
import { consultar, MAX_INTENTOS } from './consultar.js'
import { FallaDelProveedor, type Consulta } from './modelo.js'
import { ModeloDePrueba } from './modelo-de-prueba.js'

const consulta: Consulta = { sistema: 'Interpretá la carga.', usuario: '40 cajas de 60x40x30', maxTokens: 1000 }

/** Lee un número; cualquier otra cosa es una respuesta que no se puede usar. */
const leerNumero = (respuesta: string) => (/^\d+$/.test(respuesta.trim()) ? Number(respuesta) : null)

function sinEsperas() {
  const esperas: number[] = []
  return { esperas, esperar: async (ms: number) => void esperas.push(ms) }
}

describe('AC-20: respuesta vacía', () => {
  test('vuelve a preguntar y usa la primera respuesta que se puede leer', async () => {
    const modelo = new ModeloDePrueba(['', '   ', '42'])
    const { esperar } = sinEsperas()
    expect(await consultar(modelo, consulta, leerNumero, { esperar })).toEqual({ tipo: 'interpretada', valor: 42, intentos: 3 })
  })

  test('vuelve a preguntar un número acotado de veces y no lo confunde con una falla del proveedor', async () => {
    const modelo = new ModeloDePrueba(Array(MAX_INTENTOS + 2).fill(''))
    const { esperar } = sinEsperas()
    expect(await consultar(modelo, consulta, leerNumero, { esperar })).toEqual({ tipo: 'sin-interpretacion', intentos: MAX_INTENTOS })
    expect(modelo.consultas).toHaveLength(MAX_INTENTOS)
  })
})

test('AC-26: una respuesta que no se puede leer se trata como la vacía', async () => {
  const modelo = new ModeloDePrueba(['{"items": "no"}', '42'])
  const { esperar } = sinEsperas()
  expect(await consultar(modelo, consulta, leerNumero, { esperar })).toEqual({ tipo: 'interpretada', valor: 42, intentos: 2 })
})

describe('AC-20: límite de velocidad', () => {
  test('reintenta después de esperar', async () => {
    const modelo = new ModeloDePrueba([new FallaDelProveedor('limite-de-velocidad'), '42'])
    const { esperas, esperar } = sinEsperas()
    expect(await consultar(modelo, consulta, leerNumero, { esperar })).toEqual({ tipo: 'interpretada', valor: 42, intentos: 2 })
    expect(esperas).toEqual([1000])
  })

  test('respeta la espera que pide el proveedor, con tope', async () => {
    const modelo = new ModeloDePrueba([
      new FallaDelProveedor('limite-de-velocidad', 2500),
      new FallaDelProveedor('limite-de-velocidad', 60_000),
      '42',
    ])
    const { esperas, esperar } = sinEsperas()
    await consultar(modelo, consulta, leerNumero, { esperar })
    expect(esperas).toEqual([2500, 4000])
  })

  test('si sigue, corta en el máximo de intentos y lo informa como falla transitoria del proveedor', async () => {
    const modelo = new ModeloDePrueba(Array(MAX_INTENTOS + 2).fill(new FallaDelProveedor('limite-de-velocidad')))
    const { esperas, esperar } = sinEsperas()
    expect(await consultar(modelo, consulta, leerNumero, { esperar })).toEqual({
      tipo: 'falla-del-proveedor',
      motivo: 'limite-de-velocidad',
      transitoria: true,
      intentos: MAX_INTENTOS,
    })
    expect(modelo.consultas).toHaveLength(MAX_INTENTOS)
    // Después del último intento no se espera.
    expect(esperas).toEqual([1000, 2000])
  })
})

describe('AC-20: error de autenticación o saldo agotado', () => {
  test.each(['credenciales-invalidas', 'saldo-agotado', 'pedido-rechazado'] as const)('%s no se reintenta', async (motivo) => {
    const modelo = new ModeloDePrueba([new FallaDelProveedor(motivo), '42'])
    const { esperas, esperar } = sinEsperas()
    expect(await consultar(modelo, consulta, leerNumero, { esperar })).toEqual({
      tipo: 'falla-del-proveedor',
      motivo,
      transitoria: false,
      intentos: 1,
    })
    expect(modelo.consultas).toHaveLength(1)
    expect(esperas).toEqual([])
  })
})

test('el proveedor caído o sin conexión es transitorio', () => {
  expect(new FallaDelProveedor('proveedor-caido').transitoria).toBe(true)
  expect(new FallaDelProveedor('sin-conexion').transitoria).toBe(true)
})

test('si el último intento terminó en falla del proveedor, la falla es suya aunque antes haya contestado', async () => {
  const modelo = new ModeloDePrueba(['', '', new FallaDelProveedor('proveedor-caido')])
  const { esperar } = sinEsperas()
  expect(await consultar(modelo, consulta, leerNumero, { esperar })).toMatchObject({ tipo: 'falla-del-proveedor', motivo: 'proveedor-caido' })
})

test('un error que no es del proveedor no se tapa como falla', async () => {
  const modelo = new ModeloDePrueba([])
  await expect(consultar(modelo, consulta, leerNumero)).rejects.toThrow('sin respuestas')
})

test('cada intento manda la misma consulta, con su tope de respuesta', async () => {
  const modelo = new ModeloDePrueba(['', '42'])
  const { esperar } = sinEsperas()
  await consultar(modelo, consulta, leerNumero, { esperar })
  expect(modelo.consultas).toEqual([consulta, consulta])
})
