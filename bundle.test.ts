import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { build, loadEnv, type Rolldown } from 'vite'
import { URL_DEEPSEEK } from './server/deepseek.js'

// AC-19 (RNF-07): el bundle del cliente no contiene la API key, ni la URL del proveedor, ni ningún
// encabezado de autorización. Busca los valores reales, no patrones como "sk-", que dan falsos
// positivos con el código de React. Arma su propio bundle en memoria: un dist/ puede estar viejo.

const VARIABLE = 'DEEPSEEK_API_KEY'
// Sin .env, como en CI, el build ve esta key: si el bundle filtrara el entorno, aparecería.
const CENTINELA = 'centinela-de-ac19-que-no-debe-llegar-al-bundle'

const claveDelEnv = loadEnv('production', process.cwd(), '')[VARIABLE]?.trim()
const anteriores = { clave: process.env[VARIABLE], entorno: process.env.NODE_ENV }
let bundle = ''

const restaurar = (nombre: string, valor: string | undefined) => {
  if (valor === undefined) delete process.env[nombre]
  else process.env[nombre] = valor
}

beforeAll(async () => {
  // Si hay key real, el build la lee del .env; si no, lee la centinela.
  if (!claveDelEnv) process.env[VARIABLE] = CENTINELA
  // Vitest define NODE_ENV=test y Vite lo respeta: sin esto saldría el bundle de desarrollo.
  process.env.NODE_ENV = 'production'
  const salida = (await build({ mode: 'production', logLevel: 'silent', build: { write: false } })) as
    | Rolldown.RolldownOutput
    | Rolldown.RolldownOutput[]
  bundle = [salida]
    .flat()
    .flatMap((parte) => parte.output)
    .map((archivo) => (archivo.type === 'chunk' ? archivo.code : String(archivo.source)))
    .join('\n')
}, 120_000)

afterAll(() => {
  restaurar(VARIABLE, anteriores.clave)
  restaurar('NODE_ENV', anteriores.entorno)
})

// Las comparaciones son booleanas: si algo se filtra, el test no vuelca el bundle ni la key al log.
const contiene = (texto: string | RegExp) => (typeof texto === 'string' ? bundle.includes(texto) : texto.test(bundle))

describe('AC-19: el bundle del cliente', () => {
  test('es el de producción, con el código de la aplicación', () => {
    // Sin esto, un bundle vacío o el de desarrollo pasarían todo lo de abajo.
    expect(contiene('/api/interpretar'), 'falta el código de la aplicación').toBe(true)
    expect(contiene('jsxDEV'), 'es el bundle de desarrollo').toBe(false)
  })

  test('no contiene la API key', () => {
    expect(contiene(claveDelEnv || CENTINELA), 'la key está en el bundle').toBe(false)
  })

  test('no contiene la URL del proveedor', () => {
    expect(contiene(URL_DEEPSEEK), 'la URL del proveedor está en el bundle').toBe(false)
    expect(contiene(new URL(URL_DEEPSEEK).host), 'el host del proveedor está en el bundle').toBe(false)
  })

  test('no contiene ningún encabezado de autorización', () => {
    expect(contiene(/authorization/i), 'hay un encabezado Authorization en el bundle').toBe(false)
    expect(contiene('Bearer '), 'hay un token Bearer en el bundle').toBe(false)
  })
})
