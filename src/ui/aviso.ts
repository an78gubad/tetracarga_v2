import { faltantes } from '../dominio/item'
import type { Item } from '../dominio/tipos'

/**
 * Qué agregó la descripción, contado con la lista de ahora: cuando el usuario completa o elimina,
 * el aviso deja de pedir lo que ya no falta.
 */
export function resumen(agregados: readonly string[], items: readonly Item[]): string {
  const cuantos = agregados.length === 1 ? 'Agregué 1 ítem a la carga.' : `Agregué ${agregados.length} ítems a la carga.`
  const ids = new Set(agregados)
  const conFaltantes = items.filter((item) => ids.has(item.id) && faltantes(item).length > 0).length
  if (conFaltantes === 0) return cuantos
  return `${cuantos} ${conFaltantes === 1 ? 'A uno le faltan datos' : `A ${conFaltantes} les faltan datos`}: están marcados en rojo.`
}
