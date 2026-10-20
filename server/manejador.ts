import type { Item } from '../src/dominio/tipos.js'
import type { Opciones } from './consultar.js'
import { interpretar } from './interpretar.js'
import type { Modelo, MotivoDeFalla } from './modelo.js'

/** Más que esto se rechaza sin llamar al proveedor (RNF-09, AC-25). */
export const MAX_CARACTERES = 2000

export type CuerpoDeRespuesta =
  | { readonly tipo: 'interpretada'; readonly items: readonly Item[] }
  | { readonly tipo: 'rechazada'; readonly mensaje: string }
  | { readonly tipo: 'sin-interpretacion'; readonly mensaje: string }
  | { readonly tipo: 'falla-del-proveedor'; readonly motivo: MotivoDeFalla; readonly mensaje: string }
  | { readonly tipo: 'sin-configurar'; readonly mensaje: string }

export interface RespuestaDelProxy {
  readonly estado: number
  readonly cuerpo: CuerpoDeRespuesta
}

// En castellano los números de cuatro cifras no se agrupan salvo que se pida: "2.000", no "2000".
const formatoMiles = new Intl.NumberFormat('es-AR', { useGrouping: 'always' })

const rechazar = (estado: number, mensaje: string): RespuestaDelProxy => ({ estado, cuerpo: { tipo: 'rechazada', mensaje } })

/**
 * El proxy de RNF-07: recibe el cuerpo crudo del pedido y devuelve estado y cuerpo. No sabe de
 * Vercel ni de Vite. El modelo se pide recién cuando el pedido pasó todos los controles: uno
 * rechazado no llega al proveedor (AC-25).
 */
export async function manejar(
  cuerpoCrudo: string,
  obtenerModelo: () => Modelo | null,
  opciones: Opciones = {},
): Promise<RespuestaDelProxy> {
  let pedido: unknown
  try {
    pedido = JSON.parse(cuerpoCrudo)
  } catch {
    return rechazar(400, 'El pedido no es JSON.')
  }
  const descripcion = (pedido as { descripcion?: unknown } | null)?.descripcion
  if (typeof descripcion !== 'string') return rechazar(400, 'Falta la descripción de la carga.')
  if (descripcion.trim() === '') return rechazar(400, 'La descripción está vacía.')
  // Por caracteres y no por unidades de UTF-16: un emoji cuenta uno.
  const caracteres = [...descripcion].length
  if (caracteres > MAX_CARACTERES) {
    return rechazar(
      413,
      `La descripción tiene ${formatoMiles.format(caracteres)} caracteres y el límite es ${formatoMiles.format(MAX_CARACTERES)}.`,
    )
  }

  const modelo = obtenerModelo()
  if (!modelo) {
    return {
      estado: 500,
      cuerpo: { tipo: 'sin-configurar', mensaje: 'El servidor no tiene configurado el acceso al modelo.' },
    }
  }

  const resultado = await interpretar(modelo, descripcion, opciones)
  switch (resultado.tipo) {
    case 'interpretada':
      return { estado: 200, cuerpo: { tipo: 'interpretada', items: resultado.valor } }
    case 'sin-interpretacion':
      return {
        estado: 422,
        cuerpo: {
          tipo: 'sin-interpretacion',
          mensaje: 'No se pudo interpretar la descripción. Probá escribirla de otra forma o cargá los ítems a mano.',
        },
      }
    case 'falla-del-proveedor':
      return {
        estado: resultado.transitoria ? 503 : 502,
        cuerpo: {
          tipo: 'falla-del-proveedor',
          motivo: resultado.motivo,
          mensaje: resultado.transitoria
            ? 'El servicio que interpreta la descripción no responde. Probá de nuevo en un rato.'
            : 'El servicio que interpreta la descripción no está disponible.',
        },
      }
  }
}
