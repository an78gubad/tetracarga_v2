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
