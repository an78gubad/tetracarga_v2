import type { Disposicion, ItemListo } from '../dominio/tipos'

/** Un bulto listo para dibujar, en metros y con los ejes de Three.js: y es el alto. */
export interface Instancia {
  readonly centro: readonly [number, number, number]
  readonly tamano: readonly [number, number, number]
  /** Posición del bulto en la secuencia de carga. */
  readonly orden: number
}

export interface GrupoDeInstancias {
  readonly item: ItemListo
  /** En orden de carga, para mostrar un prefijo de la secuencia con solo cortar la lista. */
  readonly instancias: readonly Instancia[]
}

const METROS = 1 / 1000

/**
 * Un grupo por tipo de ítem: cada uno se dibuja con una sola malla instanciada, así el costo
 * crece con los tipos y no con los bultos (RNF-06). RF-07 tiene x hacia la puerta, y el ancho y
 * z el alto; en Three.js el alto es y. El paso es una rotación sobre x, no un cruce de ejes, que
 * reflejaría la escena: el ancho de RF-07 va hacia -z.
 */
export function agrupar(disposicion: Disposicion, items: readonly ItemListo[]): GrupoDeInstancias[] {
  const porId = new Map(items.map((item) => [item.id, item]))
  const grupos = new Map<string, Instancia[]>(items.map((item) => [item.id, []]))
  disposicion.colocados.forEach((bulto, orden) => {
    const item = porId.get(bulto.item)
    if (!item) return
    const [dx, dy, dz] = bulto.orientacion.map((medida) => item[medida]) as [number, number, number]
    grupos.get(item.id)!.push({
      centro: [(bulto.x + dx / 2) * METROS, (bulto.z + dz / 2) * METROS, -(bulto.y + dy / 2) * METROS],
      tamano: [dx * METROS, dz * METROS, dy * METROS],
      orden,
    })
  })
  return items.map((item) => ({ item, instancias: grupos.get(item.id)! }))
}
