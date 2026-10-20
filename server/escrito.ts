import type { ItemDelModelo, Longitud, Peso } from './esquema.js'

/**
 * Los números escritos en la descripción. "1,5" y "1.5" valen 1,5; "1.200" vale también 1200, por
 * si el punto separa miles. "60x40x30" da 60, 40 y 30.
 */
export function numerosEscritos(texto: string): number[] {
  return [...texto.matchAll(/\d+(?:[.,]\d+)*/g)].flatMap(([numero]) => {
    const decimal = Number(numero.replace(',', '.'))
    const sinMiles = Number(numero.replace(/[.,]/g, ''))
    return [decimal, sinMiles].filter(Number.isFinite)
  })
}

/** "un" o "una" sueltos, en singular, son cantidad 1. */
const UNIDAD = /(^|[^\p{L}])(un|una)(?=[^\p{L}]|$)/iu

/**
 * Descarta los valores que el modelo dice haber copiado y no están escritos en la descripción. El
 * modelo a veces "sabe" las medidas de un europallet y las devuelve como si el usuario las hubiera
 * dicho: eso es completar desde fuera del catálogo (RF-03, RNF-02 b), y no se evita con el prompt.
 * Lo descartado queda en null: se completa desde el catálogo, marcado como estimado, o se pregunta.
 */
export function soloLoEscrito(item: ItemDelModelo, descripcion: string): ItemDelModelo {
  const numeros = numerosEscritos(descripcion)
  const escrito = (valor: number) => numeros.some((numero) => Math.abs(numero - valor) < 1e-9)
  const longitud = (medida: Longitud | null) => (medida !== null && escrito(medida.valor) ? medida : null)
  const peso = (dato: Peso | null) => (dato !== null && escrito(dato.valor) ? dato : null)
  const cantidad =
    item.cantidad !== null && (escrito(item.cantidad) || (item.cantidad === 1 && UNIDAD.test(descripcion)))
      ? item.cantidad
      : null
  return {
    ...item,
    cantidad,
    largo: longitud(item.largo),
    ancho: longitud(item.ancho),
    alto: longitud(item.alto),
    peso: peso(item.peso),
  }
}
