import type { BultoAfuera, BultoColocado, Contenedor, Disposicion, ItemListo, Orientacion } from '../dominio/tipos'
import { gramosExactos, mas, NADA, parte, pasaDe, type Exacto } from './exacto'

// RF-07: determinístico y sin el modelo de lenguaje. Puntos extremos: cada bulto va al primer
// punto libre más al fondo, más abajo y más a la izquierda donde entra respetando todas las
// restricciones de RF-08. No usa nada del validador: duplica sus cuentas a propósito.

interface Pieza {
  readonly item: ItemListo
  readonly indice: number
  readonly orden: number
}

interface Puesto {
  readonly pieza: Pieza
  readonly x0: number
  readonly y0: number
  readonly z0: number
  readonly x1: number
  readonly y1: number
  readonly z1: number
  /** Lo que tiene debajo, con el área de contacto. Nunca cambia: nada se mete debajo después. */
  readonly apoyos: readonly { readonly puesto: Puesto; readonly area: number }[]
}

interface Punto {
  readonly x: number
  readonly y: number
  readonly z: number
}

const TODAS: readonly Orientacion[] = [
  ['largo', 'ancho', 'alto'],
  ['ancho', 'largo', 'alto'],
  ['largo', 'alto', 'ancho'],
  ['alto', 'largo', 'ancho'],
  ['ancho', 'alto', 'largo'],
  ['alto', 'ancho', 'largo'],
]

/** Este lado arriba: el alto queda en z y en planta puede girar. */
const PARADAS: readonly Orientacion[] = TODAS.slice(0, 2)

const kilosAGramos = (kilos: number) => Math.round(kilos * 1000)

const volumenDe = (item: ItemListo) => item.largo * item.ancho * item.alto

/**
 * Orden de colocación (CONTEXTO.md): los no apilables al final; después, volumen decreciente;
 * a igual volumen, primero el que aguanta más peso encima. El resto, por orden en la lista.
 */
function ordenDeColocacion(items: readonly ItemListo[]): Pieza[] {
  const aguante = (item: ItemListo) => item.pesoMaximoEncima ?? Number.POSITIVE_INFINITY
  const ordenados = items
    .map((item, posicion) => ({ item, posicion }))
    .sort(
      (a, b) =>
        Number(a.item.noApilable) - Number(b.item.noApilable) ||
        volumenDe(b.item) - volumenDe(a.item) ||
        (aguante(b.item) === aguante(a.item) ? 0 : aguante(b.item) > aguante(a.item) ? 1 : -1) ||
        a.posicion - b.posicion,
    )
  let orden = 0
  return ordenados.flatMap(({ item }) => Array.from({ length: item.cantidad }, (_, indice) => ({ item, indice, orden: orden++ })))
}

function orientacionesDe(item: ItemListo): Orientacion[] {
  const posibles = item.orientacionObligatoria ? PARADAS : TODAS
  const vistas = new Set<string>()
  return posibles.filter((orientacion) => {
    const medidas = orientacion.map((medida) => item[medida]).join('x')
    if (vistas.has(medidas)) return false
    vistas.add(medidas)
    return true
  })
}

const seCruzan = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1

function contacto(a: { x0: number; x1: number; y0: number; y1: number }, b: { x0: number; x1: number; y0: number; y1: number }) {
  const dx = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const dy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  return dx > 0 && dy > 0 ? dx * dy : 0
}

/**
 * Un punto corrido hasta lo primero que encuentra hacia abajo, hacia el fondo y hacia la
 * izquierda: sin esto quedan huecos donde ninguna esquina cae justo.
 */
function proyecciones(punto: Punto, puestos: readonly Puesto[]): Punto[] {
  let z = 0
  let x = 0
  let y = 0
  for (const otro of puestos) {
    const enX = otro.x0 <= punto.x && punto.x < otro.x1
    const enY = otro.y0 <= punto.y && punto.y < otro.y1
    const enZ = otro.z0 <= punto.z && punto.z < otro.z1
    if (enX && enY && otro.z1 <= punto.z) z = Math.max(z, otro.z1)
    if (enY && enZ && otro.x1 <= punto.x) x = Math.max(x, otro.x1)
    if (enX && enZ && otro.y1 <= punto.y) y = Math.max(y, otro.y1)
  }
  return [
    { ...punto, z },
    { ...punto, x },
    { ...punto, y },
  ]
}

/** Primero el fondo (x), después abajo (z), después la izquierda (y). */
const porPrioridad = (a: Punto, b: Punto) => a.x - b.x || a.z - b.z || a.y - b.y

export function acomodar(items: readonly ItemListo[], contenedor: Contenedor): Disposicion {
  const cargaUtil = kilosAGramos(contenedor.cargaUtil)
  const puestos: Puesto[] = []
  const carga = new Map<Puesto, Exacto>()
  const colocados: BultoColocado[] = []
  const afuera: BultoAfuera[] = []
  let pesoCargado = 0
  let puntos: Punto[] = [{ x: 0, y: 0, z: 0 }]

  /** Lo que suma cada puesto de abajo si se carga `peso` sobre estos apoyos, o null si alguno no lo aguanta. */
  function repartir(apoyos: Puesto['apoyos'], peso: Exacto): Map<Puesto, Exacto> | null {
    const extra = new Map<Puesto, Exacto>()
    const bajar = (sobre: Puesto['apoyos'], transmitido: Exacto) => {
      const areaTotal = sobre.reduce((total, { area }) => total + area, 0)
      for (const { puesto, area } of sobre) {
        const recibe = parte(transmitido, area, areaTotal)
        extra.set(puesto, mas(extra.get(puesto) ?? NADA, recibe))
        bajar(puesto.apoyos, recibe)
      }
    }
    bajar(apoyos, peso)
    for (const [puesto, suma] of extra) {
      const maximo = puesto.pieza.item.pesoMaximoEncima
      if (maximo !== null && pasaDe(mas(carga.get(puesto)!, suma), kilosAGramos(maximo))) return null
    }
    return extra
  }

  function intentar(pieza: Pieza, punto: Punto, orientacion: Orientacion) {
    const [ejeX, ejeY, ejeZ] = orientacion
    const caja = {
      x0: punto.x,
      y0: punto.y,
      z0: punto.z,
      x1: punto.x + pieza.item[ejeX],
      y1: punto.y + pieza.item[ejeY],
      z1: punto.z + pieza.item[ejeZ],
    }
    if (caja.x1 > contenedor.largo || caja.y1 > contenedor.ancho || caja.z1 > contenedor.alto) return null

    const apoyos: { puesto: Puesto; area: number }[] = []
    for (const otro of puestos) {
      if (seCruzan(caja.x0, caja.x1, otro.x0, otro.x1) && seCruzan(caja.y0, caja.y1, otro.y0, otro.y1)) {
        if (seCruzan(caja.z0, caja.z1, otro.z0, otro.z1)) return null
        // Nada se mete debajo de lo ya cargado: así el peso de lo de arriba no se redistribuye.
        if (otro.z0 === caja.z1) return null
        if (otro.z1 === caja.z0) {
          if (otro.pieza.item.noApilable) return null
          apoyos.push({ puesto: otro, area: contacto(caja, otro) })
        }
      }
    }

    if (caja.z0 > 0) {
      const apoyado = apoyos.reduce((total, { area }) => total + area, 0)
      const base = (caja.x1 - caja.x0) * (caja.y1 - caja.y0)
      // Al menos el 80% de la base apoyada.
      if (apoyado * 5 < base * 4) return null
    }

    const extra = repartir(apoyos, gramosExactos(kilosAGramos(pieza.item.peso)))
    if (!extra) return null
    return { caja, apoyos, extra }
  }

  for (const pieza of ordenDeColocacion(items)) {
    const peso = kilosAGramos(pieza.item.peso)
    if (pesoCargado + peso > cargaUtil) {
      afuera.push({ item: pieza.item.id, indice: pieza.indice, motivo: 'peso' })
      continue
    }

    let elegido: { punto: Punto; orientacion: Orientacion; resultado: NonNullable<ReturnType<typeof intentar>> } | null = null
    buscar: for (const punto of puntos) {
      for (const orientacion of orientacionesDe(pieza.item)) {
        const resultado = intentar(pieza, punto, orientacion)
        if (resultado) {
          elegido = { punto, orientacion, resultado }
          break buscar
        }
      }
    }
    if (!elegido) {
      afuera.push({ item: pieza.item.id, indice: pieza.indice, motivo: 'volumen' })
      continue
    }

    const { punto, orientacion, resultado } = elegido
    const puesto: Puesto = { pieza, ...resultado.caja, apoyos: resultado.apoyos }
    for (const [abajo, suma] of resultado.extra) carga.set(abajo, mas(carga.get(abajo)!, suma))
    carga.set(puesto, NADA)
    puestos.push(puesto)
    pesoCargado += peso
    colocados.push({ item: pieza.item.id, indice: pieza.indice, x: punto.x, y: punto.y, z: punto.z, orientacion })

    const nuevos = [
      { x: puesto.x1, y: puesto.y0, z: puesto.z0 },
      { x: puesto.x0, y: puesto.y1, z: puesto.z0 },
      { x: puesto.x0, y: puesto.y0, z: puesto.z1 },
    ].flatMap((esquina) => [esquina, ...proyecciones(esquina, puestos)])
    const claves = new Set(puntos.map((p) => `${p.x},${p.y},${p.z}`))
    puntos = puntos
      .filter((p) => p !== punto)
      .concat(nuevos.filter((p) => !claves.has(`${p.x},${p.y},${p.z}`)))
      .sort(porPrioridad)
  }

  return { contenedor: contenedor.id, colocados, afuera }
}
