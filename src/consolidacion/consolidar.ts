import { acomodar } from '../acomodador/acomodar'
import type { BultoAfuera, Contenedor, Disposicion, ItemListo, Kilos } from '../dominio/tipos'
import { validar, type Violacion } from '../validador/validar'

export interface InformeDeItem {
  readonly item: string
  readonly colocados: number
  readonly afueraPorPeso: number
  readonly afueraPorVolumen: number
}

/** Aprovechamiento y destino de cada bulto (RF-09). */
export interface Informe {
  /** Volumen colocado sobre el volumen interno del contenedor, de 0 a 1. */
  readonly aprovechamientoDeVolumen: number
  /** Peso colocado sobre la carga útil, de 0 a 1. */
  readonly aprovechamientoDePeso: number
  readonly pesoColocado: Kilos
  readonly bultosColocados: number
  readonly afuera: readonly BultoAfuera[]
  readonly porItem: readonly InformeDeItem[]
}

export type Consolidacion =
  | { readonly valida: true; readonly disposicion: Disposicion; readonly informe: Informe }
  /** El validador la rechazó: no se muestra ni se guarda (RNF-03). */
  | { readonly valida: false; readonly violaciones: readonly Violacion[] }

type Acomodador = (items: readonly ItemListo[], contenedor: Contenedor) => Disposicion

export function informar(disposicion: Disposicion, items: readonly ItemListo[], contenedor: Contenedor): Informe {
  const porId = new Map(items.map((item) => [item.id, item]))
  let volumen = 0
  let gramos = 0
  for (const bulto of disposicion.colocados) {
    const item = porId.get(bulto.item)!
    volumen += item.largo * item.ancho * item.alto
    gramos += Math.round(item.peso * 1000)
  }
  const pesoColocado = gramos / 1000
  return {
    aprovechamientoDeVolumen: volumen / (contenedor.largo * contenedor.ancho * contenedor.alto),
    aprovechamientoDePeso: pesoColocado / contenedor.cargaUtil,
    pesoColocado,
    bultosColocados: disposicion.colocados.length,
    afuera: disposicion.afuera,
    porItem: items.map((item) => ({
      item: item.id,
      colocados: disposicion.colocados.filter((bulto) => bulto.item === item.id).length,
      afueraPorPeso: disposicion.afuera.filter((bulto) => bulto.item === item.id && bulto.motivo === 'peso').length,
      afueraPorVolumen: disposicion.afuera.filter((bulto) => bulto.item === item.id && bulto.motivo === 'volumen').length,
    })),
  }
}

/** Acomoda y valida; solo una disposición que pasa el validador llega a mostrarse (RNF-03). */
export function consolidar(
  items: readonly ItemListo[],
  contenedor: Contenedor,
  acomodador: Acomodador = acomodar,
): Consolidacion {
  const disposicion = acomodador(items, contenedor)
  const violaciones = validar(disposicion, items, contenedor)
  if (violaciones.length > 0) return { valida: false, violaciones }
  return { valida: true, disposicion, informe: informar(disposicion, items, contenedor) }
}
