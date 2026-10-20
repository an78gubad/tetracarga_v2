import { expect, test } from 'vitest'
import { pedirInterpretacion } from './cliente'

function fetchFalso(contestar: () => Response | Promise<Response>) {
  const llamadas: { url: string; init: RequestInit }[] = []
  const buscar = (async (url: string, init: RequestInit) => {
    llamadas.push({ url, init })
    return contestar()
  }) as typeof fetch
  return { llamadas, buscar }
}

test('manda la descripción al proxy propio y devuelve lo que contesta', async () => {
  const { llamadas, buscar } = fetchFalso(() => Response.json({ tipo: 'interpretada', items: [] }))
  expect(await pedirInterpretacion('3 cajas', buscar)).toEqual({ tipo: 'interpretada', items: [] })
  expect(llamadas).toHaveLength(1)
  expect(llamadas[0]!.url).toBe('/api/interpretar')
  expect(llamadas[0]!.init.method).toBe('POST')
  expect(JSON.parse(llamadas[0]!.init.body as string)).toEqual({ descripcion: '3 cajas' })
})

test('un rechazo del proxy llega con su mensaje', async () => {
  const cuerpo = { tipo: 'rechazada', mensaje: 'La descripción tiene 2.001 caracteres y el límite es 2.000.' }
  const { buscar } = fetchFalso(() => Response.json(cuerpo, { status: 413 }))
  expect(await pedirInterpretacion('a', buscar)).toEqual(cuerpo)
})

test.each([
  ['sin red', () => Promise.reject(new TypeError('Failed to fetch'))],
  ['una página de error', () => new Response('<html>502</html>', { status: 502 })],
  ['un JSON ajeno al contrato', () => Response.json({ error: 'x' })],
  ['interpretada sin ítems', () => Response.json({ tipo: 'interpretada' })],
])('%s cuenta como sin respuesta', async (_, contestar) => {
  const { buscar } = fetchFalso(contestar)
  expect((await pedirInterpretacion('3 cajas', buscar)).tipo).toBe('sin-respuesta')
})
