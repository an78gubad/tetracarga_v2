import { randomUUID } from 'node:crypto'
import { OBJETOS, type EntradaObjeto } from '../src/catalogo/objetos.js'
import type { Item } from '../src/dominio/tipos.js'
import { consultar, type Opciones, type Resultado } from './consultar.js'
import { leerRespuesta } from './esquema.js'
import type { Consulta, Modelo } from './modelo.js'
import { aItem } from './normalizar.js'

/** Alcanza para unos treinta ítems; más que eso no entra en una descripción de 2.000 caracteres. */
export const MAX_TOKENS_RESPUESTA = 2048

/**
 * El modelo extrae y asocia; no calcula ni completa. Las unidades, las divisiones y los datos que
 * faltan los resuelve el código (RF-02, RF-03).
 */
export function armarSistema(catalogo: readonly EntradaObjeto[]): string {
  const entradas = catalogo.map((entrada) => `- ${entrada.id}: ${entrada.nombre}`).join('\n')
  return `Convertís la descripción de una carga en una lista de ítems. Respondé solo con un objeto JSON, sin texto alrededor:

{"items": [{"nombre": string, "cantidad": entero o null, "largo": medida o null, "ancho": medida o null, "alto": medida o null, "peso": peso o null, "entrada": id o null}]}

medida: {"valor": número, "unidad": "mm" | "cm" | "m" | null}
peso: {"valor": número, "unidad": "kg" | "g" | "t" | null, "alcance": "unitario" | "total"}

Reglas:
- Un ítem por cada tipo de bulto, en el orden en que aparecen. La descripción puede venir de corrido, con varios ítems en una misma frase.
- Copiá cada número como está escrito, con su unidad. No conviertas unidades ni hagas cuentas. Si no dice la unidad, la unidad es null.
- "AxBxC" o "A por B por C" es largo, ancho y alto, en ese orden.
- "alcance" es "total" si el peso es de todo el ítem ("pesan 500 kg en total", "todo junto 2 toneladas"), y "unitario" si es de cada bulto.
- Lo que la descripción no dice va en null. No inventes ni estimes nada: tampoco la cantidad.
- Los litros son capacidad, no medidas: sirven para elegir la entrada, no para llenar largo, ancho ni alto.
- "entrada" es el id de la lista que corresponde al bulto, o null si ninguno corresponde. Usá solo estos ids:
${entradas}`
}

export function armarConsulta(descripcion: string): Consulta {
  return { sistema: armarSistema(OBJETOS), usuario: descripcion, maxTokens: MAX_TOKENS_RESPUESTA }
}

const CATALOGO: ReadonlyMap<string, EntradaObjeto> = new Map(OBJETOS.map((entrada) => [entrada.id, entrada]))
const IDS: ReadonlySet<string> = new Set(CATALOGO.keys())

export interface OpcionesDeInterpretacion extends Opciones {
  readonly nuevoId?: () => string
}

/**
 * La descripción convertida en ítems (RF-02, RF-03). Una respuesta fuera del esquema se descarta
 * entera y se vuelve a preguntar, como una vacía (AC-26).
 */
export function interpretar(
  modelo: Modelo,
  descripcion: string,
  { nuevoId = randomUUID, ...opciones }: OpcionesDeInterpretacion = {},
): Promise<Resultado<Item[]>> {
  const leer = (texto: string) => leerRespuesta(texto, IDS)?.items.map((item) => aItem(item, CATALOGO, nuevoId())) ?? null
  return consultar(modelo, armarConsulta(descripcion), leer, opciones)
}
