/** Cuánto dura la caída de un bulto al colocarlo, y desde qué altura sobre su lugar cae. */
export const DURACION_DE_CAIDA_MS = 260
export const ALTURA_DE_CAIDA_M = 1.2
/** Entre bulto y bulto al reproducir la secuencia. */
export const PASO_DE_REPRODUCCION_MS = 140

/**
 * Cuánto le falta caer a un bulto, en metros, a `ms` de empezar: arranca lento y acelera, como en
 * el Tetris. Pasada la duración, cero: el bulto queda en su lugar.
 */
export function alturaDeCaida(ms: number): number {
  const t = Math.min(Math.max(ms / DURACION_DE_CAIDA_MS, 0), 1)
  return ALTURA_DE_CAIDA_M * (1 - t * t)
}
