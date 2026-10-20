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

/** Valores por bulto en el arreglo de aristas: 12 aristas, 2 puntos cada una, 3 coordenadas. */
export const VALORES_POR_BULTO = 12 * 2 * 3

/**
 * Las aristas de todos los bultos en un solo arreglo, en orden de carga: separan a simple vista
 * dos bultos del mismo tipo dentro de una pila (RF-10), con un único draw call, y un prefijo de
 * la secuencia es un prefijo del arreglo.
 */
export function aristasDeBultos(grupos: readonly GrupoDeInstancias[]): Float32Array {
  const enOrden = grupos.flatMap((grupo) => grupo.instancias).sort((a, b) => a.orden - b.orden)
  const valores = new Float32Array(enOrden.length * VALORES_POR_BULTO)
  let i = 0
  for (const { centro, tamano } of enOrden) {
    const desde = centro.map((c, eje) => c - tamano[eje]! / 2)
    const hasta = centro.map((c, eje) => c + tamano[eje]! / 2)
    const esquina = (bits: number) => [0, 1, 2].map((eje) => ((bits >> eje) & 1 ? hasta[eje]! : desde[eje]!))
    // Cada arista une dos esquinas que difieren en un solo eje.
    for (let bits = 0; bits < 8; bits++) {
      for (const eje of [1, 2, 4]) {
        if (bits & eje) continue
        valores.set(esquina(bits), i)
        valores.set(esquina(bits | eje), i + 3)
        i += 6
      }
    }
  }
  return valores
}

/** Puntos por bulto en el arreglo de aristas, para acotar lo que se dibuja a un prefijo. */
export const PUNTOS_POR_BULTO = VALORES_POR_BULTO / 3

/**
 * Cuántas instancias de cada grupo entran en los primeros `visibles` bultos de la secuencia
 * (AC-08). Como cada grupo va en orden de carga, alcanza con dibujar las primeras de cada uno.
 */
export function cantidadesVisibles(grupos: readonly GrupoDeInstancias[], visibles: number): number[] {
  return grupos.map((grupo) => {
    const primeraOculta = grupo.instancias.findIndex((instancia) => instancia.orden >= visibles)
    return primeraOculta === -1 ? grupo.instancias.length : primeraOculta
  })
}
