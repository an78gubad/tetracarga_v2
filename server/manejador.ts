import { contarCaracteres, MAX_CARACTERES, type CuerpoDeRespuesta } from '../src/dominio/interpretacion.js'
import type { Opciones } from './consultar.js'
import { interpretar } from './interpretar.js'
import type { Modelo } from './modelo.js'

export interface RespuestaDelProxy {
  readonly estado: number
  readonly cuerpo: CuerpoDeRespuesta
}

// "2.000" y no "2000" sin depender de los datos regionales: en "es" y "es-ES" cuatro cifras no se agrupan.
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
  const caracteres = contarCaracteres(descripcion)
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
