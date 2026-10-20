/**
 * El acceso al modelo pasa por esta interfaz (RNF-08): cambiar de proveedor es escribir otra
 * implementación. No sabe de prompts ni de ítems: recibe los mensajes armados y devuelve el texto
 * de la respuesta tal cual.
 */
export interface Modelo {
  completar(consulta: Consulta): Promise<string>
}

export interface Consulta {
  readonly sistema: string
  readonly usuario: string
  /** Tope de la respuesta, para acotar el costo de cada pedido (RNF-09). */
  readonly maxTokens: number
}

export type MotivoDeFalla =
  | 'limite-de-velocidad'
  | 'proveedor-caido'
  | 'sin-conexion'
  | 'credenciales-invalidas'
  | 'saldo-agotado'
  | 'pedido-rechazado'

/** Un límite de velocidad es transitorio; credenciales inválidas o saldo agotado no lo son (RNF-08). */
const TRANSITORIAS: ReadonlySet<MotivoDeFalla> = new Set(['limite-de-velocidad', 'proveedor-caido', 'sin-conexion'])

/**
 * El proveedor no pudo contestar. Es otra cosa que una respuesta que no se puede interpretar: esa
 * llega bien y la descarta quien la lee.
 */
export class FallaDelProveedor extends Error {
  readonly transitoria: boolean

  constructor(
    readonly motivo: MotivoDeFalla,
    /** Cuánto pide esperar el proveedor antes de reintentar, si lo dice. */
    readonly reintentarEnMs?: number,
  ) {
    super(`Falla del proveedor del modelo: ${motivo}`)
    this.name = 'FallaDelProveedor'
    this.transitoria = TRANSITORIAS.has(motivo)
  }
}
