import type { Item } from './tipos.js'

/**
 * El contrato del proxy de interpretación, compartido entre el navegador y el servidor. Solo
 * tipos y el límite: nada de acá habla con el proveedor.
 */

/** Más que esto el proxy lo rechaza sin llamar al proveedor (RNF-09, AC-25). */
export const MAX_CARACTERES = 2000

/** Por caracteres y no por unidades de UTF-16: un emoji cuenta uno. */
export const contarCaracteres = (texto: string) => [...texto].length

export type MotivoDeFalla =
  | 'limite-de-velocidad'
  | 'proveedor-caido'
  | 'sin-conexion'
  | 'credenciales-invalidas'
  | 'saldo-agotado'
  | 'pedido-rechazado'

export type CuerpoDeRespuesta =
  | { readonly tipo: 'interpretada'; readonly items: readonly Item[] }
  | { readonly tipo: 'rechazada'; readonly mensaje: string }
  | { readonly tipo: 'sin-interpretacion'; readonly mensaje: string }
  | { readonly tipo: 'falla-del-proveedor'; readonly motivo: MotivoDeFalla; readonly mensaje: string }
  | { readonly tipo: 'sin-configurar'; readonly mensaje: string }
