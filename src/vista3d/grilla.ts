/** Lado de cada celda de la grilla del piso, en metros. */
export const PASO_DE_GRILLA = 0.5

/**
 * Las líneas de la grilla del piso, en metros y con los ejes de Three.js: el largo en x y el ancho
 * hacia -z. Solo las interiores: los bordes ya los dibujan las aristas del contenedor. Una sola
 * malla de líneas: un draw call fijo, que no crece con los bultos (RNF-06).
 */
export function lineasDeGrilla(largo: number, ancho: number, paso = PASO_DE_GRILLA, altura = 0.002): Float32Array {
  const valores: number[] = []
  for (let x = paso; x < largo - 1e-9; x += paso) valores.push(x, altura, 0, x, altura, -ancho)
  for (let z = paso; z < ancho - 1e-9; z += paso) valores.push(0, altura, -z, largo, altura, -z)
  return new Float32Array(valores)
}
