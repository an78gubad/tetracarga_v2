const entero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 })
const porciento = new Intl.NumberFormat('es-AR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
// En un campo editable, sin separador de miles: "1.000" se leería como uno.
const editable = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3, useGrouping: false })
const metros = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatoEntero = (valor: number) => entero.format(valor)
export const formatoDecimal = (valor: number) => decimal.format(valor)
export const formatoEditable = (valor: number) => editable.format(valor)
export const formatoPorciento = (fraccion: number) => porciento.format(fraccion)
export const formatoMetros = (milimetros: number) => metros.format(milimetros / 1000)

/** Lee un número escrito con coma o punto decimal; null si no es un número. */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '' || !/^\d+(\.\d+)?$/.test(limpio)) return null
  return Number(limpio)
}
