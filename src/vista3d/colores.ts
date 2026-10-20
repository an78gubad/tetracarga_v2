/**
 * Okabe-Ito sin el negro: siete colores pensados para distinguirse también con daltonismo. El
 * orden importa: con dos tipos salen los dos primeros, azul y naranja, los más opuestos.
 */
export const PALETA: readonly string[] = ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#56B4E9', '#CC79A7', '#F0E442']

/**
 * El color de cada ítem queda atado a su id y no a su posición en la lista (RF-10): los que siguen
 * en la lista conservan el suyo, y los nuevos toman el primero libre. Eliminar un ítem no corre
 * los colores de los demás (AC-09).
 */
export function asignarColores(previa: ReadonlyMap<string, number>, ids: readonly string[]): Map<string, number> {
  const asignacion = new Map<string, number>()
  for (const id of ids) {
    const indice = previa.get(id)
    if (indice !== undefined) asignacion.set(id, indice)
  }
  const usados = new Set(asignacion.values())
  let libre = 0
  for (const id of ids) {
    if (asignacion.has(id)) continue
    while (usados.has(libre)) libre++
    asignacion.set(id, libre)
    usados.add(libre)
  }
  return asignacion
}

/** Pasada la paleta, tonos separados por el ángulo áureo: ya no se garantiza que se distingan. */
export function color(indice: number): string {
  if (indice < PALETA.length) return PALETA[indice]!
  const tono = Math.round(((indice - PALETA.length) * 137.508) % 360)
  return `hsl(${tono}, 60%, 50%)`
}
