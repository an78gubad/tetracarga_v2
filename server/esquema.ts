/**
 * Lo que el modelo tiene que devolver. Copia los valores como están escritos, con su unidad: las
 * cuentas (unidades, peso total ÷ cantidad) las hace el código, no el modelo (RF-02).
 */
export interface RespuestaDelModelo {
  readonly items: readonly ItemDelModelo[]
}

export interface ItemDelModelo {
  readonly nombre: string
  readonly cantidad: number | null
  readonly largo: Longitud | null
  readonly ancho: Longitud | null
  readonly alto: Longitud | null
  readonly peso: Peso | null
  /** Id de una entrada del catálogo, o null si ninguna corresponde. */
  readonly entrada: string | null
}

export const UNIDADES_DE_LONGITUD = ['mm', 'cm', 'm'] as const
export const UNIDADES_DE_PESO = ['kg', 'g', 't'] as const
export const ALCANCES_DEL_PESO = ['unitario', 'total'] as const

export interface Longitud {
  readonly valor: number
  /** null: la descripción no dice la unidad, y entonces son centímetros (RF-02). */
  readonly unidad: (typeof UNIDADES_DE_LONGITUD)[number] | null
}

export interface Peso {
  readonly valor: number
  /** null: la descripción no dice la unidad, y entonces son kilos. */
  readonly unidad: (typeof UNIDADES_DE_PESO)[number] | null
  /** "total" si el peso es de todo el ítem y no de cada bulto. */
  readonly alcance: (typeof ALCANCES_DEL_PESO)[number]
}

type Objeto = Record<string, unknown>

const esObjeto = (valor: unknown): valor is Objeto => typeof valor === 'object' && valor !== null && !Array.isArray(valor)
const esPositivo = (valor: unknown): valor is number => typeof valor === 'number' && Number.isFinite(valor) && valor > 0
const esUnaDe = <T extends string>(opciones: readonly T[], valor: unknown): valor is T => opciones.includes(valor as T)

function esLongitud(valor: unknown): valor is Longitud {
  return esObjeto(valor) && esPositivo(valor.valor) && (valor.unidad === null || esUnaDe(UNIDADES_DE_LONGITUD, valor.unidad))
}

function esPeso(valor: unknown): valor is Peso {
  return (
    esObjeto(valor) &&
    esPositivo(valor.valor) &&
    (valor.unidad === null || esUnaDe(UNIDADES_DE_PESO, valor.unidad)) &&
    esUnaDe(ALCANCES_DEL_PESO, valor.alcance)
  )
}

function esItem(valor: unknown, entradas: ReadonlySet<string>): valor is ItemDelModelo {
  return (
    esObjeto(valor) &&
    typeof valor.nombre === 'string' &&
    valor.nombre.trim() !== '' &&
    (valor.cantidad === null || (Number.isInteger(valor.cantidad) && esPositivo(valor.cantidad))) &&
    (valor.largo === null || esLongitud(valor.largo)) &&
    (valor.ancho === null || esLongitud(valor.ancho)) &&
    (valor.alto === null || esLongitud(valor.alto)) &&
    (valor.peso === null || esPeso(valor.peso)) &&
    // Un id que no está en el catálogo invalida la respuesta: nada se completa con algo
    // parecido (AC-17).
    (valor.entrada === null || (typeof valor.entrada === 'string' && entradas.has(valor.entrada)))
  )
}

/**
 * La respuesta leída, o null si no cumple el esquema: se descarta entera y no se muestra ningún
 * ítem de ella (RNF-09, AC-26). Las claves de más se ignoran; las que faltan la invalidan.
 */
export function leerRespuesta(texto: string, entradas: ReadonlySet<string>): RespuestaDelModelo | null {
  // Algunos modelos envuelven el JSON en un bloque de código aunque se les pida que no.
  const sinBloque = texto.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/, '$1')
  let datos: unknown
  try {
    datos = JSON.parse(sinBloque)
  } catch {
    return null
  }
  if (!esObjeto(datos) || !Array.isArray(datos.items)) return null
  if (!datos.items.every((item) => esItem(item, entradas))) return null
  return { items: datos.items }
}
