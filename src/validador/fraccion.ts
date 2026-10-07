// Fracciones exactas para repartir peso proporcional al área de contacto: con punto flotante,
// una pila que suma justo el límite podría pasar o no según el orden de las cuentas.

export interface Fraccion {
  readonly num: bigint
  readonly den: bigint
}

function mcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a
  let y = b
  while (y !== 0n) [x, y] = [y, x % y]
  return x
}

function reducir(num: bigint, den: bigint): Fraccion {
  const divisor = mcd(num, den)
  return divisor > 1n ? { num: num / divisor, den: den / divisor } : { num, den }
}

export const CERO: Fraccion = { num: 0n, den: 1n }

export function entera(valor: number): Fraccion {
  return { num: BigInt(valor), den: 1n }
}

export function sumar(a: Fraccion, b: Fraccion): Fraccion {
  return reducir(a.num * b.den + b.num * a.den, a.den * b.den)
}

/** a × parte / todo, con parte y todo enteros. */
export function proporcion(a: Fraccion, parte: number, todo: number): Fraccion {
  return reducir(a.num * BigInt(parte), a.den * BigInt(todo))
}

export function superaA(a: Fraccion, limite: number): boolean {
  return a.num > BigInt(limite) * a.den
}
