import { FallaDelProveedor, type Consulta, type Modelo, type MotivoDeFalla } from './modelo.js'

export const URL_DEEPSEEK = 'https://api.deepseek.com/chat/completions'
/** El recomendado por DeepSeek; el razonamiento va apagado para no pasar el tiempo de RNF-01. */
export const MODELO_DEEPSEEK = 'deepseek-flash'
/** Más que esto ya no cumple RNF-01: se corta y cuenta como proveedor caído. */
const TIEMPO_MAXIMO_MS = 15_000

/** Según la tabla de códigos de error de DeepSeek: 429, 500 y 503 piden reintentar después. */
function motivoDelEstado(estado: number): MotivoDeFalla {
  if (estado === 401) return 'credenciales-invalidas'
  if (estado === 402) return 'saldo-agotado'
  if (estado === 429) return 'limite-de-velocidad'
  if (estado >= 500) return 'proveedor-caido'
  return 'pedido-rechazado'
}

/** Retry-After en segundos, si el proveedor lo manda. */
function esperaPedida(encabezados: Headers): number | undefined {
  const segundos = Number(encabezados.get('retry-after'))
  return Number.isFinite(segundos) && segundos > 0 ? segundos * 1000 : undefined
}

interface RespuestaDeDeepSeek {
  readonly choices?: readonly { readonly message?: { readonly content?: string | null } }[]
}

/** DeepSeek detrás de la interfaz de RNF-08. Solo corre en el servidor: la key nunca sale de acá (RNF-07). */
export class ModeloDeepSeek implements Modelo {
  constructor(
    private readonly apiKey: string,
    private readonly buscar: typeof fetch = fetch,
  ) {}

  async completar({ sistema, usuario, maxTokens }: Consulta): Promise<string> {
    let respuesta: Response
    try {
      respuesta = await this.buscar(URL_DEEPSEEK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: MODELO_DEEPSEEK,
          messages: [
            { role: 'system', content: sistema },
            { role: 'user', content: usuario },
          ],
          thinking: { type: 'disabled' },
          response_format: { type: 'json_object' },
          max_tokens: maxTokens,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') throw new FallaDelProveedor('proveedor-caido')
      throw new FallaDelProveedor('sin-conexion')
    }
    if (!respuesta.ok) throw new FallaDelProveedor(motivoDelEstado(respuesta.status), esperaPedida(respuesta.headers))
    let datos: RespuestaDeDeepSeek
    try {
      datos = (await respuesta.json()) as RespuestaDeDeepSeek
    } catch {
      // Un 200 que no es JSON se trata como una respuesta vacía: se vuelve a preguntar.
      return ''
    }
    // Sin contenido es la respuesta vacía de AC-20; un JSON cortado por max_tokens lo descarta el esquema.
    return datos.choices?.[0]?.message?.content ?? ''
  }
}

/** El modelo configurado en el entorno del servidor, o null si falta la key. */
export function modeloDesdeEntorno(entorno: Readonly<Record<string, string | undefined>>): Modelo | null {
  const apiKey = entorno.DEEPSEEK_API_KEY?.trim()
  return apiKey ? new ModeloDeepSeek(apiKey) : null
}
