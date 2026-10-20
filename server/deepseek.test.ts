import { describe, expect, test } from 'vitest'
import { MODELO_DEEPSEEK, ModeloDeepSeek, modeloDesdeEntorno, URL_DEEPSEEK } from './deepseek.js'
import { FallaDelProveedor, type Consulta } from './modelo.js'

const consulta: Consulta = { sistema: 'Respondé en JSON.', usuario: '3 cajas', maxTokens: 2048 }

/** Un fetch falso que contesta lo que se le da y anota lo que recibe. */
function fetchFalso(contestar: () => Response | Promise<Response>) {
  const llamadas: { url: string; init: RequestInit }[] = []
  const buscar = (async (url: string, init: RequestInit) => {
    llamadas.push({ url, init })
    return contestar()
  }) as typeof fetch
  return { llamadas, buscar }
}

const contenido = (texto: string | null) => Response.json({ choices: [{ message: { content: texto }, finish_reason: 'stop' }] })

async function falla(promesa: Promise<unknown>): Promise<FallaDelProveedor> {
  const error = await promesa.then(
    () => null,
    (error: unknown) => error,
  )
  if (!(error instanceof FallaDelProveedor)) throw new Error(`se esperaba una falla del proveedor: ${String(error)}`)
  return error
}

test('pide JSON al modelo configurado, sin razonamiento, con la key en el encabezado y la respuesta acotada', async () => {
  const { llamadas, buscar } = fetchFalso(() => contenido('{"items": []}'))
  expect(await new ModeloDeepSeek('clave-de-prueba', buscar).completar(consulta)).toBe('{"items": []}')
  const [{ url, init }] = llamadas as [{ url: string; init: RequestInit }]
  expect(url).toBe(URL_DEEPSEEK)
  expect(init.method).toBe('POST')
  expect((init.headers as Record<string, string>).Authorization).toBe('Bearer clave-de-prueba')
  expect(JSON.parse(init.body as string)).toEqual({
    model: MODELO_DEEPSEEK,
    messages: [
      { role: 'system', content: 'Respondé en JSON.' },
      { role: 'user', content: '3 cajas' },
    ],
    thinking: { type: 'disabled' },
    response_format: { type: 'json_object' },
    max_tokens: 2048,
    temperature: 0,
  })
})

test('sin contenido devuelve la respuesta vacía, que se vuelve a preguntar (AC-20)', async () => {
  const { buscar } = fetchFalso(() => contenido(null))
  expect(await new ModeloDeepSeek('k', buscar).completar(consulta)).toBe('')
})

test('un 200 que no es JSON también cuenta como respuesta vacía', async () => {
  const { buscar } = fetchFalso(() => new Response('<html>'))
  expect(await new ModeloDeepSeek('k', buscar).completar(consulta)).toBe('')
})

describe('los códigos de error de DeepSeek se clasifican (RNF-08)', () => {
  test.each([
    [401, 'credenciales-invalidas', false],
    [402, 'saldo-agotado', false],
    [400, 'pedido-rechazado', false],
    [422, 'pedido-rechazado', false],
    [429, 'limite-de-velocidad', true],
    [500, 'proveedor-caido', true],
    [503, 'proveedor-caido', true],
  ] as const)('%i: %s', async (estado, motivo, transitoria) => {
    const { buscar } = fetchFalso(() => new Response('{}', { status: estado }))
    const error = await falla(new ModeloDeepSeek('k', buscar).completar(consulta))
    expect([error.motivo, error.transitoria]).toEqual([motivo, transitoria])
  })
})

test('un límite de velocidad trae la espera que pide el proveedor', async () => {
  const { buscar } = fetchFalso(() => new Response('{}', { status: 429, headers: { 'Retry-After': '2' } }))
  expect((await falla(new ModeloDeepSeek('k', buscar).completar(consulta))).reintentarEnMs).toBe(2000)
})

test('sin red es una falla transitoria', async () => {
  const { buscar } = fetchFalso(() => Promise.reject(new TypeError('fetch failed')))
  expect((await falla(new ModeloDeepSeek('k', buscar).completar(consulta))).motivo).toBe('sin-conexion')
})

test('si tarda de más, se corta como proveedor caído', async () => {
  const { buscar } = fetchFalso(() => Promise.reject(new DOMException('tardó', 'TimeoutError')))
  expect((await falla(new ModeloDeepSeek('k', buscar).completar(consulta))).motivo).toBe('proveedor-caido')
})

test('sin key en el entorno no hay modelo', () => {
  expect(modeloDesdeEntorno({})).toBeNull()
  expect(modeloDesdeEntorno({ DEEPSEEK_API_KEY: '  ' })).toBeNull()
  expect(modeloDesdeEntorno({ DEEPSEEK_API_KEY: 'k' })).toBeInstanceOf(ModeloDeepSeek)
})
