import type { CuerpoDeRespuesta } from '../dominio/interpretacion'

/** Lo que contestó el proxy, o que no hubo respuesta que se pudiera leer. */
export type ResultadoDelPedido = CuerpoDeRespuesta | { readonly tipo: 'sin-respuesta'; readonly mensaje: string }

const TIPOS: ReadonlySet<string> = new Set(['interpretada', 'rechazada', 'sin-interpretacion', 'falla-del-proveedor', 'sin-configurar'])

const SIN_RESPUESTA: ResultadoDelPedido = {
  tipo: 'sin-respuesta',
  mensaje: 'No se pudo hablar con el servidor. Revisá la conexión y probá de nuevo.',
}

/**
 * Manda la descripción al proxy propio (RNF-07): el navegador no conoce al proveedor ni la key.
 * Cualquier respuesta que no sea del contrato, como una página de error, cuenta como sin respuesta.
 */
export async function pedirInterpretacion(descripcion: string, buscar: typeof fetch = fetch): Promise<ResultadoDelPedido> {
  try {
    const respuesta = await buscar('/api/interpretar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion }),
    })
    const cuerpo = (await respuesta.json()) as { tipo?: unknown; items?: unknown }
    if (typeof cuerpo?.tipo !== 'string' || !TIPOS.has(cuerpo.tipo)) return SIN_RESPUESTA
    if (cuerpo.tipo === 'interpretada' && !Array.isArray(cuerpo.items)) return SIN_RESPUESTA
    return cuerpo as CuerpoDeRespuesta
  } catch {
    return SIN_RESPUESTA
  }
}
