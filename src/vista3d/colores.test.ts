import { expect, test } from 'vitest'
import { asignarColores, color, PALETA } from './colores'

test('AC-09: el mismo conjunto de ítems conserva sus colores al consolidar de nuevo', () => {
  const primera = asignarColores(new Map(), ['caja', 'tambor', 'pallet'])
  expect(asignarColores(primera, ['caja', 'tambor', 'pallet'])).toEqual(primera)
})

test('AC-09: eliminar un ítem no cambia el color de los demás', () => {
  const antes = asignarColores(new Map(), ['caja', 'tambor', 'pallet'])
  const despues = asignarColores(antes, ['caja', 'pallet'])
  expect(despues.get('caja')).toBe(antes.get('caja'))
  expect(despues.get('pallet')).toBe(antes.get('pallet'))
})

test('un ítem nuevo toma el primer color libre, sin pisar los que están en uso', () => {
  const antes = asignarColores(new Map(), ['caja', 'tambor', 'pallet'])
  const despues = asignarColores(antes, ['caja', 'pallet', 'bidon', 'ibc'])
  expect(despues.get('bidon')).toBe(antes.get('tambor'))
  expect(new Set(despues.values()).size).toBe(4)
})

test('el color sale del id aunque cambie el orden de la lista', () => {
  const antes = asignarColores(new Map(), ['caja', 'tambor'])
  expect(asignarColores(antes, ['tambor', 'caja'])).toEqual(antes)
})

// CIE76 sobre Lab con iluminante D65. Por encima de ~20 la diferencia se ve sin buscarla.
function lab(hex: string): [number, number, number] {
  const lineal = (canal: number) => {
    const c = canal / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = [1, 3, 5].map((inicio) => lineal(parseInt(hex.slice(inicio, inicio + 2), 16))) as [number, number, number]
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

function diferencia(a: string, b: string): number {
  const [la, aa, ba] = lab(a)
  const [lb, ab, bb] = lab(b)
  return Math.hypot(la - lb, aa - ab, ba - bb)
}

test('AC-09: con dos tipos, los dos colores se distinguen', () => {
  const asignacion = asignarColores(new Map(), ['caja', 'tambor'])
  expect(diferencia(color(asignacion.get('caja')!), color(asignacion.get('tambor')!))).toBeGreaterThan(20)
})

test('dos colores cualesquiera de la paleta se distinguen', () => {
  for (const [i, a] of PALETA.entries()) {
    for (const b of PALETA.slice(i + 1)) expect(diferencia(a, b), `${a} y ${b}`).toBeGreaterThan(20)
  }
})
