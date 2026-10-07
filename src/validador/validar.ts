import type { Bulto, Contenedor, Disposicion, ItemListo, Kilos, Medida } from '../dominio/tipos'
import { CERO, entera, proporcion, sumar, superaA, type Fraccion } from './fraccion'

// RF-08. No comparte código con el acomodador, ni siquiera constantes: si compartieran, no
// podría detectar sus errores.

export type TipoViolacion =
  | 'contenedor-distinto'
  | 'bulto-desconocido'
  | 'bulto-repetido'
  | 'bulto-sin-destino'
  | 'orientacion-invalida'
  | 'posicion-no-entera'
  | 'fuera-del-contenedor'
  | 'superposicion'
  | 'sin-apoyo'
  | 'orientacion-obligatoria'
  | 'apilado-sobre-no-apilable'
  | 'peso-encima'
  | 'carga-maxima'

export interface Violacion {
  readonly tipo: TipoViolacion
  /** Posición en la secuencia de carga del bulto en falta, si es uno colocado. */
  readonly posicion?: number
  /** Posición del otro bulto involucrado, si hay uno. */
  readonly otra?: number
  readonly bulto?: Bulto
}

interface Caja {
  readonly posicion: number
  readonly item: ItemListo
  readonly x0: number
  readonly y0: number
  readonly z0: number
  readonly x1: number
  readonly y1: number
  readonly z1: number
}

const APOYO_MINIMO_NUMERADOR = 4
const APOYO_MINIMO_DENOMINADOR = 5

/** Kilos a gramos enteros: las sumas de pesos con decimales quedan exactas. */
const gramos = (kilos: Kilos) => Math.round(kilos * 1000)

const solapan = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1

function areaDeContacto(arriba: Caja, abajo: Caja): number {
  const dx = Math.min(arriba.x1, abajo.x1) - Math.max(arriba.x0, abajo.x0)
  const dy = Math.min(arriba.y1, abajo.y1) - Math.max(arriba.y0, abajo.y0)
  return dx > 0 && dy > 0 ? dx * dy : 0
}

function esPermutacion(orientacion: readonly Medida[]): boolean {
  return (
    orientacion.length === 3 &&
    orientacion.includes('largo') &&
    orientacion.includes('ancho') &&
    orientacion.includes('alto')
  )
}

/** Todo lo que hace inválida a la disposición; vacío si se puede mostrar (RNF-03). */
export function validar(
  disposicion: Disposicion,
  items: readonly ItemListo[],
  contenedor: Contenedor,
): Violacion[] {
  const violaciones: Violacion[] = []
  if (disposicion.contenedor !== contenedor.id) violaciones.push({ tipo: 'contenedor-distinto' })

  const porId = new Map(items.map((item) => [item.id, item]))
  const vistos = new Set<string>()
  const registrar = (bulto: Bulto, posicion?: number): ItemListo | undefined => {
    const item = porId.get(bulto.item)
    if (!item || !Number.isInteger(bulto.indice) || bulto.indice < 0 || bulto.indice >= item.cantidad) {
      violaciones.push({ tipo: 'bulto-desconocido', posicion, bulto })
      return undefined
    }
    const clave = `${bulto.item}#${bulto.indice}`
    if (vistos.has(clave)) violaciones.push({ tipo: 'bulto-repetido', posicion, bulto })
    vistos.add(clave)
    return item
  }

  const cajas: Caja[] = []
  disposicion.colocados.forEach((colocado, posicion) => {
    const item = registrar(colocado, posicion)
    if (!item) return
    if (!esPermutacion(colocado.orientacion)) {
      violaciones.push({ tipo: 'orientacion-invalida', posicion })
      return
    }
    if (![colocado.x, colocado.y, colocado.z].every(Number.isInteger)) {
      violaciones.push({ tipo: 'posicion-no-entera', posicion })
    }
    if (item.orientacionObligatoria && colocado.orientacion[2] !== 'alto') {
      violaciones.push({ tipo: 'orientacion-obligatoria', posicion })
    }
    const [ejeX, ejeY, ejeZ] = colocado.orientacion
    const caja: Caja = {
      posicion,
      item,
      x0: colocado.x,
      y0: colocado.y,
      z0: colocado.z,
      x1: colocado.x + item[ejeX],
      y1: colocado.y + item[ejeY],
      z1: colocado.z + item[ejeZ],
    }
    if (
      caja.x0 < 0 ||
      caja.y0 < 0 ||
      caja.z0 < 0 ||
      caja.x1 > contenedor.largo ||
      caja.y1 > contenedor.ancho ||
      caja.z1 > contenedor.alto
    ) {
      violaciones.push({ tipo: 'fuera-del-contenedor', posicion })
    }
    cajas.push(caja)
  })
  for (const bulto of disposicion.afuera) registrar(bulto)
  for (const item of items) {
    for (let indice = 0; indice < item.cantidad; indice++) {
      if (!vistos.has(`${item.id}#${indice}`)) {
        violaciones.push({ tipo: 'bulto-sin-destino', bulto: { item: item.id, indice } })
      }
    }
  }

  for (let i = 0; i < cajas.length; i++) {
    for (let j = i + 1; j < cajas.length; j++) {
      const a = cajas[i]!
      const b = cajas[j]!
      if (solapan(a.x0, a.x1, b.x0, b.x1) && solapan(a.y0, a.y1, b.y0, b.y1) && solapan(a.z0, a.z1, b.z0, b.z1)) {
        violaciones.push({ tipo: 'superposicion', posicion: b.posicion, otra: a.posicion })
      }
    }
  }

  // Lo que toca la base de cada caja desde abajo, cargado antes o después.
  const debajo = new Map<Caja, { caja: Caja; area: number }[]>()
  for (const arriba of cajas) {
    const contactos = cajas.flatMap((abajo) => {
      if (abajo === arriba || abajo.z1 !== arriba.z0) return []
      const area = areaDeContacto(arriba, abajo)
      return area > 0 ? [{ caja: abajo, area }] : []
    })
    debajo.set(arriba, contactos)
  }

  // Apoyo: solo cuenta el piso o lo cargado antes, para que cada prefijo de la secuencia sea
  // estable (AC-24).
  for (const caja of cajas) {
    if (caja.z0 === 0) continue
    const apoyo = debajo
      .get(caja)!
      .filter(({ caja: abajo }) => abajo.posicion < caja.posicion)
      .reduce((total, { area }) => total + area, 0)
    const base = (caja.x1 - caja.x0) * (caja.y1 - caja.y0)
    if (apoyo * APOYO_MINIMO_DENOMINADOR < base * APOYO_MINIMO_NUMERADOR) {
      violaciones.push({ tipo: 'sin-apoyo', posicion: caja.posicion })
    }
  }

  for (const caja of cajas) {
    for (const { caja: abajo } of debajo.get(caja)!) {
      if (abajo.item.noApilable) {
        violaciones.push({ tipo: 'apilado-sobre-no-apilable', posicion: caja.posicion, otra: abajo.posicion })
      }
    }
  }

  // Peso encima (AC-06): cada caja pasa su peso más lo que carga a las que tiene debajo,
  // repartido en proporción al área de contacto. De arriba hacia abajo, así cada caja recibe
  // todo antes de repartir.
  const carga = new Map<Caja, Fraccion>(cajas.map((caja) => [caja, CERO]))
  for (const caja of [...cajas].sort((a, b) => b.z0 - a.z0)) {
    const contactos = debajo.get(caja)!
    const areaTotal = contactos.reduce((total, { area }) => total + area, 0)
    if (areaTotal === 0) continue
    const transmitido = sumar(carga.get(caja)!, entera(gramos(caja.item.peso)))
    for (const { caja: abajo, area } of contactos) {
      carga.set(abajo, sumar(carga.get(abajo)!, proporcion(transmitido, area, areaTotal)))
    }
  }
  for (const caja of cajas) {
    const maximo = caja.item.pesoMaximoEncima
    if (maximo !== null && superaA(carga.get(caja)!, gramos(maximo))) {
      violaciones.push({ tipo: 'peso-encima', posicion: caja.posicion })
    }
  }

  const pesoTotal = cajas.reduce((total, caja) => total + gramos(caja.item.peso), 0)
  if (pesoTotal > gramos(contenedor.cargaUtil)) violaciones.push({ tipo: 'carga-maxima' })

  return violaciones
}
