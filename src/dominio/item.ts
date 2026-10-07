import type { CampoFaltable, Item, ItemListo, MotivoFaltante } from './tipos'

const CAMPOS_FALTABLES: readonly CampoFaltable[] = ['cantidad', 'largo', 'ancho', 'alto', 'peso']

export interface Faltante {
  readonly campo: CampoFaltable
  readonly motivo: MotivoFaltante
}

/** Lo que hay que preguntarle al usuario; mientras no esté vacío, la consolidación queda bloqueada. */
export function faltantes(item: Item): Faltante[] {
  return CAMPOS_FALTABLES.flatMap((campo) => {
    const valor = item[campo]
    return valor.origen === 'faltante' ? [{ campo, motivo: valor.motivo }] : []
  })
}

/** El ítem con sus valores sueltos, o null si le falta algo. */
export function aListo(item: Item): ItemListo | null {
  const { cantidad, largo, ancho, alto, peso } = item
  if (
    cantidad.origen === 'faltante' ||
    largo.origen === 'faltante' ||
    ancho.origen === 'faltante' ||
    alto.origen === 'faltante' ||
    peso.origen === 'faltante'
  ) {
    return null
  }
  return {
    id: item.id,
    nombre: item.nombre,
    cantidad: cantidad.valor,
    largo: largo.valor,
    ancho: ancho.valor,
    alto: alto.valor,
    peso: peso.valor,
    noApilable: item.noApilable.valor,
    orientacionObligatoria: item.orientacionObligatoria.valor,
    pesoMaximoEncima: item.pesoMaximoEncima,
  }
}

/** Lo que edita el usuario queda declarado, aunque antes fuera estimado (RF-04). */
export function editar(item: Item, campo: CampoFaltable, valor: number): Item {
  return { ...item, [campo]: { origen: 'declarado', valor } }
}

export function marcar(item: Item, marca: 'noApilable' | 'orientacionObligatoria', valor: boolean): Item {
  return { ...item, [marca]: { origen: 'declarado', valor } }
}

/** Lo que el usuario borra pasa a faltar y hay que volver a preguntarlo. */
export function vaciar(item: Item, campo: CampoFaltable): Item {
  return { ...item, [campo]: { origen: 'faltante', motivo: 'no-declarado' } }
}

export function renombrar(item: Item, nombre: string): Item {
  return { ...item, nombre }
}

/** El peso máximo encima lo declara siempre el usuario (RF-06); null es sin límite. */
export function limitarPesoEncima(item: Item, kilos: number | null): Item {
  return { ...item, pesoMaximoEncima: kilos }
}

/** Un ítem agregado a mano: todo falta hasta que el usuario lo complete (RF-04). */
export function itemNuevo(id: string): Item {
  const falta = { origen: 'faltante', motivo: 'no-declarado' } as const
  return {
    id,
    nombre: '',
    cantidad: falta,
    largo: falta,
    ancho: falta,
    alto: falta,
    peso: falta,
    noApilable: { origen: 'declarado', valor: false },
    orientacionObligatoria: { origen: 'declarado', valor: false },
    pesoMaximoEncima: null,
  }
}

/** Un ítem con todos sus datos declarados, como los de un escenario. */
export function desdeListo(listo: ItemListo): Item {
  const declarado = <T,>(valor: T) => ({ origen: 'declarado', valor }) as const
  return {
    id: listo.id,
    nombre: listo.nombre,
    cantidad: declarado(listo.cantidad),
    largo: declarado(listo.largo),
    ancho: declarado(listo.ancho),
    alto: declarado(listo.alto),
    peso: declarado(listo.peso),
    noApilable: declarado(listo.noApilable),
    orientacionObligatoria: declarado(listo.orientacionObligatoria),
    pesoMaximoEncima: listo.pesoMaximoEncima,
  }
}
