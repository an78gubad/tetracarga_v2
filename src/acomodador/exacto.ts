// Pesos repartidos en fracciones exactas de gramo. Duplica a propósito las cuentas del
// validador: si compartieran código, no podría detectar errores del acomodador (RF-08).

export interface Exacto {
  readonly n: bigint
  readonly d: bigint
}

const divisorComun = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : divisorComun(b, a % b))

function simplificar(n: bigint, d: bigint): Exacto {
  const g = divisorComun(n, d)
  return g > 1n ? { n: n / g, d: d / g } : { n, d }
}

export const NADA: Exacto = { n: 0n, d: 1n }

export const gramosExactos = (gramos: number): Exacto => ({ n: BigInt(gramos), d: 1n })

export const mas = (a: Exacto, b: Exacto): Exacto => simplificar(a.n * b.d + b.n * a.d, a.d * b.d)

export const parte = (a: Exacto, area: number, areaTotal: number): Exacto =>
  simplificar(a.n * BigInt(area), a.d * BigInt(areaTotal))

export const pasaDe = (a: Exacto, gramos: number): boolean => a.n > BigInt(gramos) * a.d
