import type { EntradaObjeto } from '../src/catalogo/objetos.js'
import type { Campo, Item, Kilos, Marca, Milimetros } from '../src/dominio/tipos.js'
import type { ItemDelModelo, Longitud, Peso } from './esquema.js'

const MILIMETROS_POR: Record<NonNullable<Longitud['unidad']>, number> = { mm: 1, cm: 10, m: 1000 }
const KILOS_POR: Record<NonNullable<Peso['unidad']>, number> = { g: 0.001, kg: 1, t: 1000 }

/** Una medida sin unidad está en centímetros (RF-02); las longitudes son milímetros enteros (RF-07). */
export function aMilimetros({ valor, unidad }: Longitud): Milimetros {
  return Math.round(valor * MILIMETROS_POR[unidad ?? 'cm'])
}

/** Hasta el gramo, para que dividir un peso total no deje decimales infinitos. */
const redondearKilos = (kilos: number): Kilos => Math.round(kilos * 1000) / 1000

/**
 * Peso unitario en kilos. Un peso de todo el ítem se divide por la cantidad (RF-02); sin
 * cantidad no hay cómo dividirlo, y el peso queda por preguntar.
 */
export function pesoUnitario({ valor, unidad, alcance }: Peso, cantidad: number | null): Kilos | null {
  const kilos = valor * KILOS_POR[unidad ?? 'kg']
  if (alcance === 'unitario') return redondearKilos(kilos)
  return cantidad === null ? null : redondearKilos(kilos / cantidad)
}

/**
 * Lo declarado manda; lo que falta sale únicamente del catálogo, marcado como estimado con la
 * entrada que lo dio (RF-03). Si no hay entrada, o la entrada no trae el dato, queda faltante con
 * su motivo.
 */
function completar<T>(declarado: T | null, entrada: EntradaObjeto | null, delCatalogo: T | null): Campo<T> {
  if (declarado !== null) return { origen: 'declarado', valor: declarado }
  if (entrada === null) return { origen: 'faltante', motivo: 'sin-entrada' }
  if (delCatalogo === null) return { origen: 'faltante', motivo: 'entrada-sin-dato' }
  return { origen: 'estimado', valor: delCatalogo, entrada: entrada.id }
}

/** Las marcas de RF-06 se precargan si la entrada las trae; si no, arrancan apagadas. */
function marcar(entrada: EntradaObjeto | null, delCatalogo: boolean | null): Marca {
  if (entrada === null || delCatalogo === null) return { origen: 'declarado', valor: false }
  return { origen: 'estimado', valor: delCatalogo, entrada: entrada.id }
}

/** El ítem del modelo, con unidades resueltas y completado solo desde el catálogo. */
export function aItem(
  delModelo: ItemDelModelo,
  catalogo: ReadonlyMap<string, EntradaObjeto>,
  id: string,
): Item {
  const entrada = delModelo.entrada === null ? null : (catalogo.get(delModelo.entrada) ?? null)
  const medida = (longitud: Longitud | null) => (longitud === null ? null : aMilimetros(longitud))
  const peso = delModelo.peso === null ? null : pesoUnitario(delModelo.peso, delModelo.cantidad)
  return {
    id,
    nombre: delModelo.nombre.trim(),
    // La cantidad nunca se completa: si falta, se pregunta (RF-03, AC-22).
    cantidad:
      delModelo.cantidad === null
        ? { origen: 'faltante', motivo: 'no-declarado' }
        : { origen: 'declarado', valor: delModelo.cantidad },
    largo: completar(medida(delModelo.largo), entrada, entrada?.largo ?? null),
    ancho: completar(medida(delModelo.ancho), entrada, entrada?.ancho ?? null),
    alto: completar(medida(delModelo.alto), entrada, entrada?.alto ?? null),
    // Un peso total sin cantidad se declaró, pero no se puede dividir: se pregunta, no se completa.
    peso:
      delModelo.peso !== null && peso === null
        ? { origen: 'faltante', motivo: 'no-declarado' }
        : completar(peso, entrada, entrada?.peso ?? null),
    noApilable: marcar(entrada, entrada?.noApilable ?? null),
    orientacionObligatoria: marcar(entrada, entrada?.orientacionObligatoria ?? null),
    // Lo declara siempre el usuario (RF-06).
    pesoMaximoEncima: null,
  }
}
