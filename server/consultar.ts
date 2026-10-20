import { FallaDelProveedor, type Consulta, type Modelo, type MotivoDeFalla } from './modelo.js'

/** Entre fallas transitorias y respuestas que no se pueden leer, como mucho tantas llamadas. */
export const MAX_INTENTOS = 3

const ESPERA_INICIAL_MS = 1000
const ESPERA_MAXIMA_MS = 4000

export type Resultado<T> =
  | { readonly tipo: 'interpretada'; readonly valor: T; readonly intentos: number }
  /** El proveedor no contestó: no es un error de interpretación (RNF-08). */
  | {
      readonly tipo: 'falla-del-proveedor'
      readonly motivo: MotivoDeFalla
      readonly transitoria: boolean
      readonly intentos: number
    }
  /** El proveedor contestó, pero ninguna respuesta se pudo leer. */
  | { readonly tipo: 'sin-interpretacion'; readonly intentos: number }

export interface Opciones {
  readonly esperar?: (ms: number) => Promise<void>
}

const dormir = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms))

/**
 * Llama al modelo y lee la respuesta con `leer`, que devuelve null si no la puede usar. Una
 * respuesta vacía o ilegible se vuelve a preguntar enseguida; una falla transitoria se reintenta
 * después de esperar; una falla definitiva corta sin reintentar. Todo dentro de MAX_INTENTOS
 * (AC-20, AC-26).
 */
export async function consultar<T>(
  modelo: Modelo,
  consulta: Consulta,
  leer: (respuesta: string) => T | null,
  { esperar = dormir }: Opciones = {},
): Promise<Resultado<T>> {
  let ultimaFalla: FallaDelProveedor | null = null
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    let respuesta: string
    try {
      respuesta = await modelo.completar(consulta)
    } catch (error) {
      if (!(error instanceof FallaDelProveedor)) throw error
      if (!error.transitoria) {
        return { tipo: 'falla-del-proveedor', motivo: error.motivo, transitoria: false, intentos: intento }
      }
      ultimaFalla = error
      if (intento < MAX_INTENTOS) {
        await esperar(Math.min(error.reintentarEnMs ?? ESPERA_INICIAL_MS * 2 ** (intento - 1), ESPERA_MAXIMA_MS))
      }
      continue
    }
    ultimaFalla = null
    const valor = respuesta.trim() === '' ? null : leer(respuesta)
    if (valor !== null) return { tipo: 'interpretada', valor, intentos: intento }
  }
  // Manda lo que pasó en el último intento: si el proveedor terminó fallando, es falla suya.
  if (ultimaFalla) {
    return { tipo: 'falla-del-proveedor', motivo: ultimaFalla.motivo, transitoria: true, intentos: MAX_INTENTOS }
  }
  return { tipo: 'sin-interpretacion', intentos: MAX_INTENTOS }
}
