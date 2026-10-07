import { aListo, faltantes, type Faltante } from '../dominio/item'
import type { Contenedor, Item, ItemListo } from '../dominio/tipos'
import { consolidar, type Consolidacion } from './consolidar'

export interface FaltanteDeItem extends Faltante {
  readonly item: string
}

export type Preparacion =
  | { readonly estado: 'vacia' }
  /** Bloqueada hasta que el usuario complete lo que falta (RF-03). */
  | { readonly estado: 'faltan'; readonly faltantes: readonly FaltanteDeItem[] }
  | { readonly estado: 'lista'; readonly items: readonly ItemListo[]; readonly consolidacion: Consolidacion }

/** Consolida solo si ningún ítem tiene datos faltantes. */
export function preparar(items: readonly Item[], contenedor: Contenedor): Preparacion {
  if (items.length === 0) return { estado: 'vacia' }
  const pendientes = items.flatMap((item) => faltantes(item).map((faltante) => ({ ...faltante, item: item.id })))
  if (pendientes.length > 0) return { estado: 'faltan', faltantes: pendientes }
  const listos = items.map((item) => aListo(item)!)
  return { estado: 'lista', items: listos, consolidacion: consolidar(listos, contenedor) }
}
