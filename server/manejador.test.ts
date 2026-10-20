import { describe, expect, test } from 'vitest'
import { manejar, MAX_CARACTERES } from './manejador.js'
import { FallaDelProveedor } from './modelo.js'
import { ModeloDePrueba } from './modelo-de-prueba.js'

const sinEsperas = { esperar: async () => {} }
const pedido = (descripcion: unknown) => JSON.stringify({ descripcion })
const unaCaja = JSON.stringify({
  items: [{ nombre: 'cajas', cantidad: 3, largo: null, ancho: null, alto: null, peso: null, entrada: null }],
})

describe('AC-25: descripción de más de 2.000 caracteres', () => {
  test('el proxy la rechaza con un mensaje que dice el límite y el modelo no recibe ninguna llamada', async () => {
    const modelo = new ModeloDePrueba([unaCaja])
    let pedidos = 0
    const respuesta = await manejar(pedido('a'.repeat(MAX_CARACTERES + 1)), () => (pedidos++, modelo), sinEsperas)
    expect(respuesta.estado).toBe(413)
    expect(respuesta.cuerpo).toEqual({ tipo: 'rechazada', mensaje: 'La descripción tiene 2.001 caracteres y el límite es 2.000.' })
    expect(modelo.consultas).toHaveLength(0)
    expect(pedidos).toBe(0)
  })

  test('con 2.000 justos pasa', async () => {
    const modelo = new ModeloDePrueba([unaCaja])
    const respuesta = await manejar(pedido('a'.repeat(MAX_CARACTERES)), () => modelo, sinEsperas)
    expect(respuesta.estado).toBe(200)
    expect(modelo.consultas).toHaveLength(1)
  })

  test('cuenta caracteres y no unidades de UTF-16', async () => {
    const modelo = new ModeloDePrueba([unaCaja])
    const respuesta = await manejar(pedido('📦'.repeat(MAX_CARACTERES)), () => modelo, sinEsperas)
    expect(respuesta.estado).toBe(200)
  })
})

test.each([
  ['no es JSON', 'descripcion=cajas', 'El pedido no es JSON.'],
  ['sin descripción', JSON.stringify({ texto: 'cajas' }), 'Falta la descripción de la carga.'],
  ['descripción que no es texto', pedido(40), 'Falta la descripción de la carga.'],
  ['JSON nulo', 'null', 'Falta la descripción de la carga.'],
  ['descripción vacía', pedido('   '), 'La descripción está vacía.'],
])('%s: se rechaza con 400 sin llamar al modelo', async (_, cuerpo, mensaje) => {
  const modelo = new ModeloDePrueba([unaCaja])
  expect(await manejar(cuerpo, () => modelo, sinEsperas)).toEqual({ estado: 400, cuerpo: { tipo: 'rechazada', mensaje } })
  expect(modelo.consultas).toHaveLength(0)
})

test('devuelve los ítems interpretados', async () => {
  const respuesta = await manejar(pedido('3 cajas'), () => new ModeloDePrueba([unaCaja]), sinEsperas)
  expect(respuesta.estado).toBe(200)
  expect(respuesta.cuerpo.tipo === 'interpretada' && respuesta.cuerpo.items.map((item) => item.nombre)).toEqual(['cajas'])
})

test('sin la key configurada, avisa sin decir cuál falta', async () => {
  expect(await manejar(pedido('3 cajas'), () => null)).toEqual({
    estado: 500,
    cuerpo: { tipo: 'sin-configurar', mensaje: 'El servidor no tiene configurado el acceso al modelo.' },
  })
})

test('una respuesta que nunca se puede leer es un error de interpretación, no del proveedor', async () => {
  const respuesta = await manejar(pedido('3 cajas'), () => new ModeloDePrueba(['', '', '']), sinEsperas)
  expect(respuesta.estado).toBe(422)
  expect(respuesta.cuerpo.tipo).toBe('sin-interpretacion')
})

test('una falla transitoria del proveedor se informa como 503 y una definitiva como 502', async () => {
  const transitoria = await manejar(
    pedido('3 cajas'),
    () => new ModeloDePrueba(Array(3).fill(new FallaDelProveedor('limite-de-velocidad'))),
    sinEsperas,
  )
  expect(transitoria).toMatchObject({ estado: 503, cuerpo: { tipo: 'falla-del-proveedor', motivo: 'limite-de-velocidad' } })
  const definitiva = await manejar(pedido('3 cajas'), () => new ModeloDePrueba([new FallaDelProveedor('saldo-agotado')]), sinEsperas)
  expect(definitiva).toMatchObject({ estado: 502, cuerpo: { tipo: 'falla-del-proveedor', motivo: 'saldo-agotado' } })
})
